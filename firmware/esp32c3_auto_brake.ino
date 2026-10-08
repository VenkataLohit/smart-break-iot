/*
 * =====================================================================================
 * PROJECT: IoT-Based Automatic Car Braking and Real-Time Monitoring
 * BOARD: ESP32-C3 / ESP32-C Series (RISC-V 160MHz with Native USB-CDC & Wi-Fi)
 * AUTHOR: College Capstone IoT Engineering
 *
 * SENSORS & ACTUATORS PIN CONFIGURATION (ESP32-C3):
 *   - GPIO 4: HC-SR04 Trigger Pin (Output)
 *   - GPIO 5: HC-SR04 Echo Pin (Input, via 1k/2k voltage divider to protect 3.3V)
 *   - GPIO 6: L298N IN1 (Motor Left Forward PWM)
 *   - GPIO 7: L298N IN2 (Motor Left Reverse / Counter-EMF Brake)
 *   - GPIO 8: L298N IN3 & IN4 (Motor Right Forward & Reverse)
 *   - GPIO 10: Active Buzzer / Emergency Brake Indicator LED
 *   - GPIO 2: Micro-Servo Caliper Brake Clamp (SG90)
 *
 * TELEMETRY MODES:
 *   1. Direct USB-C Serial at 115200 baud (Web Serial API browser connection)
 *   2. Wi-Fi WebSockets on Port 81
 * =====================================================================================
 */

#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// --- Wi-Fi Credentials (Optional for Wi-Fi Mode) ---
const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// --- Pin Definitions for ESP32-C3 ---
const int PIN_TRIG    = 4;   // Ultrasonic Trigger
const int PIN_ECHO    = 5;   // Ultrasonic Echo
const int PIN_IN1     = 6;   // Motor Left Forward
const int PIN_IN2     = 7;   // Motor Left Reverse / Brake
const int PIN_IN3     = 8;   // Motor Right Forward
const int PIN_BUZZER  = 10;  // Alarm Buzzer & Tail Brake LED
const int PIN_SERVO   = 2;   // Mechanical Brake Disc Caliper
const int PIN_DOOR    = 3;   // Magnetic Reed / Door Sensor Switch (Pull-Up)

// --- Automatic Braking Thresholds (in meters) ---
const float THRESHOLD_DANGER  = 1.0; // Automatic Emergency Brake Trigger (< 1.0m)
const float THRESHOLD_WARNING = 3.0; // Proximity Acoustic Warning (< 3.0m)
const float THRESHOLD_CAUTION = 5.0; // Object in Detection Range (< 5.0m)

// --- System Variables ---
WebSocketsServer webSocket = WebSocketsServer(81);
Servo brakeServo;

float measuredDistance = 6.0;
float currentSpeed = 30.0;
bool motorRunning = false;
bool brakeActive = false;
bool obstacleInPath = false;
String brakeMode = "none";
unsigned long lastTelemetryTime = 0;

// Read distance in meters using HC-SR04
float readDistanceMeters() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duration = pulseIn(PIN_ECHO, HIGH, 30000);
  if (duration == 0) return 6.0; // Path clear

  float meters = (duration * 0.0343) / 2.0 / 100.0;
  return meters;
}

// Autonomous Emergency Braking Routine
void triggerAutoEmergencyBrake() {
  brakeActive = true;
  brakeMode = "automatic";
  motorRunning = false;
  currentSpeed = 0.0;

  // 1. Cut motor forward drive immediately
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN3, LOW);

  // 2. Apply brief Counter-EMF electrical reverse pulse (100ms)
  digitalWrite(PIN_IN2, HIGH);
  delay(100);
  digitalWrite(PIN_IN2, LOW);

  // 3. Actuate mechanical servo brake clamp
  brakeServo.write(90); // 90° = Clamp

  // 4. Sound emergency buzzer & light brake LED
  digitalWrite(PIN_BUZZER, HIGH);
}

// Release Brakes
void releaseBrakes() {
  brakeActive = false;
  brakeMode = "none";
  brakeServo.write(0); // 0° = Free
  digitalWrite(PIN_BUZZER, LOW);
}

void setup() {
  // ESP32-C3 Native USB Serial
  Serial.begin(115200);
  delay(500);

  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_IN3, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_DOOR, INPUT_PULLUP);

  brakeServo.attach(PIN_SERVO);
  brakeServo.write(0);

  // Try connecting Wi-Fi (optional, will continue to work over USB Serial regardless)
  WiFi.begin(ssid, password);
  webSocket.begin();
}

void loop() {
  webSocket.loop();

  // 1. Read ultrasonic sensor distance
  measuredDistance = readDistanceMeters();
  obstacleInPath = (measuredDistance < THRESHOLD_CAUTION);

  // 2. AUTOMATIC BRAKING DECISION
  // If moving and obstacle enters danger zone (< 1.0m), trigger automatic brake immediately!
  if (motorRunning && measuredDistance <= THRESHOLD_DANGER && !brakeActive) {
    triggerAutoEmergencyBrake();
  }

  // 3. Acoustic Warning
  if (measuredDistance <= THRESHOLD_WARNING && measuredDistance > THRESHOLD_DANGER) {
    digitalWrite(PIN_BUZZER, (millis() % 300 < 150) ? HIGH : LOW);
  } else if (!brakeActive) {
    digitalWrite(PIN_BUZZER, LOW);
  }

  // 4. Broadcast JSON Telemetry over USB Serial AND WebSockets (Every 50ms = 20 Hz)
  if (millis() - lastTelemetryTime >= 50) {
    lastTelemetryTime = millis();

    StaticJsonDocument<256> doc;
    doc["car_status"] = brakeActive ? "stopped" : (motorRunning ? "running" : "off");
    doc["speed"] = currentSpeed;
    doc["distance"] = round(measuredDistance * 100.0) / 100.0;
    doc["motor"] = motorRunning;
    doc["brake"] = brakeActive;
    doc["obstacle"] = obstacleInPath;
    doc["brake_mode"] = brakeMode;
    doc["door_open"] = (digitalRead(PIN_DOOR) == LOW); // LOW when door opened
    doc["esp32_connected"] = true;
    doc["wifi_rssi"] = WiFi.RSSI();

    String jsonString;
    serializeJson(doc, jsonString);

    // Print over USB-C Serial for Web Serial API in the browser
    Serial.println(jsonString);

    // Broadcast over WebSocket if connected
    webSocket.broadcastTXT(jsonString);
  }
}
