"""
SwastyaConnect — Simulation & Demo Scenario Engine
Generates realistic physiological telemetry streams and Indian environmental conditions
for live demonstrations, testing, and edge AI validation.
"""

from typing import Dict, List, Optional
import math
import random
import time
from ..models.schemas import (
    WearableData,
    EnvironmentalContext,
    SimulationScenario,
    HistoricalDataPoint
)
from .sensor_provider import WearableDataProvider, signal_processor
from .disaster_service import disaster_service


class SimulationService(WearableDataProvider):
    """Generates continuous simulated physiological telemetry and scenarios."""

    def __init__(self):
        self.active_scenario_id = "SCENARIO_NORMAL"
        self.manual_override = False
        self.last_hardware_timestamp: Optional[float] = None
        
        # Base target values
        self.target_hr = 72.0
        self.target_spo2 = 98.0
        self.target_temp = 36.6
        self.target_gsr = 4.5
        self.motion_intensity = 0.05
        
        # Current interpolated values
        self.current_vitals = WearableData(
            hr=72.0,
            spo2=98.0,
            skin_temp=36.6,
            gsr=4.5,
            timestamp=time.time(),
            is_simulated=True,
            signal_quality=0.98,
            motion_intensity=0.05
        )

        self.scenarios = {
            "SCENARIO_NORMAL": SimulationScenario(
                id="SCENARIO_NORMAL",
                name="Scenario 1 — Normal Baseline",
                description="Healthy resting state with physiological parameters within personal baseline bounds.",
                vitals=WearableData(hr=72.0, spo2=98.5, skin_temp=36.6, gsr=4.2, is_simulated=True),
                environment=disaster_service.disaster_scenarios["NONE"]
            ),
            "SCENARIO_HEAT_STRESS": SimulationScenario(
                id="SCENARIO_HEAT_STRESS",
                name="Scenario 2 — Heat Stress & Thermal Strain",
                description="High ambient heatwave with elevated skin temperature, compensatory tachycardia, and sweating conductance.",
                vitals=WearableData(hr=114.0, spo2=97.0, skin_temp=38.7, gsr=18.5, is_simulated=True, motion_intensity=0.3),
                environment=disaster_service.disaster_scenarios["HEAT_WAVE"]
            ),
            "SCENARIO_POLLUTION": SimulationScenario(
                id="SCENARIO_POLLUTION",
                name="Scenario 3 — Urban Air Pollution Crisis",
                description="Hazardous AQI smog with noticeable blood oxygen desaturation and mild compensatory heart rate.",
                vitals=WearableData(hr=94.0, spo2=91.0, skin_temp=36.7, gsr=6.5, is_simulated=True),
                environment=disaster_service.disaster_scenarios["AIR_POLLUTION"]
            ),
            "SCENARIO_FATIGUE": SimulationScenario(
                id="SCENARIO_FATIGUE",
                name="Scenario 4 — Physical Fatigue & Exertion",
                description="Delayed cardiovascular recovery and prolonged sympathetic nervous strain after sustained activity.",
                vitals=WearableData(hr=102.0, spo2=96.0, skin_temp=37.4, gsr=12.0, is_simulated=True, motion_intensity=0.15),
                environment=disaster_service.disaster_scenarios["NONE"]
            ),
            "SCENARIO_CRITICAL_DISTRESS": SimulationScenario(
                id="SCENARIO_CRITICAL_DISTRESS",
                name="Scenario 5 — Multi-Sensor Critical Distress",
                description="Severe multi-vital breakdown (severe hypoxia, tachycardia, hyperthermia) triggering SOS escalation.",
                vitals=WearableData(hr=138.0, spo2=87.0, skin_temp=39.4, gsr=24.0, is_simulated=True, motion_intensity=0.1),
                environment=disaster_service.disaster_scenarios["HEAT_WAVE"]
            )
        }

    def is_hardware_active(self) -> bool:
        """Returns True if live hardware telemetry has been received within the last 20 seconds."""
        if self.last_hardware_timestamp is None:
            return False
        return (time.time() - self.last_hardware_timestamp) < 20.0

    def apply_hardware_vitals(self, hardware_vitals: WearableData):
        """Applies verified real-time telemetry from physical ESP32 hardware."""
        self.last_hardware_timestamp = time.time()
        self.manual_override = False
        hardware_vitals.is_simulated = False
        hardware_vitals.timestamp = time.time()
        self.target_hr = hardware_vitals.hr
        self.target_spo2 = hardware_vitals.spo2
        self.target_temp = hardware_vitals.skin_temp
        self.target_gsr = hardware_vitals.gsr
        self.current_vitals = hardware_vitals.model_copy()

    def read_latest(self) -> WearableData:
        """Returns the current vital reading: physical ESP32 feed if active, or simulated stream."""
        if self.is_hardware_active():
            # Return live physical hardware vitals directly from ESP32
            self.current_vitals.is_simulated = False
            return self.current_vitals

        # Fallback to simulated micro-variation when no hardware packets are arriving

        jitter_hr = (random.random() - 0.5) * 1.5
        jitter_spo2 = (random.random() - 0.5) * 0.4
        jitter_temp = (random.random() - 0.5) * 0.05
        jitter_gsr = (random.random() - 0.5) * 0.2

        self.current_vitals.hr = round(0.85 * self.current_vitals.hr + 0.15 * (self.target_hr + jitter_hr), 1)
        self.current_vitals.spo2 = round(0.85 * self.current_vitals.spo2 + 0.15 * (self.target_spo2 + jitter_spo2), 1)
        self.current_vitals.skin_temp = round(0.85 * self.current_vitals.skin_temp + 0.15 * (self.target_temp + jitter_temp), 2)
        self.current_vitals.gsr = round(0.85 * self.current_vitals.gsr + 0.15 * (self.target_gsr + jitter_gsr), 2)
        self.current_vitals.timestamp = time.time()
        self.current_vitals.is_simulated = True

        return signal_processor.clean_and_smooth(self.current_vitals)

    def is_connected(self) -> bool:
        return True

    def get_source_type(self) -> str:
        return "ESP32_HARDWARE" if self.is_hardware_active() else "SIMULATED"

    def apply_scenario(self, scenario_id: str) -> SimulationScenario:
        """Loads a predefined demonstration scenario."""
        if scenario_id in self.scenarios:
            self.active_scenario_id = scenario_id
            self.manual_override = False
            self.last_hardware_timestamp = None  # Reset hardware latch on manual scenario pick
            scenario = self.scenarios[scenario_id]
            
            # Set target vitals
            self.target_hr = scenario.vitals.hr
            self.target_spo2 = scenario.vitals.spo2
            self.target_temp = scenario.vitals.skin_temp
            self.target_gsr = scenario.vitals.gsr
            self.motion_intensity = scenario.vitals.motion_intensity
            
            # Set environment
            dis_type = scenario.environment.get("disaster_type", "NONE") if isinstance(scenario.environment, dict) else getattr(scenario.environment, "disaster_type", "NONE")
            disaster_service.set_disaster_scenario(dis_type)
            return scenario
        raise ValueError(f"Unknown scenario ID: {scenario_id}")

    def apply_custom_vitals(self, custom: WearableData):
        """Applies manual slider adjustments from the demo console."""
        self.manual_override = True
        self.target_hr = custom.hr
        self.target_spo2 = custom.spo2
        self.target_temp = custom.skin_temp
        self.target_gsr = custom.gsr
        self.motion_intensity = custom.motion_intensity
        self.current_vitals = custom.model_copy()


    def generate_historical_trends(self, timeframe: str = "TODAY") -> List[HistoricalDataPoint]:
        """Generates realistic historical trend curves for charting (Today, 7D, 30D)."""
        points = []
        now = time.time()
        
        if timeframe == "TODAY":
            # 24 hours in 1-hour increments
            for i in range(24):
                hour_offset = (23 - i) * 3600
                t = now - hour_offset
                hour = (time.localtime(t).tm_hour)
                
                # Diurnal variation: higher temp/HR in afternoon (14:00 - 16:00)
                is_afternoon = 13 <= hour <= 17
                base_hr = 74.0 + (12.0 if is_afternoon else 0.0) + (random.random() - 0.5) * 4.0
                base_spo2 = 98.0 - (1.0 if is_afternoon else 0.0) + (random.random() - 0.5) * 1.0
                base_temp = 36.5 + (0.6 if is_afternoon else 0.0) + (random.random() - 0.5) * 0.1
                base_gsr = 4.5 + (4.0 if is_afternoon else 0.0) + (random.random() - 0.5) * 0.5
                
                heat_risk = 58.0 if is_afternoon else 22.0
                overall = max(heat_risk * 0.8, 18.0)

                points.append(HistoricalDataPoint(
                    timestamp=t,
                    time_label=f"{hour:02d}:00",
                    hr=round(base_hr, 1),
                    spo2=round(base_spo2, 1),
                    skin_temp=round(base_temp, 2),
                    gsr=round(base_gsr, 2),
                    overall_risk=round(overall, 1),
                    heat_stress_risk=round(heat_risk, 1),
                    respiratory_risk=round(25.0 + (random.random() * 10.0), 1),
                    cardiovascular_stress=round(base_hr * 0.4, 1),
                    fatigue_risk=round(30.0 + (15.0 if is_afternoon else 0.0), 1)
                ))
        elif timeframe == "7D":
            # 7 daily aggregations
            days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            for i in range(7):
                t = now - ((6 - i) * 86400)
                day_label = days[i % 7]
                points.append(HistoricalDataPoint(
                    timestamp=t,
                    time_label=day_label,
                    hr=round(73.0 + random.random() * 6.0, 1),
                    spo2=round(97.5 + random.random() * 1.5, 1),
                    skin_temp=round(36.5 + random.random() * 0.4, 2),
                    gsr=round(4.8 + random.random() * 2.0, 2),
                    overall_risk=round(24.0 + random.random() * 18.0, 1),
                    heat_stress_risk=round(28.0 + random.random() * 25.0, 1),
                    respiratory_risk=round(20.0 + random.random() * 15.0, 1),
                    cardiovascular_stress=round(30.0 + random.random() * 12.0, 1),
                    fatigue_risk=round(25.0 + random.random() * 15.0, 1)
                ))
        else:  # 30D
            for i in range(30):
                t = now - ((29 - i) * 86400)
                day_num = i + 1
                points.append(HistoricalDataPoint(
                    timestamp=t,
                    time_label=f"Day {day_num}",
                    hr=round(72.0 + random.random() * 8.0, 1),
                    spo2=round(97.0 + random.random() * 2.0, 1),
                    skin_temp=round(36.4 + random.random() * 0.5, 2),
                    gsr=round(4.5 + random.random() * 3.0, 2),
                    overall_risk=round(22.0 + random.random() * 20.0, 1),
                    heat_stress_risk=round(25.0 + random.random() * 30.0, 1),
                    respiratory_risk=round(22.0 + random.random() * 18.0, 1),
                    cardiovascular_stress=round(28.0 + random.random() * 15.0, 1),
                    fatigue_risk=round(26.0 + random.random() * 20.0, 1)
                ))

        return points


# Global singleton instance
simulation_service = SimulationService()
