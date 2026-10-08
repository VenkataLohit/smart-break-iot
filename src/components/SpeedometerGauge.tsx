import React from 'react';

interface SpeedometerGaugeProps {
  speed: number;
  maxSpeed?: number;
}

export const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({ speed, maxSpeed = 60 }) => {
  const clampedSpeed = Math.min(Math.max(speed, 0), maxSpeed);
  // Angle range: -120 deg to +120 deg (total 240 deg)
  const angle = -120 + (clampedSpeed / maxSpeed) * 240;

  // Arc path for gauge background
  const radius = 80;
  const strokeWidth = 10;
  const center = 100;

  return (
    <div className="relative flex flex-col items-center justify-center p-3">
      <svg className="w-44 h-36" viewBox="0 0 200 160">
        <defs>
          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="60%" stopColor="#3b82f6" />
            <stop offset="85%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer tick marks ring */}
        {[0, 10, 20, 30, 40, 50, 60].map((val) => {
          const tickAngle = -120 + (val / maxSpeed) * 240;
          const rad = ((tickAngle - 90) * Math.PI) / 180;
          const x1 = center + (radius + 2) * Math.cos(rad);
          const y1 = center + (radius + 2) * Math.sin(rad);
          const x2 = center + (radius - 6) * Math.cos(rad);
          const y2 = center + (radius - 6) * Math.sin(rad);
          return (
            <g key={val}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={val > 45 ? '#ef4444' : val > 30 ? '#38bdf8' : '#64748b'}
                strokeWidth={val % 20 === 0 ? 2 : 1}
              />
            </g>
          );
        })}

        {/* Background track arc (240 deg from -120 to +120) */}
        <path
          d="M 30.7 140 A 80 80 0 1 1 169.3 140"
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Dynamic active arc */}
        <path
          d="M 30.7 140 A 80 80 0 1 1 169.3 140"
          fill="none"
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray="335"
          strokeDashoffset={335 - (335 * (clampedSpeed / maxSpeed))}
          className="transition-all duration-300 ease-out"
          filter="url(#gaugeGlow)"
        />

        {/* Center pivot */}
        <circle cx={center} cy={center} r="7" fill="#0f172a" stroke="#06b6d4" strokeWidth="2.5" />

        {/* Needle */}
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${center}px ${center}px`,
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <line
            x1={center}
            y1={center}
            x2={center}
            y2={center - 68}
            stroke="#38bdf8"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx={center} cy={center - 68} r="2" fill="#ffffff" />
        </g>
      </svg>

      {/* Numeric readout */}
      <div className="absolute bottom-2 flex flex-col items-center">
        <div className="flex items-baseline gap-1">
          <span className="font-tech text-3xl font-bold tracking-wider text-cyan-300 tabular-nums">
            {Math.round(clampedSpeed)}
          </span>
          <span className="font-tech text-xs uppercase tracking-widest text-slate-400">km/h</span>
        </div>
      </div>
    </div>
  );
};
