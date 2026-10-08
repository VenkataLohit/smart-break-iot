import React from 'react';
import { DistanceZone } from '../types/telemetry';

interface DistanceBarProps {
  distance: number;
  dangerThreshold: number;
  warningThreshold: number;
  cautionThreshold: number;
  maxDistance?: number;
}

export const DistanceBar: React.FC<DistanceBarProps> = ({
  distance,
  dangerThreshold,
  warningThreshold,
  cautionThreshold,
  maxDistance = 6.0,
}) => {
  const clampedDistance = Math.min(Math.max(distance, 0), maxDistance);
  const percentage = Math.min(100, Math.max(0, (clampedDistance / maxDistance) * 100));

  let zone: DistanceZone = 'safe';
  let zoneColor = 'text-emerald-400';
  let barGradient = 'from-emerald-500 to-teal-400';
  let zoneLabel = '🟢 SAFE ZONE';

  if (clampedDistance <= dangerThreshold) {
    zone = 'danger';
    zoneColor = 'text-red-500';
    barGradient = 'from-red-600 to-rose-500';
    zoneLabel = '🔴 DANGER - COLLISION IMMINENT';
  } else if (clampedDistance <= warningThreshold) {
    zone = 'warning';
    zoneColor = 'text-amber-400';
    barGradient = 'from-amber-500 to-orange-500';
    zoneLabel = '🟠 WARNING - PROXIMITY ALERT';
  } else if (clampedDistance <= cautionThreshold) {
    zone = 'caution';
    zoneColor = 'text-yellow-300';
    barGradient = 'from-yellow-400 to-amber-400';
    zoneLabel = '🟡 CAUTION - OBJECT DETECTED';
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className={`font-tech font-semibold tracking-wider ${zoneColor}`}>
          {zoneLabel}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="font-tech text-2xl font-bold tracking-tight text-white tabular-nums">
            {clampedDistance.toFixed(2)}
          </span>
          <span className="font-tech text-xs text-slate-400">m</span>
        </div>
      </div>

      {/* Progress track with thresholds */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-700/50 p-0.5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-200 ease-out`}
          style={{ width: `${percentage}%` }}
        />

        {/* Marker lines for thresholds */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500/80 pointer-events-none"
          style={{ left: `${(dangerThreshold / maxDistance) * 100}%` }}
          title={`Danger: ${dangerThreshold}m`}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-400/80 pointer-events-none"
          style={{ left: `${(warningThreshold / maxDistance) * 100}%` }}
          title={`Warning: ${warningThreshold}m`}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-yellow-300/80 pointer-events-none"
          style={{ left: `${(cautionThreshold / maxDistance) * 100}%` }}
          title={`Caution: ${cautionThreshold}m`}
        />
      </div>

      {/* Threshold legend */}
      <div className="flex justify-between text-[10px] text-slate-500 font-mono-code pt-0.5">
        <span className="text-red-400">0m (Impact)</span>
        <span className="text-amber-400">{warningThreshold}m (Warn)</span>
        <span className="text-emerald-400">{cautionThreshold}m+ (Safe)</span>
        <span>{maxDistance}m</span>
      </div>
    </div>
  );
};
