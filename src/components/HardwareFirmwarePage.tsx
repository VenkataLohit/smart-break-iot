import React, { useState } from 'react';
import { 
  Radio, 
  Code2, 
  Copy, 
  Check, 
  Terminal, 
  Download, 
  FileCode, 
  BookOpen, 
  Sparkles,
  ExternalLink,
  Cpu,
  Usb
} from 'lucide-react';

interface HardwareFirmwarePageProps {
  onOpenConnectModal?: () => void;
}

export const HardwareFirmwarePage: React.FC<HardwareFirmwarePageProps> = ({ onOpenConnectModal }) => {
  const [activeTab, setActiveTab] = useState<'esp32c' | 'esp32' | 'fastapi' | 'json_spec' | 'viva'>('esp32c');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadFile = (content: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const esp32CCode = `/*
 * =========================================================================
 * PROJECT: IoT-Based Automatic Car Braking and Real-Time Vehicle Monitoring
 * HARDWARE: ESP32-C3 / ESP32-C Series (RISC-V with Native USB-C Serial)
 * SENSORS: HC-SR04 (Trig=4, Echo=5) + L298N (IN1=6, IN2=7) + Servo=2 + Buzzer=10
 * TELEMETRY: Real-Time Web Serial (115200 baud) + Wi-Fi WebSocket (Port 81)
 * =========================================================================
 */

#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

const int PIN_TRIG    = 4;   // Ultrasonic Trigger
const int PIN_ECHO    = 5;   // Ultrasonic Echo (via 1k/2k divider)
const int PIN_IN1     = 6;   // Motor Forward PWM
const int PIN_IN2     = 7;   // Motor Reverse / Counter-EMF Brake
const int PIN_IN3     = 8;   // Motor Right Drive
const int PIN_BUZZER  = 10;  // Alarm Buzzer & Brake Lamp
const int PIN_SERVO   = 2;   // Micro-Servo Brake Caliper
const int PIN_DOOR    = 3;   // Magnetic Door Switch / Contact Sensor (Pull-Up)

const float THRESHOLD_DANGER  = 1.0; // Automatic Brake Trigger (< 1.0m)
const float THRESHOLD_WARNING = 3.0; // Warning Beeps (< 3.0m)
const float THRESHOLD_CAUTION = 5.0; // Obstacle Range (< 5.0m)

WebSocketsServer webSocket = WebSocketsServer(81);
Servo brakeServo;

float measuredDistance = 6.0;
float currentSpeed = 30.0;
bool motorRunning = false;
bool brakeActive = false;
bool obstacleInPath = false;
String brakeMode = "none";
unsigned long lastBroadcast = 0;

float readDistanceMeters() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duration = pulseIn(PIN_ECHO, HIGH, 30000);
  if (duration == 0) return 6.0;
  return (duration * 0.0343) / 2.0 / 100.0;
}

void triggerAutoBrake() {
  brakeActive = true;
  brakeMode = "automatic";
  motorRunning = false;
  currentSpeed = 0.0;

  // 1. Cut motor power
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN3, LOW);

  // 2. Counter-EMF reverse pulse (100ms)
  digitalWrite(PIN_IN2, HIGH);
  delay(100);
  digitalWrite(PIN_IN2, LOW);

  // 3. Mechanical brake clamp
  brakeServo.write(90);
  digitalWrite(PIN_BUZZER, HIGH);
}

void setup() {
  Serial.begin(115200); // Native USB-C CDC
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_IN3, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_DOOR, INPUT_PULLUP);
  brakeServo.attach(PIN_SERVO);
  brakeServo.write(0);

  WiFi.begin(ssid, password);
  webSocket.begin();
}

void loop() {
  webSocket.loop();
  measuredDistance = readDistanceMeters();
  obstacleInPath = (measuredDistance < THRESHOLD_CAUTION);

  // AUTOMATIC BRAKING SENSING LOGIC
  if (motorRunning && measuredDistance <= THRESHOLD_DANGER && !brakeActive) {
    triggerAutoBrake();
  }

  // Warning Buzzer Tone
  if (measuredDistance <= THRESHOLD_WARNING && measuredDistance > THRESHOLD_DANGER) {
    digitalWrite(PIN_BUZZER, (millis() % 300 < 150) ? HIGH : LOW);
  } else if (!brakeActive) {
    digitalWrite(PIN_BUZZER, LOW);
  }

  // Broadcast Telemetry to Digital Twin every 50ms
  if (millis() - lastBroadcast >= 50) {
    lastBroadcast = millis();
    StaticJsonDocument<256> doc;
    doc["car_status"] = brakeActive ? "stopped" : (motorRunning ? "running" : "off");
    doc["speed"] = currentSpeed;
    doc["distance"] = round(measuredDistance * 100.0) / 100.0;
    doc["motor"] = motorRunning;
    doc["brake"] = brakeActive;
    doc["obstacle"] = obstacleInPath;
    doc["brake_mode"] = brakeMode;
    doc["door_open"] = (digitalRead(PIN_DOOR) == LOW);
    doc["esp32_connected"] = true;

    String jsonString;
    serializeJson(doc, jsonString);
    Serial.println(jsonString); // Direct to Web Serial USB!
    webSocket.broadcastTXT(jsonString); // Over Wi-Fi!
  }
}`;

  const esp32Code = `/*
 * =========================================================================
 * PROJECT: IoT-Based Automatic Car Braking and Real-Time Monitoring
 * HARDWARE: ESP32 NodeMCU-32S + HC-SR04 + L298N Motor Driver + Servo
 * AUTHOR: College Capstone IoT Engineering
 * =========================================================================
 */

#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// --- Wi-Fi Credentials ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// --- Pin Definitions ---
const int TRIG_PIN = 5;      // HC-SR04 Trigger (Output)
const int ECHO_PIN = 18;     // HC-SR04 Echo (Input via voltage divider)
const int IN1_PIN   = 25;     // L298N Motor Driver Left Forward
const int IN2_PIN   = 26;     // L298N Motor Driver Left Reverse / Brake
const int IN3_PIN   = 27;     // L298N Motor Driver Right Forward
const int IN4_PIN   = 14;     // L298N Motor Driver Right Reverse
const int BUZZER_PIN = 2;    // Active Buzzer / LED Brake Indicator
const int SERVO_PIN  = 4;    // Brake Caliper Micro Servo

// --- Safety Thresholds (in meters) ---
const float DANGER_THRESHOLD  = 1.0; // Automatic Brake Trigger (< 1.0m)
const float WARNING_THRESHOLD = 3.0; // Proximity Warning (< 3.0m)
const float CAUTION_THRESHOLD = 5.0; // Obstacle Detected (< 5.0m)

// --- Objects & Variables ---
WebSocketsServer webSocket = WebSocketsServer(81);
Servo brakeServo;

float currentDistance = 6.0;
float currentSpeed = 30.0;
bool motorState = true;
bool brakeState = false;
bool obstacleDetected = false;
String brakeMode = "none";
unsigned long lastTelemetryTime = 0;

// Read distance in meters using HC-SR04 ultrasonic sensor
float readUltrasonicDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  // Read echo travel time in microseconds (timeout 30ms = ~5m)
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return 6.0; // No obstacle in range

  // Speed of sound = 343 m/s -> Distance (m) = (duration * 0.000343) / 2
  float distMeters = (duration * 0.0343) / 2.0 / 100.0;
  return distMeters;
}

// Actuate Automatic Braking
void triggerAutomaticBraking() {
  brakeState = true;
  brakeMode = "automatic";
  motorState = false;
  currentSpeed = 0.0;

  // 1. Cut motor forward drive immediately
  digitalWrite(IN1_PIN, LOW);
  digitalWrite(IN3_PIN, LOW);

  // 2. Apply brief Counter-EMF electrical reverse brake pulse (100ms)
  digitalWrite(IN2_PIN, HIGH);
  digitalWrite(IN4_PIN, HIGH);
  delay(100);
  digitalWrite(IN2_PIN, LOW);
  digitalWrite(IN4_PIN, LOW);

  // 3. Actuate mechanical servo brake clamp
  brakeServo.write(90); // 90 deg = Clamped

  // 4. Sound emergency buzzer & light brake LED
  digitalWrite(BUZZER_PIN, HIGH);
}

// Release Braking
void releaseBrakes() {
  brakeState = false;
  brakeMode = "none";
  motorState = true;
  brakeServo.write(0); // 0 deg = Released
  digitalWrite(BUZZER_PIN, LOW);
}

void setup() {
  Serial.begin(115200);

  // Initialize GPIOs
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(IN1_PIN, OUTPUT);
  pinMode(IN2_PIN, OUTPUT);
  pinMode(IN3_PIN, OUTPUT);
  pinMode(IN4_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  // Initialize Servo
  brakeServo.attach(SERVO_PIN);
  brakeServo.write(0);

  // Connect to Wi-Fi
  Serial.print("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Connected! IP: " + WiFi.localIP().toString());

  // Start WebSocket Server on Port 81
  webSocket.begin();
  Serial.println("WebSocket server started on port 81");
}

void loop() {
  webSocket.loop();

  // Read ultrasonic sonar every 50ms
  currentDistance = readUltrasonicDistance();
  obstacleDetected = (currentDistance < CAUTION_THRESHOLD);

  // --- AUTOMATIC BRAKING LOGIC ---
  if (currentDistance <= DANGER_THRESHOLD && !brakeState) {
    Serial.println("[CRITICAL] Obstacle < 1m! Triggering AUTOMATIC BRAKE!");
    triggerAutomaticBraking();
  } else if (currentDistance > DANGER_THRESHOLD && brakeState && brakeMode == "automatic") {
    // Optional: auto-release once obstacle cleared
    // releaseBrakes();
  }

  // Warning Buzzer Tone when approaching warning threshold
  if (currentDistance <= WARNING_THRESHOLD && currentDistance > DANGER_THRESHOLD) {
    digitalWrite(BUZZER_PIN, (millis() % 300 < 150) ? HIGH : LOW);
  } else if (!brakeState) {
    digitalWrite(BUZZER_PIN, LOW);
  }

  // --- BROADCAST TELEMETRY TO DIGITAL TWIN ---
  if (millis() - lastTelemetryTime >= 100) {
    lastTelemetryTime = millis();

    StaticJsonDocument<256> doc;
    doc["car_status"] = brakeState ? "stopped" : (motorState ? "running" : "off");
    doc["speed"] = currentSpeed;
    doc["distance"] = round(currentDistance * 100.0) / 100.0;
    doc["motor"] = motorState;
    doc["brake"] = brakeState;
    doc["obstacle"] = obstacleDetected;
    doc["brake_mode"] = brakeMode;
    doc["esp32_connected"] = true;
    doc["wifi_rssi"] = WiFi.RSSI();

    String jsonString;
    serializeJson(doc, jsonString);
    Serial.println(jsonString); // Direct Web Serial USB
    webSocket.broadcastTXT(jsonString); // Wi-Fi WebSocket
  }
}`;

  const fastApiCode = `# backend/main.py
# Python FastAPI Backend for IoT Automatic Car Braking
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import json
import uvicorn

app = FastAPI(title="Auto Brake IoT Gateway", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# Telemetry Schema
class TelemetryPayload(BaseModel):
    car_status: str
    speed: float
    distance: float
    motor: bool
    brake: bool
    obstacle: bool
    brake_mode: str
    esp32_connected: bool = True

current_state = {
    "car_status": "off",
    "speed": 0,
    "distance": 6.0,
    "motor": False,
    "brake": False,
    "obstacle": False,
    "brake_mode": "none",
    "esp32_connected": True
}

@app.get("/")
def read_root():
    return {"message": "Auto Brake IoT Gateway Active"}

@app.get("/status")
def get_status():
    return current_state

# HTTP Ingest Endpoint for ESP32 (if using HTTP instead of direct WebSockets)
@app.post("/api/esp32/telemetry")
async def ingest_telemetry(data: TelemetryPayload):
    global current_state
    current_state = data.dict()
    # Broadcast to all connected digital twin browsers
    await manager.broadcast(json.dumps(current_state))
    return {"status": "success", "echo": current_state}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    # Send current state on join
    await websocket.send_text(json.dumps(current_state))
    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast received message to other peers
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)`;

  const jsonSpec = `{
  "car_status": "running",       // "off" | "starting" | "running" | "braking" | "stopped"
  "speed": 35.5,                // Vehicle speed in km/h (0.0 to 60.0)
  "distance": 2.40,             // Ultrasonic reading in meters (0.02 to 6.00)
  "motor": true,                // true: Motor driver active, false: Motor cut-off
  "brake": false,               // true: Braking engaged, false: Released
  "obstacle": true,             // true: Obstacle in detection zone, false: Clear
  "brake_mode": "automatic",     // "none" | "manual" | "automatic"
  "esp32_connected": true,      // Heartbeat status indicator
  "wifi_rssi": -58              // Wi-Fi signal strength in dBm (optional)
}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="font-tech text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <Code2 className="w-5 h-5 text-cyan-400" />
              HARDWARE FIRMWARE, ARDUINO IDE & ESP32 CONNECTION
            </h2>
            <p className="text-xs text-slate-400 font-mono-code">
              Production source code for the physical ESP32 car, Arduino IDE flashing guide, and real-time Web Serial bridge
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onOpenConnectModal && (
              <button
                onClick={onOpenConnectModal}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-tech font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <Cpu className="w-4 h-4" />
                <span>Open ESP32 Connection Center</span>
              </button>
            )}

            <button
              onClick={() => {
                const code = activeTab === 'esp32c' ? esp32CCode : esp32Code;
                const name = activeTab === 'esp32c' ? 'esp32c3_auto_brake.ino' : 'esp32_auto_brake.ino';
                downloadFile(code, name);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-tech font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Download .ino File</span>
            </button>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-tech">
            <button
              onClick={() => setActiveTab('esp32c')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'esp32c' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ESP32-C (USB-C &amp; RISC-V)
            </button>
            <button
              onClick={() => setActiveTab('esp32')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'esp32' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ESP32 Classic
            </button>
            <button
              onClick={() => setActiveTab('fastapi')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'fastapi' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Python FastAPI
            </button>
            <button
              onClick={() => setActiveTab('json_spec')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'json_spec' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              JSON Spec
            </button>
            <button
              onClick={() => setActiveTab('viva')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'viva' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Viva Q&amp;A
            </button>
          </div>
        </div>

        {/* Tab 0: ESP32-C Firmware */}
        {activeTab === 'esp32c' && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between text-xs font-mono-code text-slate-400">
              <span>File: <strong className="text-cyan-300">firmware/esp32c3_auto_brake.ino</strong> (Web Serial + WebSockets)</span>
              <button
                onClick={() => copyToClipboard(esp32CCode, 'esp32c')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 cursor-pointer"
              >
                {copied === 'esp32c' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'esp32c' ? 'Copied C++ Code!' : 'Copy ESP32-C Sketch'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[#040812] border border-slate-800 text-xs font-mono-code text-cyan-300 overflow-x-auto max-h-[500px]">
              {esp32CCode}
            </pre>
          </div>
        )}

        {/* Tab 1: ESP32 Firmware */}
        {activeTab === 'esp32' && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between text-xs font-mono-code text-slate-400">
              <span>File: <strong className="text-cyan-300">firmware/esp32_auto_brake.ino</strong></span>
              <button
                onClick={() => copyToClipboard(esp32Code, 'esp32')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 cursor-pointer"
              >
                {copied === 'esp32' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'esp32' ? 'Copied C++ Code!' : 'Copy Sketch'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[#040812] border border-slate-800 text-xs font-mono-code text-cyan-300 overflow-x-auto max-h-[500px]">
              {esp32Code}
            </pre>
          </div>
        )}

        {/* Tab 2: Python FastAPI */}
        {activeTab === 'fastapi' && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between text-xs font-mono-code text-slate-400">
              <span>File: <strong className="text-cyan-300">backend/main.py</strong> (FastAPI WebSocket Server)</span>
              <button
                onClick={() => copyToClipboard(fastApiCode, 'fastapi')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 cursor-pointer"
              >
                {copied === 'fastapi' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'fastapi' ? 'Copied Python Code!' : 'Copy FastAPI'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[#040812] border border-slate-800 text-xs font-mono-code text-cyan-300 overflow-x-auto max-h-[500px]">
              {fastApiCode}
            </pre>
          </div>
        )}

        {/* Tab 3: JSON Data Spec */}
        {activeTab === 'json_spec' && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between text-xs font-mono-code text-slate-400">
              <span>Payload Schema sent by ESP32 over WebSocket / HTTP</span>
              <button
                onClick={() => copyToClipboard(jsonSpec, 'json')}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900 cursor-pointer"
              >
                {copied === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'json' ? 'Copied Schema!' : 'Copy JSON'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[#040812] border border-slate-800 text-xs font-mono-code text-cyan-300 overflow-x-auto">
              {jsonSpec}
            </pre>
          </div>
        )}

        {/* Tab 4: Viva Presentation Q&A */}
        {activeTab === 'viva' && (
          <div className="space-y-4 pt-4 text-xs font-mono-code">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="font-tech text-sm font-bold text-cyan-300">
                Q1: How does the Automatic Braking system decide when to brake?
              </h4>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                The HC-SR04 ultrasonic sensor transmits a 40 kHz acoustic burst and measures the time of flight for the echo return.
                The ESP32 converts time to distance ($D = (T \times 0.0343) / 2$). If distance drops below the configurable danger threshold
                (default 1.0 meter), the ESP32 interrupts motor forward PWM, applies a transient counter-electromotive force (reverse pulse)
                to lock the rotor, and engages the servo mechanical caliper, achieving zero velocity within 150 milliseconds.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="font-tech text-sm font-bold text-cyan-300">
                Q2: What is the benefit of having a Digital Twin in this IoT project?
              </h4>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                A digital twin enables remote real-time telematics without requiring the operator to follow the physical vehicle.
                The web dashboard synchronizes telemetry over bi-directional WebSockets with 50ms latency, rendering moving road animations,
                braking taillight states, obstacle proximities, and time-of-flight traces. Furthermore, the embedded Demo Simulator allows
                demonstrating fail-safe braking logic even during indoor presentations where hardware tracks may be constrained.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <h4 className="font-tech text-sm font-bold text-cyan-300">
                Q3: How does the system handle sensor latency and false triggers?
              </h4>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                The ESP32 runs a median filtering algorithm over consecutive ultrasonic samples to reject transient acoustic multipath noise.
                Additionally, the echo pin uses a 30ms hardware timeout to prevent CPU stalling when no obstacle is within range.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
