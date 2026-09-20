"""
SwastyaConnect — Main FastAPI Application
Secure, AI-powered Personal Health Companion Backend
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from dotenv import load_dotenv

from .routers import sensors, health, disaster, emergency, simulation

# Load environment variables
load_dotenv()

app = FastAPI(
    title="SwastyaConnect API",
    description=(
        "Personal Health Risk Engine & Wearable Companion API. "
        "Provides real-time multi-sensor risk analysis, personal baseline tracking, "
        "disaster awareness (heat waves, air pollution, floods, cyclones), "
        "and privacy-preserving alert escalation."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for client access
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Open in development for easy local pairing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Sub-Routers
app.include_router(sensors.router)
app.include_router(health.router)
app.include_router(disaster.router)
app.include_router(emergency.router)
app.include_router(simulation.router)


@app.on_event("startup")
async def startup_event():
    """Initializes hardware connections and auto-connects to plugged-in ESP32."""
    from .services.serial_service import serial_manager
    from .services.db_service import db_service
    
    # Initialize PostgreSQL connection and tables
    print("[Startup] Initializing PostgreSQL database tables...")
    db_service.init_db()

    print("[Startup] Scanning for connected ESP32 hardware...")
    connected = serial_manager.auto_connect()
    if connected:
        print(f"[Startup] ESP32 successfully connected on {serial_manager.active_port} at {serial_manager.active_baud} baud.")
    else:
        print("[Startup] ESP32 auto-detect standing by for Wi-Fi or USB connection.")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleans up active USB serial connections."""
    from .services.serial_service import serial_manager
    serial_manager.disconnect()


@app.get("/api")
@app.get("/api/status")
async def root_api_status():
    """System status and health check."""
    return {
        "app_name": "SwastyaConnect",
        "status": "ONLINE",
        "version": "1.0.0",
        "engine": "On-Device Edge / FastAPI Hybrid Risk Engine",
        "hardware_sensors": ["Heart Rate (HR)", "Blood Oxygen (SpO2)", "Skin Temperature", "Galvanic Skin Response (GSR)"],
        "disaster_modes": ["HEAT_WAVE", "AIR_POLLUTION", "FLOOD", "CYCLONE", "EXTREME_WEATHER"],
        "disclaimer": (
            "SwastyaConnect is intended for wellness monitoring, risk awareness, and early-warning support. "
            "It is not a medical diagnostic device and does not replace professional medical advice or emergency services."
        )
    }


# Mount Built React Frontend if dist exists
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIST = os.path.join(BASE_DIR, "frontend", "dist")

if os.path.exists(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
