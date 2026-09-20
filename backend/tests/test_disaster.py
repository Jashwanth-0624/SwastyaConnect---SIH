"""
Unit Tests — Disaster Intelligence & Alert Escalation State Machine
"""

import pytest
from backend.models.schemas import WearableData, EnvironmentalContext, UserProfile, RiskAnalysisResult
from backend.services.disaster_service import DisasterService
from backend.services.alert_service import AlertEscalationService
from backend.services.risk_engine import HealthRiskEngine
from backend.services.baseline_engine import BaselineEngine


def test_disaster_scenario_switching():
    ds = DisasterService()
    cyclone_env = ds.set_disaster_scenario("CYCLONE")
    assert cyclone_env.disaster_type == "CYCLONE"
    assert cyclone_env.disaster_severity == "CRITICAL"
    
    protocol = ds.get_survival_protocol("CYCLONE")
    assert "shelter" in protocol.lower()


def test_disaster_offline_cache():
    ds = DisasterService()
    ds.set_disaster_scenario("HEAT_WAVE")
    cached = ds.get_cached_environment()
    assert cached.is_cached is True
    assert cached.ambient_temp > 40.0


def test_alert_escalation_false_positive_reduction():
    alert_svc = AlertEscalationService()
    risk_eng = HealthRiskEngine(BaselineEngine())
    profile = UserProfile()

    # 1 single critical sample (noisy artifact or momentary movement)
    critical_vitals = WearableData(hr=145.0, spo2=88.0, skin_temp=39.5, gsr=22.0)
    env = EnvironmentalContext(ambient_temp=42.0, humidity=40.0, aqi=100)
    risk_res = risk_eng.analyze_health_state(critical_vitals, env, profile)

    # First pass: Should NOT immediately trigger SOS
    state = alert_svc.process_risk_assessment(risk_res, profile)
    assert state.current_stage != "SOS_TRIGGERED"
    assert state.persistence_count == 2

    # Second consecutive critical pass: Reaches persistence threshold -> USER_CONFIRMATION
    state2 = alert_svc.process_risk_assessment(risk_res, profile)
    assert state2.current_stage == "USER_CONFIRMATION"

    # User confirms they are okay
    state_ok = alert_svc.user_confirms_ok()
    assert state_ok.current_stage == "NORMAL"
    assert state_ok.persistence_count == 0


@pytest.mark.anyio
async def test_privacy_preserving_emergency_sos():
    alert_svc = AlertEscalationService()
    risk_eng = HealthRiskEngine(BaselineEngine())
    profile = UserProfile(emergency_location_sharing=False)  # Privacy: Location sharing OFF

    critical_vitals = WearableData(hr=140.0, spo2=87.0, skin_temp=39.2, gsr=20.0)
    env = EnvironmentalContext(ambient_temp=40.0, humidity=50.0, aqi=120)
    risk_res = risk_eng.analyze_health_state(critical_vitals, env, profile)

    sos = await alert_svc.trigger_sos(
        risk=risk_res,
        profile=profile,
        is_manual=True,
        user_coords={"latitude": 28.6139, "longitude": 77.2090}
    )

    assert sos.status == "USER_CONFIRMED"
    # Verify location is NOT shared since user disabled emergency location sharing
    assert sos.location is None
    assert sos.vitals_summary is not None

