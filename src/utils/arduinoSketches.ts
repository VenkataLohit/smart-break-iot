/**
 * Ready-to-Flash Arduino IDE C++ Sketches (.ino) for ESP32 / ESP32-C3
 * Configured specifically for the IoT Automatic Car Braking Digital Twin.
 */

export interface ArduinoSketch {
  id: string;
  title: string;
  description: string;
  filename: string;
  code: string;
}

export const ARDUINO_IDE_STEPS = [
  {
    step: 1,
    title: 'Install Arduino IDE',
    desc: 'Download and install Arduino IDE 2.3+ from arduino.cc (Windows, macOS, or Linux).',
  },
  {
    step: 2,
    title: 'Add ESP32 Board URL',
    desc: 'In Arduino IDE, go to File > Preferences > Additional Boards Manager URLs and paste: https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json',
  },
  {
    step: 3,
    title: 'Install ESP32 Board Package',
    desc: 'Go to Tools > Board > Boards Manager. Search for "esp32" by Espressif Systems and click Install.',
  },
  {
    step: 4,
    title: 'Install Required Libraries',
    desc: 'Go to Sketch > Include Library > Manage Libraries. Search and install: "ArduinoJson" (v6 or v7) and "ESP32Servo". (If using Wi-Fi, also install "WebSockets" by Markus Sattler).',
  },
  {
    step: 5,
    title: 'Select Board & Port',
    desc: 'Select Tools > Board > "ESP32 Dev Module" (or your specific ESP32 model) and select your COM / /dev/ttyUSB port.',
  },
  {
    step: 6,
    title: 'Upload Code & Connect',
    desc: 'Click the Upload (➔) arrow. If the upload hangs on "Connecting......", press and hold the BOOT button on the ESP32 until flashing starts. Once done, open this web app and click "Connect USB Serial"!',
  },
];

export const PINOUT_SPECS = [
  { component: 'HC-SR04 Ultrasonic VCC', esp32Pin: 'VIN / 5V', wireColor: 'Red', notes: 'Requires 5V for reliable sound burst' },
  { component: 'HC-SR04 Ultrasonic GND', esp32Pin: 'GND', wireColor: 'Black', notes: 'Must share common ground with ESP32' },
  { component: 'HC-SR04 Trig Pin', esp32Pin: 'GPIO 5', wireColor: 'Yellow', notes: 'Trigger pulse output (10µs)' },
  { component: 'HC-SR04 Echo Pin', esp32Pin: 'GPIO 18', wireColor: 'Green', notes: 'Recommended 1kΩ / 2kΩ voltage divider to step 5V down to 3.3V' },
  { component: 'L298N Motor IN1 (Left Fwd)', esp32Pin: 'GPIO 25', wireColor: 'Blue', notes: 'Motor PWM drive forward' },
  { component: 'L298N Motor IN2 (Left Rev)', esp32Pin: 'GPIO 26', wireColor: 'Purple', notes: 'Counter-EMF electrical brake pulse' },
  { component: 'L298N Motor IN3 (Right Fwd)', esp32Pin: 'GPIO 27', wireColor: 'Blue', notes: 'Right motor forward' },
  { component: 'L298N Motor IN4 (Right Rev)', esp32Pin: 'GPIO 14', wireColor: 'Purple', notes: 'Right motor reverse / brake' },
  { component: 'SG90 Micro Servo Signal', esp32Pin: 'GPIO 4', wireColor: 'Orange', notes: 'PWM mechanical brake caliper (0° release, 90° clamp)' },
  { component: 'Active Buzzer (+) / LED', esp32Pin: 'GPIO 2', wireColor: 'Red', notes: 'High pitch acoustic alert & brake lamp (built-in LED)' },
  { component: 'Door Switch (Reed Sensor)', esp32Pin: 'GPIO 15', wireColor: 'White', notes: 'Magnetic sensor to GND (Internal INPUT_PULLUP)' },
];

export const DUAL_MODE_SKETCH = `/*
 * =======================================================================================
 * PROJECT: IoT-Based Automatic Car Braking and Real-Time Vehicle Monitoring
 * HARDWARE: ESP32 (NodeMCU-32S / ESP32-WROOM-32 / Dev Module)
 * CONNECTIONS:
 *   - HC-SR04 Ultrasonic : Trig = GPIO 5, Echo = GPIO 18 (via 1k/2k divider)
 *   - L298N Motor Driver : IN1 = 25, IN2 = 26, IN3 = 27, IN4 = 14
 *   - SG90 Brake Servo   : Signal = GPIO 4
 *   - Active Buzzer/LED  : GPIO 2 (also ESP32 built-in LED)
 *   - Magnetic Door Sw   : GPIO 15 (switches to GND)
 * 
 * COMMUNICATION:
 *   - Dual USB Web Serial at 115200 baud (Instant plug & play in Chrome/Edge/Opera!)
 *   - Wi-Fi WebSocket Server on Port 81 (non-blocking, works offline too)
 * =======================================================================================
 */

#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// ================= USER WI-FI SETTINGS (OPTIONAL) =================
// Leave as is if using direct USB Web Serial!
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ================= PIN DEFINITIONS =================
const int PIN_TRIG    = 5;   // Ultrasonic Trigger
const int PIN_ECHO    = 18;  // Ultrasonic Echo (3.3V safe)
const int PIN_IN1     = 25;  // Motor Left Forward
const int PIN_IN2     = 26;  // Motor Left Reverse / Brake Pulse
const int PIN_IN3     = 27;  // Motor Right Forward
const int PIN_IN4     = 14;  // Motor Right Reverse
const int PIN_SERVO   = 4;   // Brake Caliper Micro-Servo
const int PIN_BUZZER  = 2;   // Warning Buzzer & Onboard LED
const int PIN_DOOR    = 15;  // Door Switch (Active LOW with pullup)

// ================= SAFETY THRESHOLDS (METERS) =================
const float DANGER_THRESHOLD  = 1.0; // Automatic Brake Trigger (< 1.0m)
const float WARNING_THRESHOLD = 3.0; // Proximity Beeps (< 3.0m)
const float CAUTION_THRESHOLD = 5.0; // Obstacle Detected (< 5.0m)

// ================= HARDWARE OBJECTS =================
WebSocketsServer webSocket(81);
Servo brakeServo;

// ================= TELEMETRY STATE =================
float currentDistance   = 6.0;   // Distance in meters
float currentSpeed      = 35.0;  // Simulated wheel speed in km/h
bool  motorRunning      = true;  // Motor drive status
bool  brakeActive       = false; // Brake caliper / electrical brake status
bool  obstacleDetected  = false; // True if obstacle within 5m
String brakeMode        = "none";// "none" | "manual" | "automatic"
bool  doorOpen          = false; // Car door open / closed
unsigned long lastTelemetryTime = 0;
unsigned long wifiConnectStart  = 0;
bool wifiConnected              = false;

// Read distance in meters from HC-SR04 ultrasonic sensor
float readUltrasonicMeters() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  // Measure echo pulse (timeout 30ms = ~5.1 meters max range)
  long duration = pulseIn(PIN_ECHO, HIGH, 30000);
  if (duration <= 0) return 6.0; // No obstacle within sensor range

  // Distance in meters: (time in us * speed of sound 343 m/s) / 2 / 1,000,000
  float dist = (duration * 0.0343) / 2.0 / 100.0;
  if (dist < 0.02) dist = 0.02; // Minimum HC-SR04 blind-zone limit
  return dist;
}

// Actuate Automatic Emergency Brake
void triggerAutomaticEmergencyBrake() {
  brakeActive = true;
  brakeMode   = "automatic";
  motorRunning = false;
  currentSpeed = 0.0;

  // 1. Cut motor power immediately
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN3, LOW);

  // 2. Counter-EMF electrical reverse brake pulse (80ms)
  digitalWrite(PIN_IN2, HIGH);
  digitalWrite(PIN_IN4, HIGH);
  delay(80);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN4, LOW);

  // 3. Clamp mechanical servo brake caliper (90 degrees)
  brakeServo.write(90);

  // 4. Activate acoustic alarm buzzer and brake lamp
  digitalWrite(PIN_BUZZER, HIGH);
}

// Release Brakes and Resume Cruising
void releaseBrakes() {
  brakeActive = false;
  brakeMode   = "none";
  motorRunning = true;
  currentSpeed = 35.0;

  // Engage forward motor drive
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN4, LOW);

  // Release servo brake caliper (0 degrees)
  brakeServo.write(0);
  digitalWrite(PIN_BUZZER, LOW);
}

// Handle commands from Web Browser (via USB Serial or WebSocket)
void handleIncomingCommand(String payload) {
  StaticJsonDocument<200> doc;
  DeserializationError err = deserializeJson(doc, payload);
  if (err) return;

  const char* cmd = doc["command"];
  if (!cmd) return;

  if (strcmp(cmd, "BRAKE") == 0) {
    brakeMode = "manual";
    triggerAutomaticEmergencyBrake();
  } else if (strcmp(cmd, "CRUISE") == 0) {
    releaseBrakes();
  } else if (strcmp(cmd, "STOP") == 0) {
    motorRunning = false;
    currentSpeed = 0.0;
    digitalWrite(PIN_IN1, LOW);
    digitalWrite(PIN_IN3, LOW);
  } else if (strcmp(cmd, "BUZZER_TEST") == 0) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(200);
    digitalWrite(PIN_BUZZER, LOW);
  }
}

// WebSocket Event Callback
void webSocketEvent(uint8_t num, WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_TEXT) {
    String message = String((char*)payload);
    handleIncomingCommand(message);
  }
}

void setup() {
  // Start High-Speed Serial for Web Serial API
  Serial.begin(115200);
  Serial.println("\\n[ESP32] System Booting: Automatic Car Braking Digital Twin");

  // Configure GPIO Pins
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_IN3, OUTPUT);
  pinMode(PIN_IN4, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_DOOR, INPUT_PULLUP);

  // Initial Pin States
  digitalWrite(PIN_TRIG, LOW);
  digitalWrite(PIN_IN1, HIGH); // Start in gentle cruise
  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN4, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  // Initialize SG90 Brake Servo
  brakeServo.attach(PIN_SERVO);
  brakeServo.write(0); // 0 degrees = Disengaged / Free Rolling

  // Non-blocking Wi-Fi Attempt (Won't hang if offline!)
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  wifiConnectStart = millis();

  // Start WebSocket Server on Port 81
  webSocket.begin();
  webSocket.onEvent(webSocketEvent);

  Serial.println("[ESP32] Ready! Streaming telemetry over USB Serial (115200 baud)...");
}

void loop() {
  // Process WebSocket clients
  webSocket.loop();

  // Read Incoming Serial Commands from Web App
  if (Serial.available()) {
    String input = Serial.readStringUntil('\\n');
    input.trim();
    if (input.startsWith("{") && input.endsWith("}")) {
      handleIncomingCommand(input);
    }
  }

  // Check Wi-Fi status asynchronously (first 8 seconds)
  if (!wifiConnected && WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.print("[WIFI] Connected! Local IP: ");
    Serial.println(WiFi.localIP());
  }

  // 1. Measure Distance via Ultrasonic Sensor
  currentDistance = readUltrasonicMeters();
  obstacleDetected = (currentDistance < CAUTION_THRESHOLD);

  // 2. Read Door Switch
  doorOpen = (digitalRead(PIN_DOOR) == HIGH); // High when magnet is separated

  // 3. AUTOMATIC BRAKING LOGIC
  if (motorRunning && currentDistance <= DANGER_THRESHOLD && !brakeActive) {
    triggerAutomaticEmergencyBrake();
  }

  // 4. WARNING BUZZER BEEP CADENCE (Intermittent beep when < 3.0m)
  if (currentDistance <= WARNING_THRESHOLD && currentDistance > DANGER_THRESHOLD) {
    bool beepState = (millis() % 240 < 120);
    digitalWrite(PIN_BUZZER, beepState ? HIGH : LOW);
  } else if (!brakeActive) {
    digitalWrite(PIN_BUZZER, LOW);
  }

  // 5. BROADCAST TELEMETRY TO WEB DIGITAL TWIN (Every 50ms = 20 Hz)
  if (millis() - lastTelemetryTime >= 50) {
    lastTelemetryTime = millis();

    StaticJsonDocument<256> doc;
    doc["car_status"]     = brakeActive ? (currentSpeed == 0 ? "stopped" : "braking") : (motorRunning ? "running" : "off");
    doc["speed"]          = round(currentSpeed * 10.0) / 10.0;
    doc["distance"]       = round(currentDistance * 100.0) / 100.0;
    doc["motor"]          = motorRunning;
    doc["brake"]          = brakeActive;
    doc["obstacle"]       = obstacleDetected;
    doc["brake_mode"]     = brakeMode;
    doc["door_open"]      = doorOpen;
    doc["esp32_connected"]= true;
    doc["voltage"]        = 11.9;
    doc["wifi_rssi"]      = wifiConnected ? WiFi.RSSI() : 0;

    String jsonString;
    serializeJson(doc, jsonString);

    // Stream 1: Direct USB Web Serial (Works instantly in browser!)
    Serial.println(jsonString);

    // Stream 2: Wi-Fi WebSocket (For wireless laptops/phones!)
    if (wifiConnected) {
      webSocket.broadcastTXT(jsonString);
    }
  }
}
`;

export const SERIAL_ONLY_SKETCH = `/*
 * =======================================================================================
 * PROJECT: IoT Automatic Car Braking - Lightweight USB Web Serial Sketch
 * ZERO WI-FI SETUP NEEDED! Plug ESP32 directly into your laptop USB port.
 * 
 * SENSORS & ACTUATORS:
 *   - HC-SR04: Trig = GPIO 5, Echo = GPIO 18
 *   - Motors : IN1 = 25, IN2 = 26
 *   - Buzzer : GPIO 2
 *   - Servo  : GPIO 4
 * =======================================================================================
 */

#include <ArduinoJson.h>
#include <ESP32Servo.h>

const int PIN_TRIG   = 5;
const int PIN_ECHO   = 18;
const int PIN_IN1    = 25;
const int PIN_IN2    = 26;
const int PIN_SERVO  = 4;
const int PIN_BUZZER = 2;
const int PIN_DOOR   = 15;

Servo brakeServo;
float dist = 6.0;
float spd  = 35.0;
bool motor = true;
bool brake = false;
unsigned long lastSend = 0;

float getDistance() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long d = pulseIn(PIN_ECHO, HIGH, 30000);
  if (d <= 0) return 6.0;
  return (d * 0.0343) / 2.0 / 100.0;
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_DOOR, INPUT_PULLUP);
  brakeServo.attach(PIN_SERVO);
  brakeServo.write(0);
  digitalWrite(PIN_IN1, HIGH);
}

void loop() {
  dist = getDistance();

  // Automatic emergency brake when < 1.0m
  if (dist <= 1.0 && !brake) {
    brake = true;
    motor = false;
    spd = 0.0;
    digitalWrite(PIN_IN1, LOW);
    digitalWrite(PIN_IN2, HIGH);
    delay(70);
    digitalWrite(PIN_IN2, LOW);
    brakeServo.write(90);
    digitalWrite(PIN_BUZZER, HIGH);
  }

  // Warning beeper between 1.0m and 3.0m
  if (dist <= 3.0 && dist > 1.0) {
    digitalWrite(PIN_BUZZER, (millis() % 260 < 130) ? HIGH : LOW);
  } else if (!brake) {
    digitalWrite(PIN_BUZZER, LOW);
  }

  // Stream JSON packet to Web Serial at 20 FPS (every 50ms)
  if (millis() - lastSend >= 50) {
    lastSend = millis();
    StaticJsonDocument<220> doc;
    doc["car_status"]      = brake ? "stopped" : "running";
    doc["speed"]           = spd;
    doc["distance"]        = round(dist * 100.0) / 100.0;
    doc["motor"]           = motor;
    doc["brake"]           = brake;
    doc["obstacle"]        = (dist < 5.0);
    doc["brake_mode"]      = brake ? "automatic" : "none";
    doc["door_open"]       = (digitalRead(PIN_DOOR) == HIGH);
    doc["esp32_connected"] = true;

    String json;
    serializeJson(doc, json);
    Serial.println(json);
  }
}
`;

export const SOFT_AP_SKETCH = `/*
 * =======================================================================================
 * PROJECT: IoT Automatic Car Braking - SoftAP Standalone Wi-Fi Hotspot
 * Creates its own Wi-Fi Hotspot: "ESP32_AutoBrake_Car" (Pass: 12345678)
 * Connect your laptop/phone to this Wi-Fi and open WebSocket at: ws://192.168.4.1:81
 * =======================================================================================
 */

#include <WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

const char* AP_SSID = "ESP32_AutoBrake_Car";
const char* AP_PASS = "12345678";

WebSocketsServer webSocket(81);
Servo brakeServo;

const int PIN_TRIG   = 5;
const int PIN_ECHO   = 18;
const int PIN_IN1    = 25;
const int PIN_IN2    = 26;
const int PIN_SERVO  = 4;
const int PIN_BUZZER = 2;

float dist = 6.0;
float spd  = 35.0;
bool motor = true;
bool brake = false;
unsigned long lastSend = 0;

float getDistance() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  long d = pulseIn(PIN_ECHO, HIGH, 30000);
  if (d <= 0) return 6.0;
  return (d * 0.0343) / 2.0 / 100.0;
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  brakeServo.attach(PIN_SERVO);
  brakeServo.write(0);

  // Start ESP32 SoftAP Hotspot
  WiFi.softAP(AP_SSID, AP_PASS);
  Serial.print("SoftAP Created! IP: ");
  Serial.println(WiFi.softAPIP()); // Usually 192.168.4.1

  webSocket.begin();
}

void loop() {
  webSocket.loop();
  dist = getDistance();

  if (dist <= 1.0 && !brake) {
    brake = true;
    motor = false;
    spd = 0.0;
    digitalWrite(PIN_IN1, LOW);
    digitalWrite(PIN_IN2, HIGH);
    delay(70);
    digitalWrite(PIN_IN2, LOW);
    brakeServo.write(90);
    digitalWrite(PIN_BUZZER, HIGH);
  }

  if (millis() - lastSend >= 50) {
    lastSend = millis();
    StaticJsonDocument<220> doc;
    doc["car_status"]      = brake ? "stopped" : "running";
    doc["speed"]           = spd;
    doc["distance"]        = round(dist * 100.0) / 100.0;
    doc["motor"]           = motor;
    doc["brake"]           = brake;
    doc["obstacle"]        = (dist < 5.0);
    doc["brake_mode"]      = brake ? "automatic" : "none";
    doc["esp32_connected"] = true;

    String json;
    serializeJson(doc, json);
    Serial.println(json);
    webSocket.broadcastTXT(json);
  }
}
`;
