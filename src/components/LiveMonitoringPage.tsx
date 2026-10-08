import React, { useState, useEffect } from 'react';
import { TelemetryData } from '../types/telemetry';
import { 
  Activity, 
  Terminal, 
  Radio, 
  Sliders, 
  Cpu, 
  Wifi, 
  Copy, 
  Check, 
  Play, 
  Pause,
  ArrowDown
} from 'lucide-react';

interface LiveMonitoringPageProps {
  telemetry: TelemetryData;
  historyStream: TelemetryData[];
}

export const LiveMonitoringPage: React.FC<LiveMonitoringPageProps> = ({
  telemetry,
  historyStream,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [frozenPacket, setFrozenPacket] = useState<TelemetryData | null>(null);

  const displayData = isPaused && frozenPacket ? frozenPacket : telemetry;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(displayData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePause = () => {
    if (!isPaused) {
      setFrozenPacket({ ...telemetry });
      setIsPaused(true);
    } else {
      setIsPaused(false);
      setFrozenPacket(null);
    }
  };

  // Recent 30 data points for waveform canvas
  const recentPoints = historyStream.slice(-30);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-cyan-500/20">
        <div>
          <h2 className="font-tech text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
            HIGH-FREQUENCY SENSOR OSCILLOSCOPE & PACKET BUS
          </h2>
          <p className="text-xs text-slate-400 font-mono-code">
            Direct telemetry stream sampled over WebSocket (/ws) from ESP32 RTOS FreeRTOS task
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={togglePause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-tech text-slate-200 border border-slate-700 cursor-pointer"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isPaused ? 'Resume Feed' : 'Freeze Frame'}</span>
          </button>

          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/30 text-xs font-tech cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied JSON!' : 'Copy Packet JSON'}</span>
          </button>
        </div>
      </div>

      {/* Waveform Oscilloscopes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Distance Oscilloscope */}
        <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-3 text-xs font-tech">
            <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-cyan-400" />
              ULTRASONIC DISTANCE OSCILLOSCOPE (HC-SR04)
            </span>
            <span className="font-mono-code text-cyan-300">CURR: {displayData.distance.toFixed(2)} m</span>
          </div>

          {/* SVG Waveform Line */}
          <div className="relative h-44 w-full bg-[#040812] rounded-xl border border-slate-800 p-2 overflow-hidden">
            {/* Grid lines */}
            <div className="absolute inset-0 tech-grid-bg opacity-40 pointer-events-none" />

            {/* Threshold horizontal guidelines */}
            <div className="absolute left-0 right-0 top-[83%] border-t border-dashed border-red-500/50 flex justify-end pr-2 text-[10px] font-mono-code text-red-400">
              Auto Brake 1.0m
            </div>
            <div className="absolute left-0 right-0 top-[50%] border-t border-dashed border-amber-500/50 flex justify-end pr-2 text-[10px] font-mono-code text-amber-400">
              Warning 3.0m
            </div>

            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
              {recentPoints.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={recentPoints
                    .map((pt, i) => {
                      const x = (i / (recentPoints.length - 1)) * 300;
                      // Invert Y so high distance is top, 0 is bottom (max 6m)
                      const y = Math.min(115, Math.max(5, 120 - (pt.distance / 6.0) * 115));
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              )}
            </svg>
          </div>

          <div className="flex items-center justify-between mt-2 text-[11px] font-mono-code text-slate-400">
            <span>Sampling: 50ms intervals</span>
            <span>Range: 0.0m - 6.0m</span>
          </div>
        </div>

        {/* Speed Oscilloscope */}
        <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20">
          <div className="flex items-center justify-between mb-3 text-xs font-tech">
            <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              VEHICLE VELOCITY TRACE (HALL SENSOR / ENCODER)
            </span>
            <span className="font-mono-code text-white">CURR: {Math.round(displayData.speed)} km/h</span>
          </div>

          <div className="relative h-44 w-full bg-[#040812] rounded-xl border border-slate-800 p-2 overflow-hidden">
            <div className="absolute inset-0 tech-grid-bg opacity-40 pointer-events-none" />

            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
              {recentPoints.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={recentPoints
                    .map((pt, i) => {
                      const x = (i / (recentPoints.length - 1)) * 300;
                      // 0 to 60 km/h
                      const y = Math.min(115, Math.max(5, 120 - (pt.speed / 60) * 115));
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              )}
            </svg>
          </div>

          <div className="flex items-center justify-between mt-2 text-[11px] font-mono-code text-slate-400">
            <span>Motor State: {displayData.motor ? 'PWM Driven' : 'Cut-off'}</span>
            <span>Scale: 0 - 60 km/h</span>
          </div>
        </div>
      </div>

      {/* Raw WebSocket Packet Inspector & FreeRTOS Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Packet Inspector (2 Cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-4 border border-cyan-500/20">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800 text-xs font-tech">
            <div className="flex items-center gap-2 text-cyan-400">
              <Terminal className="w-4 h-4" />
              <span className="font-bold uppercase tracking-wider">WEBSOCKET RAW TELEMETRY JSON PACKET</span>
            </div>
            <span className="font-mono-code text-slate-400">Format: ESP32 IoT Standard Schema</span>
          </div>

          <pre className="p-4 rounded-xl bg-[#030712] border border-cyan-500/20 text-xs font-mono-code text-cyan-300 overflow-x-auto max-h-72">
            {JSON.stringify(displayData, null, 2)}
          </pre>
        </div>

        {/* FreeRTOS & Peripheral Health (1 Col) */}
        <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20 space-y-3">
          <h4 className="font-tech text-xs font-bold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            ESP32 HARDWARE HEALTH METRICS
          </h4>

          <div className="space-y-2 text-xs font-mono-code">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Core Clock:</span>
              <span className="text-white">240 MHz Dual-Core</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Free Heap:</span>
              <span className="text-emerald-400">242,160 Bytes</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">RTOS Task:</span>
              <span className="text-cyan-300">BrakeControlTask (Prio 3)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Sonar Jitter:</span>
              <span className="text-emerald-400">± 0.02 m</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Brake Relay/Servo Latency:</span>
              <span className="text-cyan-300">&lt; 12 ms</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Wi-Fi Transmit Power:</span>
              <span className="text-white">19.5 dBm (802.11 b/g/n)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
