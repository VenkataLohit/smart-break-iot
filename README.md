# IoT-Based Automatic Car Braking and Real-Time Vehicle Monitoring System
### Autonomous Collision Avoidance & Digital Twin Telemetry Platform

A comprehensive college capstone IoT project demonstrating predictive vehicular safety, automated emergency braking (AEB), and real-time digital twin synchronization between a physical ESP32 robotic prototype and an interactive web monitoring dashboard.

---

## 1. System Architecture

```
+-------------------------------------------------------------+
|                     PHYSICAL IOT VEHICLE                    |
|                                                             |
|  +----------------+      +-------------+      +----------+  |
|  |  HC-SR04 Sonar | ---> |    ESP32    | ---> |  L298N   |  |
|  | (Echo & Trig)  |      | Dual-Core   |      |  Motors  |  |
|  +----------------+      |  FreeRTOS   |      +----------+  |
|                          |             | ---> |  Servo   |  |
|                          +-------------+      |  Brake   |  |
+---------------------------------+---------------------------+
                                  |
                                  | 802.11 Wi-Fi (JSON Telemetry)
                                  v
+-------------------------------------------------------------+
|                      BACKEND GATEWAY                        |
|                                                             |
|  +-------------------------------------------------------+  |
|  |     Python FastAPI / Express Server (server.ts)       |  |
|  |  Endpoints: /api/status, /api/vehicle, /api/esp32/     |  |
|  |          WebSocket Broadcast Manager (/ws)            |  |
|  +-------------------------------------------------------+  |
+---------------------------------+---------------------------+
                                  |
                                  | Bi-Directional WebSocket (60 FPS)
                                  v
+-------------------------------------------------------------+
|                 WEB DIGITAL TWIN DASHBOARD                  |
|                                                             |
|  * Animated Vehicle Simulation with Moving Road Markings     |
|  * Headlight & Neon Underglow Projections                   |
|  * Bright Red Taillight Brake Glare on Deceleration         |
|  * Front Ultrasonic Radar Wave Emission & Laser Distance    |
|  * Speedometer Gauge & Proximity Gradient Bar               |
|  * Complete Demo Simulator Mode for Indoor Presentations    |
|  * Trip Telemetry History & Safety Incident Log             |
+-------------------------------------------------------------+
```

---

## 2. Hardware Bill of Materials (BOM)

| Component | Specification | Quantity | Role |
| :--- | :--- | :--- | :--- |
| **Microcontroller** | ESP32 NodeMCU-32S (Xtensa 240MHz) | 1 | Real-time processing & Wi-Fi telemetry |
| **Ultrasonic Sensor**| HC-SR04 (40 kHz, 2cm-400cm range) | 1 | Frontal collision obstacle detection |
| **Motor Driver** | L298N Dual H-Bridge | 1 | DC motor speed & counter-EMF reverse brake |
| **Drive Motors** | 4x DC Geared BO Motors (300 RPM @ 12V)| 4 | Vehicle propulsion |
| **Brake Actuator** | SG90 / MG996R Micro Servo | 1 | Physical caliper disc brake pad clamp |
| **Power Source** | 11.1V 3S 2200mAh LiPo Battery | 1 | High-current powertrain supply |
| **Voltage Regulator**| LM2596 Buck Converter (Step-down to 5V)| 1 | Clean 5V logic power for ESP32 & sensors |
| **Audio Alarm** | 5V Active Buzzer & Red Ultra-bright LED| 1 | On-board acoustic & visual brake warning |

---

## 3. Hardware Pinout Table

| ESP32 Pin | Connected Component | Signal Type | Description |
| :--- | :--- | :--- | :--- |
| **GPIO 5** | HC-SR04 `TRIG` | Digital Output | 10µs ultrasonic burst trigger |
| **GPIO 18** | HC-SR04 `ECHO` | Digital Input | Echo pulse duration (via 1kΩ/2kΩ divider) |
| **GPIO 25** | L298N `IN1` | PWM Output | Left forward motor drive |
| **GPIO 26** | L298N `IN2` | PWM Output | Left reverse / dynamic counter-EMF brake |
| **GPIO 27** | L298N `IN3` | PWM Output | Right forward motor drive |
| **GPIO 14** | L298N `IN4` | PWM Output | Right reverse / dynamic counter-EMF brake |
| **GPIO 4** | SG90 Servo `Signal` | PWM (50 Hz) | Mechanical brake pad clamp angle (0°-90°) |
| **GPIO 2** | Buzzer / Brake LED | Digital Output | Active buzzer and high-intensity tail stop lamp |

---

## 4. Automatic Braking Logic

The ESP32 continuously samples the ultrasonic distance:

1. **Safe Zone ($> 5.0\text{ m}$)**:
   - Green indicator, propulsion active, zero braking torque.
2. **Caution Zone ($3.0\text{ m} - 5.0\text{ m}$)**:
   - Yellow warning, radar cone locks onto front target.
3. **Warning Zone ($1.0\text{ m} - 3.0\text{ m}$)**:
   - Orange alert, intermittent $950\text{ Hz}$ acoustic buzzer beeps.
4. **Danger Zone ($\le 1.0\text{ m}$)**:
   - **Emergency Automatic Braking Activated!**
   - Motor PWM cut immediately to $0$.
   - Counter-EMF reverse pulse applied ($120\text{ ms}$) to arrest rotor inertia.
   - Micro-servo clamps mechanical brake pad against wheel disc.
   - Red tail lamps illuminate with maximum glow.
   - Vehicle comes to a complete halt before impact ($0\text{ km/h}$).

---

## 5. Quick Start & Execution

### Running the Digital Twin Dashboard (Full-Stack)
```bash
# 1. Install dependencies
npm install

# 2. Run the full-stack server (Port 3000)
npm run dev
```
Open `http://localhost:3000` in your browser.

### Running the Python FastAPI Backend (Alternative)
```bash
# 1. Install Python requirements
pip install -r backend/requirements.txt

# 2. Start the FastAPI server
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### Uploading ESP32 Firmware
1. Open `firmware/esp32_auto_brake.ino` in **Arduino IDE**.
2. Select Board: **ESP32 Dev Module**.
3. Install required libraries via Library Manager:
   - `WebSockets` by Markus Sattler
   - `ArduinoJson` (v6 or v7)
   - `ESP32Servo` by Kevin Harrington
4. Update `ssid` and `password` with your Wi-Fi network.
5. Click **Upload** and open Serial Monitor at **115200 baud**.

---

## 6. Viva Presentation Demo Script

For your college examination or expo presentation:

1. **Step 1**: Open the website in **Demo Simulator Mode**.
2. **Step 2**: Explain the dashboard architecture (speedometer gauge, ultrasonic distance bar, ESP32 status, and animated car digital twin).
3. **Step 3**: Click **"RUN FULL AUTO-BRAKE DEMO FLOW"**.
4. **Step 4**: Highlight the 6 phases:
   - Engine ignition & headlights turn on.
   - Acceleration on moving roadway to $35\text{ km/h}$.
   - Obstacle appears ahead on the highway.
   - Acoustic ADAS proximity beeps trigger as distance decreases.
   - At $\le 1.0\text{ m}$, the banner flashes **"AUTOMATIC BRAKING ACTIVATED"**, rear taillights glow bright neon red, and the car comes to a stop without colliding with the barrier!
5. **Step 5**: Show the **Alerts History** timeline and **Trip Analytics** charts displaying the Speed vs Time and Min Distance curves.
