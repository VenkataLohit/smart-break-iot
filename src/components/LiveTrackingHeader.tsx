import React from 'react';
import { 
  Radio, 
  Cpu, 
  Usb, 
  Wifi, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Zap, 
  RefreshCw,
  Power,
  Code2
} from 'lucide-react';
import { SerialConnectionStatus } from '../utils/webSerial';

interface LiveTrackingHeaderProps {
  serialStatus: SerialConnectionStatus;
  isWsConnected: boolean;
  isAutoSenseLoopActive: boolean;
  onToggleAutoSenseLoop: () => void;
  onConnectSerial: () => void;
  onDisconnectSerial: () => void;
  onConnectWs: () => void;
  onOpenEsp32Modal?: () => void;
  lastPacketTime?: string;
  totalPackets: number;
  carStatus: string;
  obstacle: boolean;
  distance: number;
}

export const LiveTrackingHeader: React.FC<LiveTrackingHeaderProps> = ({
  serialStatus,
  isWsConnected,
  isAutoSenseLoopActive,
  onToggleAutoSenseLoop,
  onConnectSerial,
  onDisconnectSerial,
  onOpenEsp32Modal,
  lastPacketTime,
  totalPackets,
  carStatus,
  obstacle,
  distance,
}) => {
  const isHardwareLive = serialStatus.isConnected || isWsConnected;

  return (
    <div className="cyber-panel rounded-2xl p-4 sm:p-5 border border-cyan-500/35 bg-gradient-to-r from-[#02050c]/98 via-[#060e20]/98 to-[#02050c]/98 shadow-[0_0_35px_rgba(6,182,212,0.15)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Active Live-Tracking Status */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-xl ${
              isHardwareLive
                ? 'bg-emerald-950/90 border-emerald-500/70 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                : 'bg-cyan-950/90 border-cyan-500/60 text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)]'
            }`}>
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black ${
              isHardwareLive ? 'bg-emerald-400 animate-ping' : 'bg-cyan-400'
            }`} />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-tech text-base sm:text-lg font-bold text-white tracking-wide">
                AUTOMATIC ESP32-C REAL-TIME DIGITAL TWIN
              </h2>
              <span className={`text-[10px] font-mono-code font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                serialStatus.isConnected
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : isWsConnected
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-blue-950 text-blue-300 border-blue-500'
              }`}>
                {serialStatus.isConnected
                  ? '⚡ USB HARDWARE SERIAL'
                  : isWsConnected
                  ? '🌐 WI-FI WEBSOCKET STREAM'
                  : '🤖 AUTONOMOUS RADAR SENSING'}
              </span>
            </div>

            <p className="text-xs text-slate-300 font-sans flex items-center gap-2 mt-1">
              <span>Autonomous Closed-Loop Collision Avoidance — Whenever an obstacle approaches, the ESP32 automatically senses it, cuts motors, and stops the vehicle safely.</span>
            </p>
          </div>
        </div>

        {/* Right: Live Hardware Connection Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-tech">
          {/* Arduino IDE Code & Setup Button */}
          {onOpenEsp32Modal && (
            <button
              onClick={onOpenEsp32Modal}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/60 hover:bg-cyan-900 text-cyan-200 font-bold tracking-wider shadow-lg hover:shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
              title="Open Arduino IDE C++ Sketch, Flashing Guide & Wiring"
            >
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Arduino IDE Code (.ino)</span>
            </button>
          )}

          {/* USB Serial Connect Button (Direct hardware link for ESP32 / ESP32-C3) */}
          {serialStatus.isConnected ? (
            <button
              onClick={onDisconnectSerial}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/90 border border-emerald-500/80 text-emerald-300 font-bold hover:bg-rose-950/80 hover:text-rose-300 hover:border-rose-500 transition-all cursor-pointer shadow-lg"
            >
              <Usb className="w-4 h-4 text-emerald-400" />
              <span>ESP32-C Connected (Click to Unplug)</span>
            </button>
          ) : (
            <button
              onClick={onConnectSerial}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold tracking-wider shadow-lg hover:shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <Usb className="w-4 h-4" />
              <span>Connect Physical ESP32 via USB</span>
            </button>
          )}

          {/* Autonomous Sensing Loop Toggle */}
          {!isHardwareLive && (
            <button
              onClick={onToggleAutoSenseLoop}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-bold tracking-wider transition-all cursor-pointer ${
                isAutoSenseLoopActive
                  ? 'bg-purple-950/80 border-purple-500/70 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Runs autonomous real-time sensor loop simulating actual ESP32 firmware"
            >
              <RefreshCw className={`w-4 h-4 ${isAutoSenseLoopActive ? 'animate-spin text-purple-400' : 'text-slate-400'}`} />
              <span>{isAutoSenseLoopActive ? 'Auto-Sensing: Active' : 'Start Auto-Sensing'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Telemetry Stream Diagnostics Strip */}
      <div className="mt-3.5 pt-3 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono-code text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>CAR STATE: <strong className="text-cyan-300 uppercase">{carStatus}</strong></span>
          </span>
          <span>·</span>
          <span>SONAR ECHO: <strong className={obstacle ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>{obstacle ? `${distance.toFixed(2)}m (OBSTACLE DETECTED)` : 'CLEAR PATH (>5.0m)'}</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <span>PACKETS: <strong className="text-white">{totalPackets}</strong></span>
          <span>·</span>
          <span>BUS LATENCY: <strong className="text-emerald-400">&lt; 12ms</strong></span>
          <span>·</span>
          <span>LAST FRAME: <strong className="text-slate-300">{lastPacketTime || 'Live'}</strong></span>
        </div>
      </div>
    </div>
  );
};
