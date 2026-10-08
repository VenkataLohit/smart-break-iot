export type CarStatus = 'off' | 'starting' | 'running' | 'braking' | 'stopped';

export type BrakeMode = 'none' | 'manual' | 'automatic';

export type DistanceZone = 'safe' | 'caution' | 'warning' | 'danger';

export interface TelemetryData {
  car_status: CarStatus;
  speed: number;              // km/h (0 to 100)
  distance: number;           // meters (e.g. 2.4)
  motor: boolean;             // true if motor driver active
  brake: boolean;             // true if braking mechanism engaged
  obstacle: boolean;          // true if obstacle detected within detection zone
  brake_mode: BrakeMode;      // 'none' | 'manual' | 'automatic'
  door_open: boolean;         // true if car door is open (reed switch / sensor)
  doors?: {
    driver: boolean;
    passenger: boolean;
  };
  esp32_connected: boolean;   // true if ESP32 heartbeat active
  wifi_rssi?: number;         // dBm, e.g. -58
  voltage?: number;           // Battery V, e.g. 11.8
  current_draw?: number;      // Current A, e.g. 1.4
  timestamp: string;          // ISO string or HH:MM:SS
  motor_pwm?: number;         // PWM duty cycle 0-255
  obstacle_type?: 'barrier' | 'pedestrian' | 'vehicle' | 'cone' | 'wall';
  car_model?: 'titan' | 'prototype' | 'interceptor'; // Switchable visual car graphic model
}

export interface SystemSettings {
  danger_threshold: number;   // default 1.0 m (Automatic Brake Trigger)
  warning_threshold: number;  // default 3.0 m (Buzzer & Orange Warning)
  caution_threshold: number;  // default 5.0 m (Yellow Caution)
  max_speed: number;          // default 45 km/h
  demo_mode: boolean;         // true for interactive web simulator
  audio_alerts: boolean;      // synthesized Web Audio beep
  auto_brake_enabled: boolean;// emergency braking feature flag
  esp32_endpoint: string;     // ESP32 IP or URL
}

export interface AlertEvent {
  id: string;
  timestamp: string;
  event: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  distance: number;
  speed: number;
  source: 'automatic_brake' | 'manual_brake' | 'sensor' | 'system';
  details?: string;
}

export interface HistoryPoint {
  time: string;
  speed: number;
  distance: number;
  brakeActive: boolean;
  autoBrake: boolean;
}

export interface TripHistory {
  id: string;
  title: string;
  timestamp: string;
  durationSeconds: number;
  distanceMeters: number;
  maxSpeed: number;
  avgSpeed: number;
  autoBrakeCount: number;
  manualBrakeCount: number;
  status: 'completed' | 'active';
  points: HistoryPoint[];
}
