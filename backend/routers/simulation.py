"""
SwastyaConnect — Simulation Control Router
Provides presets and live manual dial controls for demonstration, hackathons, and edge testing.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from ..models.schemas import (
    SimulationScenario,
    SimulationScenarioRequest,
    WearableData,
    EnvironmentalContext
)
from ..services.simulation_service import simulation_service
from ..services.disaster_service import disaster_service

router = APIRouter(prefix="/api/simulation", tags=["Simulation & Demo"])


@router.get("/scenarios", response_model=List[Dict[str, Any]])
async def list_simulation_scenarios():
    """Lists all predefined demonstration scenarios."""
    return [
        {
            "id": s.id,
            "name": s.name,
            "description": s.description,
            "vitals": s.vitals.model_dump(),
            "environment": s.environment
        }
        for s in simulation_service.scenarios.values()
    ]


@router.post("/apply")
async def apply_simulation_scenario(req: SimulationScenarioRequest):
    """Activates a predefined scenario by ID."""
    if not req.scenario_id:
        raise HTTPException(status_code=400, detail="Scenario ID is required")
    try:
        scenario = simulation_service.apply_scenario(req.scenario_id)
        return {
            "status": "success",
            "active_scenario": scenario.name,
            "vitals": scenario.vitals,
            "environment": disaster_service.current_env
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/custom-vitals")
async def override_custom_vitals(vitals: WearableData):
    """Directly overrides sensor dials (HR, SpO2, Skin Temp, GSR) for presentation."""
    simulation_service.apply_custom_vitals(vitals)
    return {
        "status": "success",
        "message": "Custom vitals applied to simulation engine",
        "current_vitals": simulation_service.read_latest()
    }
