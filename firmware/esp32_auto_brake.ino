/*
 * =====================================================================================
 * PROJECT: IoT-Based Automatic Car Braking and Real-Time Vehicle Monitoring System
 * MICROCONTROLLER: ESP32 Dev Module (NodeMCU-32S)
 * SENSORS & ACTUATORS:
 *   - HC-SR04 Ultrasonic Distance Sensor (Trig=GPIO5, Echo=GPIO18)
 *   - L298N Dual H-Bridge Motor Driver (IN1=25, IN2=26, IN3=27, IN4=14)
 *   - Optical Speed Encoder / LM393 (GPIO19)
 *   - Micro-Servo Brake Caliper SG90 (GPIO4)
 *   - Active Buzzer & Warning LED (GPIO2)
 *
 * PROTOCOL: WebSockets on Port 81 & JSON Telemetry Serialization (ArduinoJson v6)
 * =====================================================================================
 */

#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// ---------------- Wi-Fi Configuration ----------------
// Enter your Wi-Fi credentials or use mobile hotspot
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ---------------- Pin Assignments ----------------
const int PIN_TRIG    = 5;   // Ultrasonic Trigger Output
const int PIN_ECHO    = 18;  // Ultrasonic Echo Input (Use 1k/2k resistor voltage divider)
const int PIN_IN1     = 25;  // L298N Left Forward
const int PIN_IN2     = 26;  // L298N Left Reverse / Counter-EMF Brake
const int PIN_IN3     = 27;  // L298N Right Forward
const int PIN_IN4     = 14;  // L298N Right Reverse / Counter-EMF Brake
const int PIN_ENCODER = 19;  // Speed Encoder interrupt
const int PIN_BUZZER  = 2;   // Alarm Buzzer & Tail Brake LED
const int PIN_SERVO   = 4;   // Mechanical Brake Disc Clamp

// ---------------- Automatic Safety Parameters ----------------
const float THRESHOLD_DANGER  = 1.0; // Meters: Emergency Auto Brake Trigger
const float THRESHOLD_WARNING = 3.0; // Meters: High Frequency Acoustic Warning
const float THRESHOLD_CAUTION = 5.0; // Meters: Obstacle In Proximity Zone

// ---------------- System State ----------------
WebSocketsServer webSocket = WebSocketsServer(81);
Servo brakeServo;

float measuredDistance = 6.0;
float currentSpeed = 30.0;
bool motorRunning = false;
bool brakeActive = false;
bool obstacleInPath = false;
String brakeMode = "none"; // "none" | "manual" | "automatic"
unsigned long lastBroadcastTime = 0;

// Read distance in meters using HC-SR04
float getDistanceMeters() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  // Read echo time with 30ms timeout (max distance approx 5.1 meters)
  long duration = pulseIn(PIN_ECHO, HIGH, 30000);
  if (duration == 0) return 6.0; // Timeout = path clear

  // Speed of sound: 343 m/s = 0.0343 cm/us
  float meters = (duration * 0.0343) / 2.0 / 100.0;
  return meters;
}

// Engage Autonomous Emergency Braking (AEB)
void triggerAutomaticEmergencyBrake() {
  brakeActive = true;
  brakeMode = "automatic";
  motorRunning = false;
  currentSpeed = 0.0;

  // Step 1: Disengage forward propulsion PWM immediately
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN3, LOW);

  // Step 2: Inject brief reverse counter-torque (Counter-EMF) pulse (120ms) to lock motors
  digitalWrite(PIN_IN2, HIGH);
  digitalWrite(PIN_IN4, HIGH);
  delay(120);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN4, LOW);

  // Step 3: Clamp mechanical servo brake pads against wheel disc
  brakeServo.write(90); // 90° = Locked Brake Pad

  // Step 4: Illuminate red brake lights and sound continuous alarm
  digitalWrite(PIN_BUZZER, HIGH);

  Serial.println("🛑 [AEB TRIGGERED] Automatic Brake Activated! Obstacle Collision Averted.");
}

// Release Brakes
void releaseBrakes() {
  brakeActive = false;
  brakeMode = "none";
  brakeServo.write(0); // 0° = Released Free Play
  digitalWrite(PIN_BUZZER, LOW);
  Serial.println("🟢 [BRAKE RELEASED] Vehicle drive system ready.");
}

// Start Drive Motors
void startDriveMotors(int speedVal = 200) {
  if (brakeActive) return;
  motorRunning = true;
  currentSpeed = 32.0;
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN4, LOW);
}

// Stop Drive Motors (Coasting)
void stopDriveMotors() {
  motorRunning = false;
  currentSpeed = 0.0;
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, LOW);
}

// WebSocket Event Callback
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_TEXT) {
    String msg = String((char*)payload);
    Serial.printf("[%u] Received command: %s\\n", num, msg.c_str());

    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, msg);
    if (!error) {
      if (doc.containsKey("command")) {
        String cmd = doc["command"].as<String>();
        if (cmd == "start") {
          releaseBrakes();
          startDriveMotors();
        } else if (cmd == "stop") {
          stopDriveMotors();
        } else if (cmd == "brake") {
          triggerAutomaticEmergencyBrake();
        } else if (cmd == "release") {
          releaseBrakes();
        }
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\\n=== ESP32 Automatic Car Braking System Initializing ===");

  // Pin Modes
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_IN3, OUTPUT);
  pinMode(PIN_IN4, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  // Servo Setup
  brakeServo.attach(PIN_SERVO);
  brakeServo.write(0); // Initially released

  // Connect to Local Wi-Fi Network
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\\n[Wi-Fi Connected!]");
    Serial.print("ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    // If router unavailable, create Access Point for demo
    Serial.println("\\n[Wi-Fi Failed] Starting SoftAP mode 'AutoBrake_Car'...");
    WiFi.softAP("AutoBrake_Car", "12345678");
    Serial.print("AP IP Address: ");
    Serial.println(WiFi.softAPIP());
  }

  // Initialize WebSocket Server
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);
  Serial.println("WebSocket server initialized on port 81");
}

void loop() {
  webSocket.loop();

  // 1. Ultrasonic Sonar Sampling
  measuredDistance = getDistanceMeters();
  obstacleInPath = (measuredDistance < THRESHOLD_CAUTION);

  // 2. Autonomous Emergency Braking Logic
  if (motorRunning && measuredDistance <= THRESHOLD_DANGER && !brakeActive) {
    triggerAutomaticEmergencyBrake();
  }

  // 3. Proximity Warning Buzzer Pulsing
  if (measuredDistance <= THRESHOLD_WARNING && measuredDistance > THRESHOLD_DANGER) {
    // Intermittent pulse tone
    digitalWrite(PIN_BUZZER, (millis() % 250 < 100) ? HIGH : LOW);
  } else if (!brakeActive) {
    digitalWrite(PIN_BUZZER, LOW);
  }

  // 4. Transmit Real-Time Telemetry to Digital Twin (Every 80ms)
  if (millis() - lastBroadcastTime >= 80) {
    lastBroadcastTime = millis();

    StaticJsonDocument<256> telemetryDoc;
    telemetryDoc["car_status"] = brakeActive ? "stopped" : (motorRunning ? "running" : "off");
    telemetryDoc["speed"] = currentSpeed;
    telemetryDoc["distance"] = round(measuredDistance * 100.0) / 100.0;
    telemetryDoc["motor"] = motorRunning;
    telemetryDoc["brake"] = brakeActive;
    telemetryDoc["obstacle"] = obstacleInPath;
    telemetryDoc["brake_mode"] = brakeMode;
    telemetryDoc["esp32_connected"] = true;
    telemetryDoc["wifi_rssi"] = WiFi.RSSI();

    String jsonString;
    serializeJson(telemetryDoc, jsonString);
    webSocket.broadcastTXT(jsonString);
  }
}
