import React, { useState } from 'react';
import { TripHistory } from '../types/telemetry';
import { 
  Clock, 
  Gauge, 
  ShieldAlert, 
  Route, 
  TrendingUp, 
  ChevronRight, 
  Calendar,
  CheckCircle2
} from 'lucide-react';

interface HistoryPageProps {
  trips: TripHistory[];
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ trips }) => {
  const [selectedTripId, setSelectedTripId] = useState<string>(trips[0]?.id || '');
  const activeTrip = trips.find((t) => t.id === selectedTripId) || trips[0];

  // Aggregate stats across all recorded sessions
  const totalAutoBrakes = trips.reduce((acc, t) => acc + t.autoBrakeCount, 0);
  const totalManualBrakes = trips.reduce((acc, t) => acc + t.manualBrakeCount, 0);
  const maxSpeedOverall = trips.reduce((acc, t) => Math.max(acc, t.maxSpeed), 0);
  const totalDistance = trips.reduce((acc, t) => acc + t.distanceMeters, 0);

  return (
    <div className="space-y-6">
      {/* Header Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-tech mb-1">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span className="uppercase tracking-wider">AUTO BRAKE EVENTS</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-tech text-3xl font-bold text-red-400 tabular-nums">
              {totalAutoBrakes}
            </span>
            <span className="text-xs text-slate-400 font-mono-code">triggers</span>
          </div>
          <p className="text-[11px] font-mono-code text-slate-500 mt-1">Collisions prevented</p>
        </div>

        {/* Stat 2 */}
        <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-tech mb-1">
            <ShieldAlert className="w-4 h-4 text-blue-400" />
            <span className="uppercase tracking-wider">MANUAL BRAKE EVENTS</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-tech text-3xl font-bold text-blue-400 tabular-nums">
              {totalManualBrakes}
            </span>
            <span className="text-xs text-slate-400 font-mono-code">inputs</span>
          </div>
          <p className="text-[11px] font-mono-code text-slate-500 mt-1">User overrides</p>
        </div>

        {/* Stat 3 */}
        <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-tech mb-1">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span className="uppercase tracking-wider">PEAK VELOCITY</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-tech text-3xl font-bold text-cyan-300 tabular-nums">
              {Math.round(maxSpeedOverall)}
            </span>
            <span className="text-xs text-slate-400 font-mono-code">km/h</span>
          </div>
          <p className="text-[11px] font-mono-code text-slate-500 mt-1">Top trial speed</p>
        </div>

        {/* Stat 4 */}
        <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-tech mb-1">
            <Route className="w-4 h-4 text-emerald-400" />
            <span className="uppercase tracking-wider">TOTAL ODOMETER</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="font-tech text-3xl font-bold text-emerald-400 tabular-nums">
              {(totalDistance / 1000).toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-mono-code">km</span>
          </div>
          <p className="text-[11px] font-mono-code text-slate-500 mt-1">{totalDistance.toFixed(0)} meters driven</p>
        </div>
      </div>

      {/* Main Grid: Trip Selection & Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Previous Trip List (1 Col) */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 space-y-3">
          <h3 className="font-tech text-sm font-bold text-white uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
            <span>RECORDED RUNS & TRIPS</span>
            <span className="text-xs font-mono-code text-cyan-400">{trips.length} Sessions</span>
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {trips.map((trip) => {
              const isSelected = trip.id === activeTrip?.id;
              return (
                <button
                  key={trip.id}
                  onClick={() => setSelectedTripId(trip.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-tech font-bold text-sm text-white">{trip.title}</span>
                    <span className="text-[10px] font-mono-code text-slate-400">{trip.timestamp}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[11px] font-mono-code text-slate-400 mt-2">
                    <div>
                      <span className="text-slate-500 block">Avg Spd</span>
                      <strong className="text-cyan-300">{trip.avgSpeed.toFixed(1)} km/h</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Auto Brake</span>
                      <strong className="text-red-400">{trip.autoBrakeCount}x</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Distance</span>
                      <strong className="text-slate-200">{trip.distanceMeters.toFixed(0)}m</strong>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Trip Detail & Interactive SVG Chart (2 Cols) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-6">
          {activeTrip ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="font-tech text-lg font-bold text-white tracking-wide">
                    {activeTrip.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono-code">
                    Duration: {Math.floor(activeTrip.durationSeconds / 60)}m {activeTrip.durationSeconds % 60}s · {activeTrip.timestamp}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono-code">
                  <span className="px-2.5 py-1 rounded-md bg-red-950/60 text-red-300 border border-red-500/40">
                    Auto-Brakes: {activeTrip.autoBrakeCount}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-blue-950/60 text-blue-300 border border-blue-500/40">
                    Manual Brakes: {activeTrip.manualBrakeCount}
                  </span>
                </div>
              </div>

              {/* Chart 1: Speed vs Time */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-tech">
                  <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" />
                    SPEED VS TIME TELEMETRY LOG
                  </span>
                  <span className="font-mono-code text-slate-400">Peak: {activeTrip.maxSpeed} km/h</span>
                </div>

                <div className="h-44 w-full bg-[#040812] rounded-xl border border-slate-800 p-2 relative overflow-hidden">
                  <div className="absolute inset-0 tech-grid-bg opacity-40 pointer-events-none" />

                  <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                    {/* Fill Area */}
                    <polygon
                      fill="rgba(6, 182, 212, 0.15)"
                      points={`0,120 ${activeTrip.points
                        .map((pt, i) => {
                          const x = (i / (activeTrip.points.length - 1)) * 500;
                          const y = 120 - (pt.speed / 60) * 110;
                          return `${x},${y}`;
                        })
                        .join(' ')} 500,120`}
                    />

                    {/* Speed Line */}
                    <polyline
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2.5"
                      points={activeTrip.points
                        .map((pt, i) => {
                          const x = (i / (activeTrip.points.length - 1)) * 500;
                          const y = 120 - (pt.speed / 60) * 110;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />

                    {/* Automatic Braking Incident Markers */}
                    {activeTrip.points.map((pt, i) => {
                      if (pt.autoBrake) {
                        const x = (i / (activeTrip.points.length - 1)) * 500;
                        const y = 120 - (pt.speed / 60) * 110;
                        return (
                          <g key={i}>
                            <circle cx={x} cy={y} r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                            <line x1={x} y1={y} x2={x} y2={120} stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" />
                          </g>
                        );
                      }
                      return null;
                    })}
                  </svg>
                </div>
              </div>

              {/* Chart 2: Ultrasonic Distance vs Time */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-tech">
                  <span className="text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    ULTRASONIC PROXIMITY PROFILE
                  </span>
                  <span className="font-mono-code text-slate-400">Min Distance (Impact Avoided)</span>
                </div>

                <div className="h-44 w-full bg-[#040812] rounded-xl border border-slate-800 p-2 relative overflow-hidden">
                  <div className="absolute inset-0 tech-grid-bg opacity-40 pointer-events-none" />

                  {/* Red Auto-Brake threshold floor */}
                  <div className="absolute left-0 right-0 top-[83%] border-t border-dashed border-red-500/60" />

                  <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      points={activeTrip.points
                        .map((pt, i) => {
                          const x = (i / (activeTrip.points.length - 1)) * 500;
                          const y = Math.min(115, Math.max(5, 120 - (pt.distance / 6.0) * 115));
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  </svg>
                </div>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-400 font-mono-code">
              Select a trip to inspect telemetry data
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
