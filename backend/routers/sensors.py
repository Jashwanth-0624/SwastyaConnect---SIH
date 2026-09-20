"""
SwastyaConnect — Sensors Router
Handles sensor telemetry streaming, ESP32 Wi-Fi REST ingestion, USB Serial bridge, and WebSocket feeds.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Body
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import asyncio
import json
import time

from ..models.schemas import WearableData, ESP32SensorPayload
from ..services.simulation_service import simulation_service
from ..services.sensor_provider import signal_processor
from ..services.serial_service import serial_manager

router = APIRouter(prefix="/api/sensors", tags=["Sensors"])


class SerialConnectRequest(BaseModel):
    port: str
    baud: int = 115200


@router.get("/latest", response_model=WearableData)
async def get_latest_sensor_data():
    """Fetches the latest cleaned physiological readings."""
    return simulation_service.read_latest()


@router.post("/ingest", response_model=WearableData)
async def ingest_sensor_data(payload: ESP32SensorPayload):
    """
    Primary ingestion endpoint for ESP32 hardware via Wi-Fi HTTP POST.
    Accepts flexible JSON keys (hr/heart_rate, spo2/oxygen, temp/skin_temp, gsr).
    """
    wearable = payload.to_wearable_data()
    cleaned = signal_processor.clean_and_smooth(wearable)
    simulation_service.apply_hardware_vitals(cleaned)
    print(f"[ESP32 Wi-Fi Ingest] HR: {cleaned.hr} BPM, SpO2: {cleaned.spo2}%, Temp: {cleaned.skin_temp}°C, GSR: {cleaned.gsr}µS")
    return cleaned


@router.post("/esp32", response_model=WearableData)
async def ingest_esp32_direct(payload: ESP32SensorPayload):
    """Alias endpoint specifically designated for ESP32 sketches."""
    return await ingest_sensor_data(payload)


@router.get("/status")
async def get_sensor_status():
    """Returns real-time hardware connection status, telemetry source, and signal metrics."""
    latest = simulation_service.read_latest()
    is_hardware = simulation_service.is_hardware_active()
    serial_status = serial_manager.get_status()

    return {
        "connected": True,
        "is_hardware_active": is_hardware or serial_status["connected"],
        "source": "ESP32_SERIAL" if serial_status["connected"] else ("ESP32_WIFI" if is_hardware else "SIMULATED"),
        "signal_quality_pct": int(latest.signal_quality * 100),
        "is_simulated": latest.is_simulated and not is_hardware and not serial_status["connected"],
        "last_hardware_timestamp": simulation_service.last_hardware_timestamp,
        "seconds_since_last_packet": round(time.time() - simulation_service.last_hardware_timestamp, 1) if simulation_service.last_hardware_timestamp else None,
        "serial_status": serial_status,
        "active_sensors": ["Heart Rate (HR)", "Blood Oxygen (SpO2)", "Skin Temperature", "Galvanic Skin Response (GSR)"]
    }


# --- USB Serial Port Management Endpoints ---

@router.get("/serial/ports")
async def list_serial_ports():
    """Scans and returns all available USB COM ports for ESP32 plug-and-play."""
    return {
        "ports": serial_manager.list_available_ports()
    }


@router.post("/serial/connect")
async def connect_serial_port(req: SerialConnectRequest):
    """Connects to ESP32 over specified COM port and starts streaming."""
    return serial_manager.connect(req.port, req.baud)


@router.post("/serial/disconnect")
async def disconnect_serial_port():
    """Disconnects from active USB serial port."""
    return serial_manager.disconnect()


@router.websocket("/ws")
async def websocket_sensor_stream(websocket: WebSocket):
    """
    High-frequency WebSocket endpoint streaming live sensor frames (1Hz)
    directly to frontend telemetry dashboards.
    """
    await websocket.accept()
    try:
        while True:
            vitals = simulation_service.read_latest()
            await websocket.send_text(vitals.model_dump_json())
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass

