import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  FastForward, 
  Rewind, 
  AlertTriangle, 
  ShieldAlert, 
  RotateCcw, 
  Sparkles,
  CheckCircle,
  EyeOff
} from 'lucide-react';

interface DemoControlsProps {
  onStart: () => void;
  onStop: () => void;
  onAccelerate: () => void;
  onDecelerate: () => void;
  onCreateObstacle: (dist?: number) => void;
  onRemoveObstacle: () => void;
  onTriggerAutoBrake: () => void;
  onManualBrake: () => void;
  onReleaseBrake: () => void;
  onReset: () => void;
  onRunDemoFlow: () => void;
  isDemoFlowRunning: boolean;
  demoFlowStep: string;
}

export const DemoControls: React.FC<DemoControlsProps> = ({
  onStart,
  onStop,
  onAccelerate,
  onDecelerate,
  onCreateObstacle,
  onRemoveObstacle,
  onTriggerAutoBrake,
  onManualBrake,
  onReleaseBrake,
  onReset,
  onRunDemoFlow,
  isDemoFlowRunning,
  demoFlowStep,
}) => {
  const [selectedDistance, setSelectedDistance] = useState<number>(2.5);

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-purple-500/30 bg-[#0d1222]/85 shadow-[0_0_30px_rgba(168,85,247,0.12)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.3)]">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <h3 className="font-tech text-base font-bold text-purple-200 tracking-wide flex items-center gap-2">
              DIGITAL TWIN SIMULATION BENCH
              <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-500/30">
                ACTIVE
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive test rig for demonstrating ESP32 emergency braking logic without physical hardware
            </p>
          </div>
        </div>

        {/* 1-Click Presentation Demo Flow Button */}
        <button
          onClick={onRunDemoFlow}
          disabled={isDemoFlowRunning}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-tech font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
            isDemoFlowRunning
              ? 'bg-purple-800/50 text-purple-300 border border-purple-500 animate-pulse'
              : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 text-white shadow-lg hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{isDemoFlowRunning ? `DEMO RUNNING: ${demoFlowStep}` : 'RUN FULL AUTO-BRAKE DEMO FLOW'}</span>
        </button>
      </div>

      {/* Button Controls Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mt-4">
        {/* 1. START CAR */}
        <button
          onClick={onStart}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/30 text-emerald-300 font-tech text-xs font-semibold tracking-wider transition-all group active:scale-95 cursor-pointer"
        >
          <Play className="w-5 h-5 mb-1 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span>START CAR</span>
          <span className="text-[9px] font-mono-code text-slate-500">Motor ON</span>
        </button>

        {/* 2. STOP CAR */}
        <button
          onClick={onStop}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-rose-500/30 hover:border-rose-400 hover:bg-rose-950/30 text-rose-300 font-tech text-xs font-semibold tracking-wider transition-all group active:scale-95 cursor-pointer"
        >
          <Square className="w-5 h-5 mb-1 text-rose-400 group-hover:scale-110 transition-transform" />
          <span>STOP CAR</span>
          <span className="text-[9px] font-mono-code text-slate-500">Coast to 0</span>
        </button>

        {/* 3. ACCELERATE */}
        <button
          onClick={onAccelerate}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-950/30 text-cyan-300 font-tech text-xs font-semibold tracking-wider transition-all group active:scale-95 cursor-pointer"
        >
          <FastForward className="w-5 h-5 mb-1 text-cyan-400 group-hover:scale-110 transition-transform" />
          <span>ACCELERATE</span>
          <span className="text-[9px] font-mono-code text-slate-500">+10 km/h</span>
        </button>

        {/* 4. SLOW DOWN */}
        <button
          onClick={onDecelerate}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-sky-500/30 hover:border-sky-400 hover:bg-sky-950/30 text-sky-300 font-tech text-xs font-semibold tracking-wider transition-all group active:scale-95 cursor-pointer"
        >
          <Rewind className="w-5 h-5 mb-1 text-sky-400 group-hover:scale-110 transition-transform" />
          <span>SLOW DOWN</span>
          <span className="text-[9px] font-mono-code text-slate-500">-10 km/h</span>
        </button>

        {/* 5. CREATE OBSTACLE */}
        <button
          onClick={() => onCreateObstacle(selectedDistance)}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 hover:bg-amber-950/30 text-amber-300 font-tech text-xs font-semibold tracking-wider transition-all group active:scale-95 cursor-pointer"
        >
          <AlertTriangle className="w-5 h-5 mb-1 text-amber-400 group-hover:scale-110 transition-transform" />
          <span>OBSTACLE</span>
          <span className="text-[9px] font-mono-code text-slate-400">{selectedDistance.toFixed(1)}m ahead</span>
        </button>

        {/* 6. CLEAR OBSTACLE */}
        <button
          onClick={onRemoveObstacle}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900/90 border border-slate-700/60 hover:border-slate-500 hover:bg-slate-800/40 text-slate-300 font-tech text-xs font-semibold tracking-wider transition-all group active:scale-95 cursor-pointer"
        >
          <EyeOff className="w-5 h-5 mb-1 text-slate-400 group-hover:scale-110 transition-transform" />
          <span>CLEAR PATH</span>
          <span className="text-[9px] font-mono-code text-slate-500">Remove obj</span>
        </button>

        {/* 7. TRIGGER AUTOMATIC BRAKE */}
        <button
          onClick={onTriggerAutoBrake}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-red-950/60 border border-red-500/70 hover:border-red-400 hover:bg-red-900/40 text-red-200 font-tech text-xs font-semibold tracking-wider transition-all group active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.2)] cursor-pointer"
        >
          <ShieldAlert className="w-5 h-5 mb-1 text-red-400 group-hover:scale-110 transition-transform animate-pulse" />
          <span>AUTO BRAKE</span>
          <span className="text-[9px] font-mono-code text-red-300">ESP32 Cutoff</span>
        </button>

        {/* 8. MANUAL BRAKE / RELEASE */}
        <button
          onClick={onManualBrake}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-950/60 border border-blue-500/50 hover:border-blue-400 hover:bg-blue-900/30 text-blue-200 font-tech text-xs font-semibold tracking-wider transition-all group active:scale-95 cursor-pointer"
        >
          <ShieldAlert className="w-5 h-5 mb-1 text-blue-400 group-hover:scale-110 transition-transform" />
          <span>MANUAL BRAKE</span>
          <span className="text-[9px] font-mono-code text-blue-300">Driver Hold</span>
        </button>
      </div>

      {/* Sub controls: Quick distance presets & reset */}
      <div className="mt-3.5 pt-3 border-t border-purple-500/20 flex flex-wrap items-center justify-between gap-3 text-xs font-tech">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 uppercase tracking-wider text-[11px]">Set Obstacle Distance:</span>
          <div className="flex items-center gap-1.5">
            {[4.5, 3.2, 2.0, 0.8].map((dist) => (
              <button
                key={dist}
                onClick={() => {
                  setSelectedDistance(dist);
                  onCreateObstacle(dist);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono-code transition-colors cursor-pointer ${
                  selectedDistance === dist
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {dist}m {dist <= 1.0 ? '🚨' : dist <= 3.0 ? '⚠️' : '🟢'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReleaseBrake}
            className="px-3 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-900/40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Release Brake</span>
          </button>

          <button
            onClick={onReset}
            className="px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-600 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Rig</span>
          </button>
        </div>
      </div>
    </div>
  );
};
