"""
Unit Tests — Multi-Sensor AI Risk Engine
"""

import pytest
from backend.models.schemas import WearableData, EnvironmentalContext, UserProfile
from backend.services.baseline_engine import BaselineEngine
from backend.services.risk_engine import HealthRiskEngine


def test_normal_risk_assessment():
    engine = HealthRiskEngine(BaselineEngine())
    normal_vitals = WearableData(hr=72.0, spo2=98.5, skin_temp=36.6, gsr=4.2)
    normal_env = EnvironmentalContext(ambient_temp=30.0, humidity=50.0, aqi=75, pm25=25.0)

    result = engine.analyze_health_state(normal_vitals, normal_env)
    assert result.overall_level == "LOW"
    assert result.overall_risk < 30.0
    assert result.heat_stress_risk < 30.0
    assert result.respiratory_risk < 30.0
    assert "SwastyaConnect is intended for wellness monitoring" in result.disclaimer


def test_heat_stress_scenario():
    engine = HealthRiskEngine(BaselineEngine())
    heat_vitals = WearableData(
        hr=115.0,  # Elevated HR
        spo2=97.0,
        skin_temp=38.8,  # Elevated skin temp
        gsr=18.0  # High sweating conductance
    )
    heat_env = EnvironmentalContext(
        ambient_temp=44.5,
        humidity=40.0,
        aqi=140,
        pm25=55.0,
        disaster_type="HEAT_WAVE",
        disaster_severity="WARNING"
    )

    result = engine.analyze_health_state(heat_vitals, heat_env)
    assert result.heat_stress_level in ("HIGH", "CRITICAL")
    assert result.heat_stress_risk >= 70.0
    assert result.overall_level in ("HIGH", "CRITICAL")
    assert any("temperature" in f.description.lower() for f in result.contributing_factors)
    assert any("cool" in r.lower() or "shade" in r.lower() for r in result.recommendations)


def test_respiratory_risk_scenario():
    engine = HealthRiskEngine(BaselineEngine())
    resp_vitals = WearableData(
        hr=96.0,
        spo2=90.5,  # Low oxygen saturation
        skin_temp=36.7,
        gsr=5.5
    )
    smog_env = EnvironmentalContext(
        ambient_temp=22.0,
        humidity=75.0,
        aqi=380,  # Severe AQI smog
        pm25=210.0,
        disaster_type="AIR_POLLUTION",
        disaster_severity="WARNING"
    )

    result = engine.analyze_health_state(resp_vitals, smog_env)
    assert result.respiratory_level in ("HIGH", "CRITICAL")
    assert result.respiratory_risk >= 65.0
    assert any("SpO₂" in f.description or "Air Quality" in f.name for f in result.contributing_factors)


def test_cardiovascular_stress_scenario():
    engine = HealthRiskEngine(BaselineEngine())
    cardio_vitals = WearableData(
        hr=135.0,  # Marked tachycardia (+87% over 72 bpm baseline)
        spo2=95.0,
        skin_temp=37.1,
        gsr=8.0
    )
    env = EnvironmentalContext(ambient_temp=30.0, humidity=50.0, aqi=60)

    result = engine.analyze_health_state(cardio_vitals, env)
    assert result.cardiovascular_stress >= 60.0
    assert result.cardiovascular_level in ("HIGH", "CRITICAL")
