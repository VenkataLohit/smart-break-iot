"""
FastAPI Backend for IoT-Based Automatic Car Braking and Real-Time Vehicle Monitoring System
Endpoints:
  GET  /
  GET  /status
  GET  /vehicle
  GET  /alerts
  GET  /history
  POST /api/esp32/telemetry
  WS   /ws
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import json
from .websocket_manager import manager

app = FastAPI(
    title="IoT Automatic Car Braking & Monitoring Backend",
    description="Digital twin telemetry server for ESP32 autonomous braking vehicle",
    version="2.0.0"
)

# Enable CORS for local development and dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Validation Models
class TelemetryDataModel(BaseModel):
    speed: float = Field(..., ge=0.0, le=120.0, description="Vehicle speed in km/h")
    distance: float = Field(..., ge=0.0, le=20.0, description="Ultrasonic distance in meters")
    motor: bool = Field(..., description="True if motor drive is active")
    brake: bool = Field(..., description="True if braking mechanism is engaged")
    obstacle: bool = Field(..., description="True if obstacle detected in range")
    car_status: str = Field(..., description="off | starting | running | braking | stopped")
    brake_mode: Optional[str] = Field("none", description="none | manual | automatic")
    door_open: Optional[bool] = Field(False, description="True if car door is open")
    esp32_connected: Optional[bool] = True
    wifi_rssi: Optional[int] = -55

# In-memory authoritative system state
current_telemetry = {
    "car_status": "off",
    "speed": 0.0,
    "distance": 6.0,
    "motor": False,
    "brake": False,
    "obstacle": False,
    "brake_mode": "none",
    "door_open": False,
    "esp32_connected": True,
    "wifi_rssi": -55,
    "timestamp": datetime.now().strftime("%H:%M:%S")
}

alerts_log: List[dict] = [
  {
    "id": "alt-1",
    "timestamp": "10:42:15",
    "event": "Obstacle detected within caution zone (3.2m)",
    "type": "warning",
    "distance": 3.2,
    "speed": 35.0,
    "source": "sensor"
  },
  {
    "id": "alt-2",
    "timestamp": "10:42:18",
    "event": "Proximity violation (< 1.0m) - AUTOMATIC EMERGENCY BRAKE ENGAGED",
    "type": "critical",
    "distance": 0.85,
    "speed": 32.0,
    "source": "automatic_brake"
  }
]

@app.get("/")
def read_root():
    return {
        "project": "IoT-Based Automatic Car Braking and Real-Time Monitoring",
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "active_clients": len(manager.active_connections)
    }

@app.get("/status")
def get_status():
    return {
        "status": "healthy",
        "telemetry": current_telemetry
    }

@app.get("/vehicle")
def get_vehicle():
    return {
        "vehicle_name": "Auto Brake Prototype Mk-IV",
        "controller": "ESP32 NodeMCU-32S",
        "sensor": "HC-SR04 Ultrasonic Distance Sensor",
        "communication": "Wi-Fi 802.11 b/g/n & WebSockets",
        "brake_system": "Automatic (Counter-EMF + Servo Clamp) + Manual",
        "project_type": "IoT-Based Predictive/Automatic Safety System",
        "status": "Connected"
    }

@app.get("/alerts")
def get_alerts():
    return {"alerts": alerts_log}

@app.get("/history")
def get_history():
    return {
        "trips": [
            {
                "id": "trip-1",
                "title": "Trial Run #4 — Emergency Braking Test",
                "duration_seconds": 185,
                "distance_meters": 420,
                "max_speed": 42.0,
                "avg_speed": 24.5,
                "auto_brake_count": 2,
                "manual_brake_count": 1
            }
        ]
    }

# Ingest endpoint for ESP32 hardware
@app.post("/api/esp32/telemetry")
async def ingest_esp32(payload: TelemetryDataModel):
    global current_telemetry

    # Sanitize and validate
    current_telemetry = payload.dict()
    current_telemetry["timestamp"] = datetime.now().strftime("%H:%M:%S")

    # If automatic braking condition met, log alert
    if payload.brake and payload.brake_mode == "automatic":
        alerts_log.insert(0, {
            "id": f"alt-{len(alerts_log)+1}",
            "timestamp": current_telemetry["timestamp"],
            "event": f"AUTOMATIC BRAKE TRIGGERED at {payload.distance:.2f}m",
            "type": "critical",
            "distance": payload.distance,
            "speed": payload.speed,
            "source": "automatic_brake"
        })

    # Broadcast to all connected digital twin frontends
    await manager.broadcast_json(current_telemetry)
    return {"status": "ok", "telemetry": current_telemetry}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    # Immediately send latest state
    await websocket.send_text(json.dumps(current_telemetry))
    try:
        while True:
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
                # Broadcast incoming client command or telemetry
                await manager.broadcast_json(parsed)
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
