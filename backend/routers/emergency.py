"""
SwastyaConnect — Emergency & SOS Router
Handles alert escalation state queries, confirmations, snooze, dismissal,
emergency contacts management, and SOS dispatch with privacy-first data filters.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from ..models.schemas import (
    AlertEscalationState,
    EmergencySOSPayload,
    UserProfile,
    EmergencyContact
)
from ..services.alert_service import alert_service
from ..services.risk_engine import risk_engine
from ..services.simulation_service import simulation_service
from ..services.disaster_service import disaster_service
from .health import current_user_profile

router = APIRouter(prefix="/api/emergency", tags=["Emergency & SOS"])


class SnoozeRequest(BaseModel):
    minutes: int = 15


class ManualSOSRequest(BaseModel):
    user_coords: Optional[Dict[str, float]] = None


from ..services.telephony_service import telephony_service


class DirectIVRSRequest(BaseModel):
    recipient_name: Optional[str] = "Dr. Sharma"
    recipient_phone: Optional[str] = "+91 98765 43210"
    custom_script: Optional[str] = None


class DirectSMSRequest(BaseModel):
    recipient_name: Optional[str] = "Priya"
    recipient_phone: Optional[str] = "+91 98123 45678"
    custom_text: Optional[str] = None


@router.get("/state", response_model=AlertEscalationState)
async def get_alert_state():
    """Returns the current state in the false-positive reduced alert escalation state machine."""
    return alert_service.state


@router.post("/dismiss", response_model=AlertEscalationState)
async def dismiss_alert():
    """Dismisses active warning and resets escalation counters."""
    return alert_service.dismiss_alert()


@router.post("/snooze", response_model=AlertEscalationState)
async def snooze_alert(req: SnoozeRequest):
    """Snoozes alert notifications for a specified duration."""
    return alert_service.snooze_alert(req.minutes)


@router.post("/confirm-ok", response_model=AlertEscalationState)
async def confirm_user_is_ok():
    """User confirms they are safe, stopping emergency countdown."""
    return alert_service.user_confirms_ok()


@router.post("/trigger-sos", response_model=EmergencySOSPayload)
async def trigger_manual_sos(req: ManualSOSRequest):
    """Manually triggers emergency SOS with automated IVRS voice call and SMS dispatch."""
    vitals = simulation_service.read_latest()
    env = disaster_service.get_current_environment()
    risk = risk_engine.analyze_health_state(vitals, env, current_user_profile)
    
    return await alert_service.trigger_sos(
        risk=risk,
        profile=current_user_profile,
        is_manual=True,
        user_coords=req.user_coords,
        vitals=vitals
    )


@router.post("/cancel-sos", response_model=AlertEscalationState)
async def cancel_active_sos():
    """Cancels active SOS."""
    return alert_service.cancel_sos()


@router.post("/dispatch-ivrs-call")
async def dispatch_direct_ivrs_call(req: DirectIVRSRequest):
    """Directly triggers an automated IVRS voice alert call."""
    vitals = simulation_service.read_latest()
    env = disaster_service.get_current_environment()
    risk = risk_engine.analyze_health_state(vitals, env, current_user_profile)
    
    script = req.custom_script or telephony_service.generate_ivrs_speech_script(
        user_name=current_user_profile.name,
        risk=risk,
        vitals=vitals
    )
    
    log = await telephony_service.trigger_ivrs_call(
        recipient_name=req.recipient_name,
        recipient_phone=req.recipient_phone,
        speech_script=script
    )
    telephony_service.dispatch_history.append(log)
    return log


@router.post("/dispatch-sms")
async def dispatch_direct_sms(req: DirectSMSRequest):
    """Directly triggers an emergency SMS text notification."""
    vitals = simulation_service.read_latest()
    env = disaster_service.get_current_environment()
    risk = risk_engine.analyze_health_state(vitals, env, current_user_profile)
    
    text = req.custom_text or telephony_service.generate_sms_text(
        user_name=current_user_profile.name,
        risk=risk,
        vitals=vitals
    )
    
    log = await telephony_service.send_emergency_sms(
        recipient_name=req.recipient_name,
        recipient_phone=req.recipient_phone,
        message_text=text
    )
    telephony_service.dispatch_history.append(log)
    return log


@router.get("/telephony-logs")
async def get_telephony_logs():
    """Returns historical log of dispatched IVRS voice calls and SMS broadcasts."""
    return {
        "total_dispatches": len(telephony_service.dispatch_history),
        "logs": list(reversed(telephony_service.dispatch_history[-30:]))
    }


@router.get("/profile", response_model=UserProfile)
async def get_user_profile():
    """Returns user profile, vulnerability settings, and privacy permissions."""
    return current_user_profile


@router.post("/profile", response_model=UserProfile)
async def update_user_profile(updated_profile: UserProfile):
    """Updates user profile and emergency configuration."""
    global current_user_profile
    current_user_profile = updated_profile
    return current_user_profile

