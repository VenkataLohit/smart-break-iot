import React from 'react';
import { TelemetryData, SystemSettings } from '../types/telemetry';
import { SpeedometerGauge } from './SpeedometerGauge';
import { DistanceBar } from './DistanceBar';
import { 
  Gauge, 
  Ruler, 
  ShieldAlert, 
  Cpu, 
  AlertTriangle, 
  Wifi, 
  BatteryCharging, 
  Zap, 
  CheckCircle2, 
  AlertOctagon,
  DoorOpen,
  DoorClosed
} from 'lucide-react';

interface LiveDataCardsProps {
  telemetry: TelemetryData;
  settings: SystemSettings;
  onToggleDoor?: () => void;
}

export const LiveDataCards: React.FC<LiveDataCardsProps> = ({ telemetry, settings, onToggleDoor }) => {
  const {
    speed,
    distance,
    motor,
    brake,
    obstacle,
    brake_mode,
    door_open = false,
    esp32_connected,
    wifi_rssi = -54,
    voltage = 11.8,
    current_draw = 1.35,
    motor_pwm = motor ? Math.min(255, Math.round((speed / settings.max_speed) * 255)) : 0,
  } = telemetry;

  const isAutoBrake = brake_mode === 'automatic';
  const isDanger = distance <= settings.danger_threshold && obstacle;

  // Wi-Fi signal rating
  let wifiRating = 'Strong';
  let wifiColor = 'text-emerald-400';
  if (!esp32_connected) {
    wifiRating = 'Offline';
    wifiColor = 'text-red-400';
  } else if (wifi_rssi < -75) {
    wifiRating = 'Weak';
    wifiColor = 'text-amber-400';
  } else if (wifi_rssi < -65) {
    wifiRating = 'Good';
    wifiColor = 'text-cyan-400';
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3.5">
      {/* 1. SPEED CARD */}
      <div className="cyber-panel rounded-xl p-4 flex flex-col justify-between border-cyan-500/25 relative overflow-hidden group hover:border-cyan-400/50 transition-all">
        <div className="flex items-center justify-between text-xs font-tech text-slate-400 mb-1">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Gauge className="w-4 h-4" />
            <span className="font-bold uppercase tracking-wider">SPEED</span>
          </div>
          <span className="font-mono-code text-[11px] text-slate-500">MAX: {settings.max_speed}</span>
        </div>

        <div className="flex items-center justify-center my-1">
          <SpeedometerGauge speed={speed} maxSpeed={settings.max_speed} />
        </div>

        <div className="pt-2 border-t border-cyan-500/15 flex items-center justify-between text-[11px] font-mono-code text-slate-400">
          <span>VELOCITY</span>
          <span className="text-cyan-300 font-semibold">{((speed * 1000) / 3600).toFixed(1)} m/s</span>
        </div>
      </div>

      {/* 2. ULTRASONIC DISTANCE CARD */}
      <div className={`cyber-panel rounded-xl p-4 flex flex-col justify-between border-cyan-500/25 transition-all ${
        isDanger ? 'cyber-panel-danger border-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.3)] animate-pulse' : ''
      }`}>
        <div className="flex items-center justify-between text-xs font-tech text-slate-400 mb-2">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Ruler className="w-4 h-4" />
            <span className="font-bold uppercase tracking-wider">DISTANCE</span>
          </div>
          <span className="font-mono-code text-[10px] text-cyan-400/80">HC-SR04</span>
        </div>

        <div className="my-2">
          <DistanceBar
            distance={distance}
            dangerThreshold={settings.danger_threshold}
            warningThreshold={settings.warning_threshold}
            cautionThreshold={settings.caution_threshold}
          />
        </div>

        <div className="pt-2 border-t border-cyan-500/15 flex items-center justify-between text-[11px] font-mono-code text-slate-400">
          <span>TIME OF FLIGHT</span>
          <span className="text-cyan-300 font-semibold">{(distance * 5.8).toFixed(1)} ms</span>
        </div>
      </div>

      {/* 3. BRAKE STATUS CARD */}
      <div className={`cyber-panel rounded-xl p-4 flex flex-col justify-between transition-all ${
        brake
          ? isAutoBrake
            ? 'cyber-panel-danger border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse-red'
            : 'border-blue-500/60 bg-blue-950/30'
          : 'border-emerald-500/25'
      }`}>
        <div className="flex items-center justify-between text-xs font-tech text-slate-400 mb-2">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <ShieldAlert className="w-4 h-4" />
            <span className="font-bold uppercase tracking-wider">BRAKE STATUS</span>
          </div>
          <span className="font-mono-code text-[10px] text-slate-500">ACTUATOR</span>
        </div>

        <div className="my-auto py-2">
          {brake ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAutoBrake ? 'bg-red-400' : 'bg-blue-400'}`} />
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isAutoBrake ? 'bg-red-500' : 'bg-blue-500'}`} />
                </span>
                <span className={`font-tech text-base font-bold tracking-wider ${isAutoBrake ? 'text-red-400' : 'text-blue-400'}`}>
                  {isAutoBrake ? 'AUTO BRAKE' : 'MANUAL BRAKE'}
                </span>
              </div>
              <p className="text-[11px] font-mono-code text-slate-300">
                {isAutoBrake ? 'Collision Avoidance Lock' : 'Driver Hold'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-tech text-base font-bold text-emerald-400 tracking-wider">
                  RELEASED
                </span>
              </div>
              <p className="text-[11px] font-mono-code text-slate-400">
                Rotational Standby
              </p>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-cyan-500/15 flex items-center justify-between text-[11px] font-mono-code text-slate-400">
          <span>SYSTEM STATE</span>
          <span className={brake ? (isAutoBrake ? 'text-red-400 font-bold' : 'text-blue-400 font-bold') : 'text-emerald-400'}>
            {brake ? (isAutoBrake ? 'COLLISION STOP' : 'HOLD') : 'STANDBY'}
          </span>
        </div>
      </div>

      {/* 4. MOTOR STATUS CARD */}
      <div className="cyber-panel rounded-xl p-4 flex flex-col justify-between border-cyan-500/25">
        <div className="flex items-center justify-between text-xs font-tech text-slate-400 mb-2">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Zap className="w-4 h-4" />
            <span className="font-bold uppercase tracking-wider">MOTOR</span>
          </div>
          <span className="font-mono-code text-[10px] text-slate-500">L298N</span>
        </div>

        <div className="my-auto py-2 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className={`inline-block w-3 h-3 rounded-full ${motor ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className={`font-tech text-base font-bold tracking-wider ${motor ? 'text-emerald-300' : 'text-slate-400'}`}>
              {motor ? 'ACTIVE (ON)' : 'CUTOFF (OFF)'}
            </span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono-code text-slate-400">
              <span>PWM DUTY</span>
              <span className="text-cyan-300 font-semibold">{motor ? `${Math.round((motor_pwm / 255) * 100)}%` : '0%'}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${(motor_pwm / 255) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-cyan-500/15 flex items-center justify-between text-[11px] font-mono-code text-slate-400">
          <span>CURRENT</span>
          <span className="text-cyan-300 font-semibold">{motor ? `${current_draw.toFixed(2)} A` : '0.12 A'}</span>
        </div>
      </div>

      {/* 5. OBSTACLE STATUS CARD */}
      <div className={`cyber-panel rounded-xl p-4 flex flex-col justify-between transition-all ${
        obstacle 
          ? isDanger
            ? 'cyber-panel-danger border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.3)]'
            : 'cyber-panel-warning border-amber-500/60'
          : 'border-cyan-500/25'
      }`}>
        <div className="flex items-center justify-between text-xs font-tech text-slate-400 mb-2">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <AlertOctagon className="w-4 h-4" />
            <span className="font-bold uppercase tracking-wider">OBSTACLE</span>
          </div>
          <span className="font-mono-code text-[10px] text-slate-500">SONAR</span>
        </div>

        <div className="my-auto py-2">
          {obstacle ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`w-5 h-5 ${isDanger ? 'text-red-400 animate-bounce' : 'text-amber-400 animate-pulse'}`} />
                <span className={`font-tech text-base font-bold tracking-wider ${isDanger ? 'text-red-300' : 'text-amber-300'}`}>
                  DETECTED
                </span>
              </div>
              <p className="text-[11px] font-mono-code text-slate-300">
                Range: <strong className="text-white">{distance.toFixed(2)}m</strong>
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-tech text-base font-bold text-emerald-400 tracking-wider">
                  CLEAR PATH
                </span>
              </div>
              <p className="text-[11px] font-mono-code text-slate-400">
                Front &gt; 5.0m
              </p>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-cyan-500/15 flex items-center justify-between text-[11px] font-mono-code text-slate-400">
          <span>RADAR CONE</span>
          <span className={obstacle ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
            {obstacle ? 'ECHO RETURN' : '15° CLEAR'}
          </span>
        </div>
      </div>

      {/* 6. CAR DOORS & CABIN CARD (SHOWS DOOR OPEN/CLOSED STATE) */}
      <div className={`cyber-panel rounded-xl p-4 flex flex-col justify-between transition-all ${
        door_open ? 'border-amber-500/80 bg-amber-950/30 shadow-[0_0_25px_rgba(245,158,11,0.3)] animate-pulse-amber' : 'border-cyan-500/25'
      }`}>
        <div className="flex items-center justify-between text-xs font-tech text-slate-400 mb-2">
          <div className="flex items-center gap-1.5 text-cyan-400">
            {door_open ? <DoorOpen className="w-4 h-4 text-amber-400 animate-pulse" /> : <DoorClosed className="w-4 h-4" />}
            <span className="font-bold uppercase tracking-wider">DOORS & CABIN</span>
          </div>
          <span className="font-mono-code text-[10px] text-slate-500">SENSOR</span>
        </div>

        <div className="my-auto py-2">
          {door_open ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                <span className="font-tech text-base font-bold text-amber-300 tracking-wider">
                  DOOR AJAR (OPEN)
                </span>
              </div>
              <p className="text-[11px] font-mono-code text-slate-300">
                Cabin lights illuminated
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-tech text-base font-bold text-emerald-400 tracking-wider">
                  DOORS LOCKED
                </span>
              </div>
              <p className="text-[11px] font-mono-code text-slate-400">
                Cabin secure
              </p>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-cyan-500/15 flex items-center justify-between text-[11px] font-mono-code">
          {onToggleDoor ? (
            <button
              onClick={onToggleDoor}
              className={`w-full py-1.5 rounded-lg text-center font-tech font-bold text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                door_open 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.5)]' 
                  : 'bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-200'
              }`}
            >
              {door_open ? 'Click to Close Door' : 'Click to Open Door'}
            </button>
          ) : (
            <>
              <span className="text-slate-400">INTERLOCK</span>
              <span className={door_open ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                {door_open ? 'AJAR' : 'SECURE'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 7. ESP32 & POWER CARD */}
      <div className={`cyber-panel rounded-xl p-4 flex flex-col justify-between transition-all ${
        esp32_connected ? 'border-cyan-500/25' : 'border-red-500/40 bg-red-950/20'
      }`}>
        <div className="flex items-center justify-between text-xs font-tech text-slate-400 mb-2">
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Cpu className="w-4 h-4" />
            <span className="font-bold uppercase tracking-wider">ESP32-C</span>
          </div>
          <span className="font-mono-code text-[10px] text-slate-500">2.4 GHz</span>
        </div>

        <div className="my-auto py-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-3 h-3 rounded-full ${esp32_connected ? 'bg-emerald-400' : 'bg-red-500'}`} />
              <span className={`font-tech text-base font-bold tracking-wider ${esp32_connected ? 'text-emerald-300' : 'text-red-400'}`}>
                {esp32_connected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono-code text-slate-300">
            <div className="flex items-center gap-1">
              <Wifi className={`w-3.5 h-3.5 ${wifiColor}`} />
              <span>Wi-Fi: <strong className={wifiColor}>{wifiRating}</strong></span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400">
              <BatteryCharging className="w-3.5 h-3.5" />
              <span>{voltage.toFixed(1)}V</span>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-cyan-500/15 flex items-center justify-between text-[11px] font-mono-code text-slate-400">
          <span>SAMPLING</span>
          <span className="text-cyan-300 font-semibold">{esp32_connected ? '20 Hz' : 'LOST'}</span>
        </div>
      </div>
    </div>
  );
};
