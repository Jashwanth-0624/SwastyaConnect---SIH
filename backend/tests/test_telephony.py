"""
Unit Tests — Telephony, Automated IVRS Voice Call & SMS Service
"""

import pytest
from backend.models.schemas import WearableData, RiskAnalysisResult, UserProfile, EmergencyContact
from backend.services.telephony_service import TelephonyService
from backend.services.alert_service import AlertEscalationService


@pytest.mark.anyio
async def test_ivrs_speech_script_generation():
    telephony = TelephonyService()
    vitals = WearableData(hr=138.0, spo2=87.0, skin_temp=39.4, gsr=24.0)
    risk = RiskAnalysisResult(
        overall_risk=88.5,
        overall_level="CRITICAL",
        heat_stress_risk=85.0,
        heat_stress_level="CRITICAL",
        respiratory_risk=78.0,
        respiratory_level="HIGH",
        cardiovascular_stress=82.0,
        cardiovascular_level="CRITICAL",
        fatigue_risk=65.0,
        fatigue_level="HIGH",
        primary_concern="Severe Multi-System Strain",
        explanation="Critical physiological distress detected.",
        recommendations=["Seek immediate assistance"]
    )

    script = telephony.generate_ivrs_speech_script(
        user_name="Jashwanth",
        risk=risk,
        vitals=vitals,
        location={"latitude": 28.6139, "longitude": 77.2090, "consent_granted": True}
    )

    assert "SwastyaConnect" in script
    assert "Jashwanth" in script
    assert "138 beats per minute" in script
    assert "87 percent" in script
    assert "39.4 degrees Celsius" in script
    assert "latitude 28.6139" in script


@pytest.mark.anyio
async def test_sms_payload_generation():
    telephony = TelephonyService()
    vitals = WearableData(hr=138.0, spo2=87.0, skin_temp=39.4, gsr=24.0)
    risk = RiskAnalysisResult(
        overall_risk=88.5,
        overall_level="CRITICAL",
        heat_stress_risk=85.0,
        heat_stress_level="CRITICAL",
        respiratory_risk=78.0,
        respiratory_level="HIGH",
        cardiovascular_stress=82.0,
        cardiovascular_level="CRITICAL",
        fatigue_risk=65.0,
        fatigue_level="HIGH",
        primary_concern="Critical Multi-Vital Strain",
        explanation="Emergency state.",
        recommendations=[]
    )

    sms_text = telephony.generate_sms_text(
        user_name="Jashwanth",
        risk=risk,
        vitals=vitals,
        location={"latitude": 28.6139, "longitude": 77.2090, "consent_granted": True}
    )

    assert "SwastyaConnect SOS" in sms_text
    assert "HR 138 BPM" in sms_text
    assert "SpO2 87%" in sms_text
    assert "maps.google.com" in sms_text


@pytest.mark.anyio
async def test_automatic_sos_telephony_broadcast():
    alert_svc = AlertEscalationService()
    profile = UserProfile(
        name="Jashwanth",
        emergency_contacts=[
            EmergencyContact(id="ec1", name="Dr. Sharma", phone="+91 98765 43210", relationship="Doctor", is_primary=True)
        ]
    )
    vitals = WearableData(hr=140.0, spo2=86.0, skin_temp=39.5, gsr=22.0)
    risk = RiskAnalysisResult(
        overall_risk=92.0,
        overall_level="CRITICAL",
        heat_stress_risk=90.0,
        heat_stress_level="CRITICAL",
        respiratory_risk=85.0,
        respiratory_level="CRITICAL",
        cardiovascular_stress=88.0,
        cardiovascular_level="CRITICAL",
        fatigue_risk=70.0,
        fatigue_level="HIGH",
        primary_concern="Critical Multi-Vital Collapse",
        explanation="Severe distress.",
        recommendations=[]
    )

    sos = await alert_svc.trigger_sos(
        risk=risk,
        profile=profile,
        is_manual=False,
        vitals=vitals
    )

    assert sos.status == "TIMEOUT_TRIGGERED"
    assert len(sos.telephony_logs) >= 2  # 1 IVRS Voice Call + 1 SMS
    assert any(log.dispatch_type == "IVRS_VOICE_CALL" for log in sos.telephony_logs)
    assert any(log.dispatch_type == "EMERGENCY_SMS" for log in sos.telephony_logs)
