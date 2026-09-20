"""
Unit Tests — Personal Baseline Engine
"""

import pytest
from backend.models.schemas import WearableData, PersonalBaseline
from backend.services.baseline_engine import BaselineEngine


def test_initial_baseline():
    engine = BaselineEngine()
    assert engine.baseline.hr_baseline == 72.0
    assert engine.baseline.spo2_baseline == 98.0
    assert engine.baseline.skin_temp_baseline == 36.5
    assert engine.baseline.confidence >= 0.5


def test_deviation_calculation():
    engine = BaselineEngine()
    engine.baseline.hr_baseline = 70.0
    engine.baseline.hr_max = 84.0
    engine.baseline.spo2_baseline = 98.0
    engine.baseline.skin_temp_baseline = 36.5

    data = WearableData(
        hr=105.0,  # 50% above 70 BPM
        spo2=92.0,  # Below normal
        skin_temp=38.0,  # +1.5°C above baseline
        gsr=12.0
    )

    devs = engine.compute_deviations(data)
    assert devs["hr_deviation_pct"] == 50.0
    assert devs["temp_deviation_deg"] == 1.5
    assert devs["is_hr_elevated"] is True
    assert devs["is_spo2_depressed"] is True
    assert devs["is_temp_elevated"] is True


def test_baseline_learning_update():
    engine = BaselineEngine()
    initial_samples = engine.baseline.samples_count
    
    # Stable resting telemetry
    stable_data = WearableData(
        hr=74.0,
        spo2=98.0,
        skin_temp=36.6,
        gsr=4.5,
        signal_quality=0.95,
        motion_intensity=0.1
    )
    
    updated = engine.update_baseline(stable_data, alpha=0.1)
    assert updated.samples_count == initial_samples + 1
    assert updated.hr_baseline > 72.0  # Moves slightly towards 74.0
