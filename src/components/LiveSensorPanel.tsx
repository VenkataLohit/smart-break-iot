import React from 'react';
import { TelemetryData } from '../types/telemetry';
import { 
  Radio, 
  Activity, 
  Cpu, 
  ShieldAlert, 
  Wifi, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  DoorOpen,
  DoorClosed
} from 'lucide-react';

interface LiveSensorPanelProps {
  telemetry: TelemetryData;
}

export const LiveSensorPanel: React.FC<LiveSensorPanelProps> = ({ telemetry }) => {
  const {
    speed,
    distance,
    motor,
    brake,
    obstacle,
    brake_mode,
    esp32_connected,
    wifi_rssi = -54,
    timestamp,
    door_open = false,
  } = telemetry;

  const isAutoBrake = brake_mode === 'automatic';

  return (
    <div className="cyber-panel rounded-2xl p-5 border border-cyan-500/25 shadow-xl">
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-cyan-500/20">
        <div className="flex items-center gap-2.5 text-cyan-400">
          <Activity className="w-5 h-5 animate-pulse" />
          <h3 className="font-tech text-base font-bold uppercase tracking-wider text-white">
            LIVE SENSOR DATA TELEMETRY PANEL
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono-code text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>CLOSED-LOOP SENSOR REFRESH: 20 Hz</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 text-xs">
        {/* Distance */}
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90">
          <span className="text-[11px] font-mono-code text-slate-400 block mb-1">ULTRASONIC DISTANCE</span>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-tech text-2xl font-bold ${distance <= 1.0 ? 'text-red-400' : distance <= 3.0 ? 'text-amber-400' : 'text-cyan-300'}`}>
              {distance.toFixed(2)}
            </span>
            <span className="font-mono-code text-xs text-slate-400">meters</span>
          </div>
        </div>

        {/* Speed */}
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90">
          <span className="text-[11px] font-mono-code text-slate-400 block mb-1">SPEED</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-tech text-2xl font-bold text-white">
              {Math.round(speed)}
            </span>
            <span className="font-mono-code text-xs text-slate-400">km/h</span>
          </div>
        </div>

        {/* Motor */}
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90">
          <span className="text-[11px] font-mono-code text-slate-400 block mb-1">MOTOR DRIVE</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${motor ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span className={`font-tech text-sm font-bold tracking-wider ${motor ? 'text-emerald-400' : 'text-slate-400'}`}>
              {motor ? 'ACTIVE (ON)' : 'CUTOFF (OFF)'}
            </span>
          </div>
        </div>

        {/* Brake */}
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90">
          <span className="text-[11px] font-mono-code text-slate-400 block mb-1">BRAKE ACTUATOR</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${brake ? (isAutoBrake ? 'bg-red-500 animate-ping' : 'bg-blue-500') : 'bg-emerald-400'}`} />
            <span className={`font-tech text-sm font-bold tracking-wider ${brake ? (isAutoBrake ? 'text-red-400' : 'text-blue-400') : 'text-emerald-400'}`}>
              {brake ? (isAutoBrake ? 'AUTO BRAKE' : 'MANUAL BRAKE') : 'RELEASED (OFF)'}
            </span>
          </div>
        </div>

        {/* Obstacle */}
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90">
          <span className="text-[11px] font-mono-code text-slate-400 block mb-1">OBSTACLE DETECTED</span>
          <div className="flex items-center gap-2 mt-1">
            {obstacle ? (
              <span className="font-tech text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> DETECTED IN PATH
              </span>
            ) : (
              <span className="font-tech text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> CLEAR PATH
              </span>
            )}
          </div>
        </div>

        {/* ESP32 Status */}
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90">
          <span className="text-[11px] font-mono-code text-slate-400 block mb-1">ESP32 CONTROLLER</span>
          <div className="flex items-center gap-2 mt-1">
            <Cpu className={`w-4 h-4 ${esp32_connected ? 'text-emerald-400' : 'text-red-400'}`} />
            <span className={`font-tech text-sm font-bold ${esp32_connected ? 'text-emerald-400' : 'text-red-400'}`}>
              {esp32_connected ? 'ONLINE (SYNCED)' : 'DISCONNECTED'}
            </span>
          </div>
        </div>

        {/* Wi-Fi RSSI */}
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90">
          <span className="text-[11px] font-mono-code text-slate-400 block mb-1">WI-FI LINK SIGNAL</span>
          <div className="flex items-center gap-2 mt-1">
            <Wifi className="w-4 h-4 text-cyan-400" />
            <span className="font-tech text-sm font-bold text-cyan-300">
              {esp32_connected ? `${wifi_rssi} dBm (STRONG)` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Door Sensor */}
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90">
          <span className="text-[11px] font-mono-code text-slate-400 block mb-1">CABIN DOOR SENSOR</span>
          <div className="flex items-center gap-2 mt-1">
            {door_open ? (
              <span className="font-tech text-sm font-bold text-amber-400 flex items-center gap-1.5 animate-pulse">
                <DoorOpen className="w-4 h-4 text-amber-400" /> DOOR AJAR (OPEN)
              </span>
            ) : (
              <span className="font-tech text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <DoorClosed className="w-4 h-4 text-emerald-400" /> LOCKED & FLUSH
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
