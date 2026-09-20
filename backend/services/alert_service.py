"""
SwastyaConnect — Alert Escalation & False-Positive Reduction Service
Implements a multi-stage alert state machine that requires temporal persistence
and multi-sensor confirmation before escalating to emergency workflows.
"""

from typing import Optional, Dict, Any, List
import time
import uuid
from ..models.schemas import (
    RiskAnalysisResult,
    AlertEscalationState,
    EmergencySOSPayload,
    UserProfile,
    EmergencyContact
)


class AlertEscalationService:
    """Manages the progressive health alert escalation pipeline."""

    def __init__(self):
        self.state = AlertEscalationState()
        self.snooze_until = 0.0
        self.active_sos_payload: Optional[EmergencySOSPayload] = None
        self.anomaly_history = []
        self.persistence_threshold = 3  # Requires 3 consecutive abnormal windows

    def process_risk_assessment(
        self,
        risk: RiskAnalysisResult,
        profile: UserProfile = None
    ) -> AlertEscalationState:
        """
        Evaluates risk output and updates the alert escalation state machine.
        Avoids single-sample false alarms via temporal persistence tracking.
        """
        now = time.time()
        profile = profile or UserProfile()

        # Check if snoozed
        if now < self.snooze_until:
            return self.state

        level = risk.overall_level

        if level == "CRITICAL":
            self.state.persistence_count += 2  # Critical anomalies escalate faster
            self.state.active_anomaly_type = risk.primary_concern or "Critical Multi-Vital Strain"
            
            if self.state.persistence_count >= self.persistence_threshold:
                if self.state.current_stage != "SOS_TRIGGERED":
                    self.state.current_stage = "USER_CONFIRMATION"
                    self.state.message = "Critical physiological strain detected. Are you okay? Please confirm."
            else:
                self.state.current_stage = "HIGH"
                self.state.message = f"High alert: {risk.primary_concern}. Monitoring persistence..."

        elif level == "HIGH":
            self.state.persistence_count += 1
            self.state.active_anomaly_type = risk.primary_concern
            
            if self.state.persistence_count >= (self.persistence_threshold + 1):
                if self.state.current_stage not in ("USER_CONFIRMATION", "SOS_TRIGGERED"):
                    self.state.current_stage = "HIGH"
                    self.state.message = f"Sustained elevated risk: {risk.primary_concern}. Take rest."
            else:
                self.state.current_stage = "MODERATE"
                self.state.message = f"Elevated reading detected ({risk.primary_concern}). Verifying trend..."

        elif level == "MODERATE":
            self.state.persistence_count = max(0, self.state.persistence_count - 1)
            if self.state.current_stage not in ("HIGH", "USER_CONFIRMATION", "SOS_TRIGGERED"):
                self.state.current_stage = "ANOMALY"
                self.state.message = "Mild physiological deviation observed. Stay hydrated."

        else:  # LOW / NORMAL
            self.state.persistence_count = max(0, self.state.persistence_count - 2)
            if self.state.persistence_count == 0 and self.state.current_stage != "SOS_TRIGGERED":
                self.state.current_stage = "NORMAL"
                self.state.active_anomaly_type = None
                self.state.message = "All vitals are within normal personal ranges."

        self.state.last_event_time = now
        return self.state

    def dismiss_alert(self) -> AlertEscalationState:
        """User explicitly dismisses current warning."""
        self.state.current_stage = "NORMAL"
        self.state.persistence_count = 0
        self.state.active_anomaly_type = None
        self.state.message = "Alert dismissed by user. Resuming regular monitoring."
        return self.state

    def snooze_alert(self, minutes: int = 15) -> AlertEscalationState:
        """Snoozes alerts for the specified duration."""
        self.snooze_until = time.time() + (minutes * 60)
        self.state.current_stage = "NORMAL"
        self.state.message = f"Alerts snoozed for {minutes} minutes."
        return self.state

    def user_confirms_ok(self) -> AlertEscalationState:
        """User responds to confirmation prompt stating they are safe."""
        self.state.current_stage = "NORMAL"
        self.state.persistence_count = 0
        self.state.message = "User confirmed safe. Resuming baseline monitoring."
        if self.active_sos_payload:
            self.active_sos_payload.status = "USER_CONFIRMED"
        return self.state

    async def trigger_sos(
        self,
        risk: RiskAnalysisResult,
        profile: UserProfile,
        is_manual: bool = False,
        user_coords: Optional[Dict[str, float]] = None,
        vitals: Optional[Any] = None
    ) -> EmergencySOSPayload:
        """
        Triggers emergency assistance workflow, generates privacy-respecting SOS payload,
        and automatically dispatches automated IVRS voice calls and emergency SMS messages.
        """
        self.state.current_stage = "SOS_TRIGGERED"
        self.state.message = "Emergency SOS active. Automated IVRS voice call and SMS dispatched to emergency contacts."

        # Filter shared data strictly based on user privacy consent
        location_data = None
        if profile.emergency_location_sharing and user_coords:
            location_data = {
                "latitude": user_coords.get("latitude", 28.6139),
                "longitude": user_coords.get("longitude", 77.2090),
                "accuracy_m": user_coords.get("accuracy", 15.0),
                "consent_granted": True
            }

        # Automatically broadcast IVRS voice call and SMS
        from .telephony_service import telephony_service
        telephony_logs = await telephony_service.dispatch_emergency_broadcast(
            contacts=profile.emergency_contacts,
            user_name=profile.name,
            risk=risk,
            vitals=vitals,
            location=location_data
        )

        payload = EmergencySOSPayload(
            alert_id=f"sos_{uuid.uuid4().hex[:8]}",
            timestamp=time.time(),
            user_name=profile.name,
            risk_level=risk.overall_level,
            primary_concern=risk.primary_concern or "Physiological Distress Event",
            vitals_summary={
                "hr_bpm": risk.hr_deviation_pct,
                "spo2_pct": risk.spo2_deviation_pct,
                "temp_c": risk.temp_deviation_deg,
                "overall_risk_score": risk.overall_risk,
                "heat_stress_score": risk.heat_stress_risk,
                "respiratory_score": risk.respiratory_risk
            },
            location=location_data,
            contacts_notified=profile.emergency_contacts,
            status="USER_CONFIRMED" if is_manual else "TIMEOUT_TRIGGERED",
            telephony_logs=telephony_logs
        )

        self.active_sos_payload = payload
        return payload

    def cancel_sos(self) -> AlertEscalationState:
        """Cancels active SOS."""
        self.state.current_stage = "NORMAL"
        self.state.persistence_count = 0
        self.state.message = "Emergency SOS cancelled."
        if self.active_sos_payload:
            self.active_sos_payload.status = "CANCELLED"
        return self.state


# Global singleton instance
alert_service = AlertEscalationService()

