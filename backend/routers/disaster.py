"""
SwastyaConnect — Disaster Intelligence Router
Manages Indian disaster monitoring, environmental updates, and survival protocols.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any
from ..models.schemas import EnvironmentalContext
from ..services.disaster_service import disaster_service

router = APIRouter(prefix="/api/disaster", tags=["Disaster & Environmental"])


class DisasterScenarioRequest(BaseModel):
    scenario_type: str  # NONE, HEAT_WAVE, AIR_POLLUTION, FLOOD, CYCLONE, EXTREME_WEATHER


@router.get("/current", response_model=EnvironmentalContext)
async def get_current_environment():
    """Returns current ambient weather, AQI, and disaster threat level."""
    return disaster_service.get_current_environment()


@router.get("/cached", response_model=EnvironmentalContext)
async def get_cached_environment():
    """Returns the last known environmental data for offline fallback."""
    return disaster_service.get_cached_environment()


@router.post("/scenario", response_model=EnvironmentalContext)
async def set_disaster_scenario(req: DisasterScenarioRequest):
    """Sets a predefined Indian disaster scenario."""
    return disaster_service.set_disaster_scenario(req.scenario_type)


@router.post("/custom", response_model=EnvironmentalContext)
async def set_custom_environment(custom: EnvironmentalContext):
    """Manually overrides environmental metrics (Temp, Humidity, AQI, PM2.5)."""
    return disaster_service.update_custom_environment(custom)


@router.get("/protocols")
async def get_disaster_protocols():
    """Returns non-diagnostic safety protocols for all Indian disaster scenarios."""
    return {
        "active_disaster": disaster_service.current_env.disaster_type,
        "active_protocol": disaster_service.get_survival_protocol(disaster_service.current_env.disaster_type),
        "all_scenarios": disaster_service.disaster_scenarios
    }
