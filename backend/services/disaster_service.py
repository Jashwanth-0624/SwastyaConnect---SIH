"""
SwastyaConnect — Disaster Intelligence Service
Monitors environmental threats tailored to Indian meteorological & disaster profiles
(Indian Heat Waves, North India Winter Smog / Air Pollution, Bay of Bengal/Arabian Sea Cyclones,
Monsoon Urban Floods, and Extreme Weather). Supports offline caching.
"""

from typing import Dict, List, Any
import time
from ..models.schemas import EnvironmentalContext


class DisasterService:
    """Manages environmental feeds, Indian disaster scenarios, and offline caching."""

    def __init__(self):
        # Default starting environment (realistic Indian baseline: New Delhi / Central India)
        self.current_env = EnvironmentalContext(
            ambient_temp=33.5,
            humidity=52.0,
            aqi=110,
            pm25=42.0,
            weather_condition="Hazy Sunshine",
            disaster_type="NONE",
            disaster_severity="NONE",
            location_name="New Delhi, India",
            is_cached=False,
            timestamp=time.time()
        )
        self.cached_env = self.current_env.model_copy()

        # Predefined Indian Disaster Profiles
        self.disaster_scenarios = {
            "NONE": {
                "name": "Normal Weather",
                "ambient_temp": 31.0,
                "humidity": 50.0,
                "aqi": 80,
                "pm25": 28.0,
                "weather_condition": "Clear Sky",
                "disaster_type": "NONE",
                "disaster_severity": "NONE",
                "location_name": "Bengaluru, Karnataka",
                "protocol": "Routine daily activity. Maintain standard hydration."
            },
            "HEAT_WAVE": {
                "name": "Severe Indian Heatwave (North/Central India)",
                "ambient_temp": 44.5,
                "humidity": 38.0,
                "aqi": 165,
                "pm25": 68.0,
                "weather_condition": "Severe Heatwave Warning",
                "disaster_type": "HEAT_WAVE",
                "disaster_severity": "WARNING",
                "location_name": "Nagpur / Rajasthan, India",
                "protocol": "Stay indoors between 11 AM - 4 PM. Consume oral rehydration solutions (ORS) and avoid direct sun exposure."
            },
            "AIR_POLLUTION": {
                "name": "Severe Urban Smog / Stubble Burning Crisis",
                "ambient_temp": 24.0,
                "humidity": 70.0,
                "aqi": 385,
                "pm25": 210.0,
                "weather_condition": "Dense Toxic Smog",
                "disaster_type": "AIR_POLLUTION",
                "disaster_severity": "WARNING",
                "location_name": "Delhi-NCR, India",
                "protocol": "Wear N95 masks when stepping outdoors. Use HEPA air purifiers indoors. Minimize high-intensity outdoor cardio."
            },
            "FLOOD": {
                "name": "Monsoon Urban Flash Flood",
                "ambient_temp": 28.0,
                "humidity": 95.0,
                "aqi": 45,
                "pm25": 15.0,
                "weather_condition": "Torrential Downpour / Flood Inundation",
                "disaster_type": "FLOOD",
                "disaster_severity": "WARNING",
                "location_name": "Mumbai / Assam, India",
                "protocol": "Move to higher ground. Avoid contact with floodwater to prevent waterborne pathogens and leptospirosis. Keep emergency kit ready."
            },
            "CYCLONE": {
                "name": "Tropical Cyclone Warning (Coastal India)",
                "ambient_temp": 27.5,
                "humidity": 92.0,
                "aqi": 35,
                "pm25": 12.0,
                "weather_condition": "Gale Winds & Heavy Rainfall (Cyclone)",
                "disaster_type": "CYCLONE",
                "disaster_severity": "CRITICAL",
                "location_name": "Odisha / Andhra Coast, India",
                "protocol": "Remain in designated storm shelters. Disconnect electrical mains. Secure potable water and emergency rations."
            },
            "EXTREME_WEATHER": {
                "name": "Extreme Dust Storm & Squall",
                "ambient_temp": 39.0,
                "humidity": 25.0,
                "aqi": 290,
                "pm25": 140.0,
                "weather_condition": "Severe Dust Storm",
                "disaster_type": "EXTREME_WEATHER",
                "disaster_severity": "WATCH",
                "location_name": "Western Rajasthan, India",
                "protocol": "Seal windows and doors. Protect eyes and airways from airborne particulate matter."
            }
        }

    def get_current_environment(self) -> EnvironmentalContext:
        """Returns the current environmental context."""
        return self.current_env

    def set_disaster_scenario(self, scenario_type: str) -> EnvironmentalContext:
        """Sets the environmental context to a specified disaster scenario."""
        if scenario_type in self.disaster_scenarios:
            s = self.disaster_scenarios[scenario_type]
            self.current_env = EnvironmentalContext(
                ambient_temp=s["ambient_temp"],
                humidity=s["humidity"],
                aqi=s["aqi"],
                pm25=s["pm25"],
                weather_condition=s["weather_condition"],
                disaster_type=s["disaster_type"],
                disaster_severity=s["disaster_severity"],
                location_name=s["location_name"],
                is_cached=False,
                timestamp=time.time()
            )
            self.cached_env = self.current_env.model_copy()
            self.cached_env.is_cached = True
        return self.current_env

    def update_custom_environment(self, custom: EnvironmentalContext) -> EnvironmentalContext:
        """Applies custom manual environmental dials."""
        self.current_env = custom
        self.cached_env = custom.model_copy()
        self.cached_env.is_cached = True
        return self.current_env

    def get_cached_environment(self) -> EnvironmentalContext:
        """Returns the last saved environmental context for offline fallback."""
        self.cached_env.is_cached = True
        return self.cached_env

    def get_survival_protocol(self, disaster_type: str) -> str:
        """Returns non-diagnostic survival recommendations for the disaster type."""
        scenario = self.disaster_scenarios.get(disaster_type, self.disaster_scenarios["NONE"])
        return scenario.get("protocol", "Follow local disaster management authority advisories.")


# Global singleton instance
disaster_service = DisasterService()
