import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["app_name"] == "SwastyaConnect"
    assert data["status"] == "ONLINE"


def test_sensors_endpoint():
    res = client.get("/api/sensors/latest")
    assert res.status_code == 200
    data = res.json()
    assert "hr" in data and "spo2" in data and "skin_temp" in data and "gsr" in data



def test_sensor_status():
    res = client.get("/api/sensors/status")
    assert res.status_code == 200
    data = res.json()
    assert data["connected"] is True
    assert data["signal_quality_pct"] >= 50


def test_baseline_endpoint():
    res = client.get("/api/health/baseline")
    assert res.status_code == 200
    data = res.json()
    assert 50.0 <= data["hr_baseline"] <= 100.0


def test_risk_analysis_endpoint():
    res = client.get("/api/health/analyze")
    assert res.status_code == 200
    data = res.json()
    assert "overall_risk" in data
    assert "overall_level" in data
    assert "heat_stress_risk" in data
    assert "respiratory_risk" in data
    assert "cardiovascular_stress" in data
    assert "fatigue_risk" in data
    assert "explanation" in data
    assert len(data["recommendations"]) > 0


def test_daily_summary_endpoint():
    res = client.get("/api/health/daily-summary")
    assert res.status_code == 200
    data = res.json()
    assert "overall_health_risk" in data
    assert "daily_insight" in data


def test_trends_endpoint():
    for tf in ["TODAY", "7D", "30D"]:
        res = client.get(f"/api/health/trends?timeframe={tf}")
        assert res.status_code == 200
        data = res.json()
        assert len(data) > 0


def test_disaster_switching_and_protocols():
    res = client.post("/api/disaster/scenario", json={"scenario_type": "HEAT_WAVE"})
    assert res.status_code == 200
    data = res.json()
    assert data["disaster_type"] == "HEAT_WAVE"

    proto_res = client.get("/api/disaster/protocols")
    assert proto_res.status_code == 200
    assert "active_protocol" in proto_res.json()


def test_emergency_workflow():
    # Trigger SOS
    sos_res = client.post("/api/emergency/trigger-sos", json={"user_coords": {"latitude": 28.6139, "longitude": 77.2090}})
    assert sos_res.status_code == 200
    sos_data = sos_res.json()
    assert "alert_id" in sos_data

    # Check alert state
    state_res = client.get("/api/emergency/state")
    assert state_res.status_code == 200
    assert state_res.json()["current_stage"] == "SOS_TRIGGERED"

    # Confirm safe / reset
    ok_res = client.post("/api/emergency/confirm-ok")
    assert ok_res.status_code == 200
    assert ok_res.json()["current_stage"] == "NORMAL"


def test_simulation_scenarios_listing_and_apply():
    scenarios_res = client.get("/api/simulation/scenarios")
    assert scenarios_res.status_code == 200
    scenarios = scenarios_res.json()
    assert len(scenarios) == 5

    apply_res = client.post("/api/simulation/apply", json={"scenario_id": "SCENARIO_POLLUTION"})
    assert apply_res.status_code == 200
    assert apply_res.json()["status"] == "success"

