import React, { useEffect, useRef, useState } from 'react';
import { TelemetryData, SystemSettings } from '../types/telemetry';
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Power, 
  Activity, 
  Radio, 
  Zap,
  DoorOpen,
  DoorClosed,
  Eye,
  Layers,
  Sparkles,
  Flame,
  Gauge,
  Cpu,
  Car
} from 'lucide-react';

interface DigitalTwinCarSimulationProps {
  telemetry: TelemetryData;
  settings: SystemSettings;
  onToggleDoor?: () => void;
}

export const DigitalTwinCarSimulation: React.FC<DigitalTwinCarSimulationProps> = ({
  telemetry,
  settings,
  onToggleDoor,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Switchable Car Model Graphics: 'titan' (Hypercar) | 'prototype' (College ESP32 Robot Car) | 'interceptor' (Stealth EV)
  const [selectedModel, setSelectedModel] = useState<'titan' | 'prototype' | 'interceptor'>('titan');

  // Perspective view: 3D perspective or side telemetry
  const [viewMode, setViewMode] = useState<'3d' | 'side'>('3d');

  const {
    speed,
    distance,
    motor,
    brake,
    obstacle,
    car_status,
    brake_mode,
    door_open = false,
  } = telemetry;

  const isRunning = car_status === 'running' || (car_status === 'braking' && speed > 0);
  const isStarting = car_status === 'starting';
  const isBraking = brake || car_status === 'braking' || brake_mode === 'automatic';
  const isAutoBrake = brake_mode === 'automatic';
  const isStopped = car_status === 'stopped' || (car_status === 'off');

  // Wheel spin rate based on speed - carefully bounded to prevent 60 FPS stroboscopic reverse wagon-wheel effect
  const wheelSpinSpeed = speed > 0 ? Math.max(0.36, 1.8 - (speed / 60) * 1.1) : 0;

  // Obstacle positioning based on ultrasonic distance
  const clampedDist = Math.min(Math.max(distance, 0.35), 6.0);
  const obstacleXPercent = Math.min(92, Math.max(44, 38 + (clampedDist / 6.0) * 52));

  // Time-to-collision (TTC in seconds)
  const speedMs = (speed * 1000) / 3600;
  const ttc = speedMs > 0.5 ? (distance / speedMs).toFixed(1) : '∞';

  // State Banner info
  let stateTitle = 'CAR OFF (STANDBY)';
  let stateBadgeColor = 'bg-slate-950/95 text-slate-300 border-slate-700';
  let StateIcon = Power;
  let statusGlowClass = '';

  if (isAutoBrake && isBraking) {
    stateTitle = '🛑 ESP32 AUTOMATIC BRAKING ACTIVE — COLLISION AVERTED';
    stateBadgeColor = 'bg-red-950/95 text-red-200 border-red-500 animate-pulse-red';
    StateIcon = ShieldAlert;
    statusGlowClass = 'ring-2 ring-red-500 shadow-[0_0_80px_rgba(239,68,68,0.7)]';
  } else if (door_open) {
    stateTitle = 'DOOR AJAR (CABIN / HATCH OPEN)';
    stateBadgeColor = 'bg-amber-950/95 text-amber-200 border-amber-500 animate-pulse';
    StateIcon = DoorOpen;
    statusGlowClass = 'ring-1 ring-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.4)]';
  } else if (obstacle && distance <= settings.warning_threshold) {
    stateTitle = '⚠️ PROXIMITY HAZARD DETECTED — SENSING COLLISION';
    stateBadgeColor = 'bg-amber-950/95 text-amber-200 border-amber-500';
    StateIcon = AlertTriangle;
    statusGlowClass = 'ring-1 ring-amber-500/50 shadow-[0_0_35px_rgba(245,158,11,0.35)]';
  } else if (isStarting) {
    stateTitle = 'ESP32 MOTOR CONTROLLER BOOTING...';
    stateBadgeColor = 'bg-yellow-950/95 text-yellow-200 border-yellow-500';
    StateIcon = Zap;
  } else if (isRunning && speed > 0) {
    stateTitle = 'CRUISING — ACTIVE ULTRASONIC RADAR SCANNING';
    stateBadgeColor = 'bg-cyan-950/95 text-cyan-200 border-cyan-400';
    StateIcon = Activity;
    statusGlowClass = 'shadow-[0_0_35px_rgba(6,182,212,0.3)]';
  } else if (isStopped) {
    stateTitle = 'VEHICLE AT COMPLETE STANDSTILL (0 KM/H)';
    stateBadgeColor = 'bg-rose-950/95 text-rose-200 border-rose-600';
    StateIcon = Power;
  }

  // ================= 60 FPS HTML5 CANVAS VISUAL ENGINE =================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const getW = () => Math.max(canvas.parentElement?.clientWidth || window.innerWidth || 800, 320);
    const getH = () => Math.max(canvas.parentElement?.clientHeight || 420, 260);

    let width = (canvas.width = getW());
    let height = (canvas.height = getH());

    const onResize = () => {
      width = canvas.width = getW();
      height = canvas.height = getH();
    };
    window.addEventListener('resize', onResize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      color: string;
      life: number;
    }

    const roadStreaks: { x: number; y: number; length: number; speed: number; alpha: number }[] = [];
    const brakeSparks: Particle[] = [];
    let radarRadius = 0;
    let roadOffset = 0;

    // Initialize road speed streaks
    for (let i = 0; i < 45; i++) {
      roadStreaks.push({
        x: Math.random() * width,
        y: height * 0.65 + Math.random() * (height * 0.32),
        length: 25 + Math.random() * 45,
        speed: 5 + Math.random() * 9,
        alpha: 0.18 + Math.random() * 0.35,
      });
    }

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // 1. Ultra Dark OLED Sky & Horizon Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.65);
      skyGrad.addColorStop(0, '#000000');
      skyGrad.addColorStop(0.5, '#01040a');
      skyGrad.addColorStop(1, '#040916');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height * 0.65);

      // Distant Cyber Gantry Horizon Grid Lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      for (let y = height * 0.15; y < height * 0.65; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vertical perspective lines on horizon scrolling to left for parallax depth
      const horizonOffset = speed > 0 ? (roadOffset * 0.12) % 60 : 0;
      for (let x = -horizonOffset; x < width + 60; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, height * 0.45);
        ctx.lineTo(width * 0.5 + (x - width * 0.5) * 1.8, height * 0.65);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
        ctx.stroke();
      }

      // 2. Road Surface (Pitch Black Wet Asphalt with Specular Neon Reflections)
      const roadGrad = ctx.createLinearGradient(0, height * 0.65, 0, height);
      roadGrad.addColorStop(0, '#080e1a');
      roadGrad.addColorStop(0.2, '#04070f');
      roadGrad.addColorStop(1, '#010205');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(0, height * 0.65, width, height * 0.35);

      // Glowing Cyan Road Curb Line (Upper boundary)
      const curbGrad = ctx.createLinearGradient(0, 0, width, 0);
      curbGrad.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
      curbGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.95)');
      curbGrad.addColorStop(1, 'rgba(6, 182, 212, 0.4)');
      ctx.strokeStyle = curbGrad;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.65);
      ctx.lineTo(width, height * 0.65);
      ctx.stroke();

      // Road curb glow bloom
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 14;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.65);
      ctx.lineTo(width, height * 0.65);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Road curb dashed shoulder reflectors streaming backwards
      if (speed > 0) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([25, 45]);
        ctx.lineDashOffset = roadOffset * 1.1;
        ctx.beginPath();
        ctx.moveTo(0, height * 0.655);
        ctx.lineTo(width, height * 0.655);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 3. Moving Dash Center Markings (Positive offset moves dashes to the LEFT, indicating FORWARD drive)
      if (speed > 0) {
        roadOffset = (roadOffset + (speed * 18 + 80) * dt) % 150;
      }
      const roadMidY = height * 0.83;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.setLineDash([60, 90]);
      ctx.lineDashOffset = roadOffset;
      ctx.beginPath();
      ctx.moveTo(0, roadMidY);
      ctx.lineTo(width, roadMidY);
      ctx.stroke();
      ctx.setLineDash([]); // reset dash

      // Forward Drive Chevrons on Asphalt (>>> Forward direction arrows scrolling to the left)
      if (speed > 0) {
        const chevronSpacing = 320;
        const chevronOffset = (roadOffset * 2.2) % chevronSpacing;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.lineWidth = 2.5;
        for (let cx = width - chevronOffset; cx > -50; cx -= chevronSpacing) {
          ctx.beginPath();
          ctx.moveTo(cx - 14, roadMidY - 12);
          ctx.lineTo(cx, roadMidY);
          ctx.lineTo(cx - 14, roadMidY + 12);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(cx - 24, roadMidY - 12);
          ctx.lineTo(cx - 10, roadMidY);
          ctx.lineTo(cx - 24, roadMidY + 12);
          ctx.stroke();
        }
      }

      // 4. Volumetric Xenon Headlight Beam on Wet Road
      if (isRunning || isStarting || speed > 0) {
        const carFrontX = Math.min(290, width * 0.29);
        const carFrontY = height * 0.76;

        const beamGrad = ctx.createRadialGradient(
          carFrontX + 80, carFrontY, 10,
          carFrontX + 280, carFrontY + 20, 360
        );
        beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
        beamGrad.addColorStop(0.3, 'rgba(6, 182, 212, 0.25)');
        beamGrad.addColorStop(0.7, 'rgba(2, 132, 199, 0.08)');
        beamGrad.addColorStop(1, 'transparent');

        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(carFrontX, carFrontY - 12);
        ctx.lineTo(carFrontX + 500, carFrontY - 40);
        ctx.lineTo(carFrontX + 540, carFrontY + 75);
        ctx.lineTo(carFrontX, carFrontY + 16);
        ctx.closePath();
        ctx.fill();
      }

      // 5. Bright Crimson Taillight Ground Glare When Braking
      if (isBraking) {
        const carRearX = Math.min(60, width * 0.06);
        const carRearY = height * 0.76;

        const redGlare = ctx.createRadialGradient(carRearX - 20, carRearY, 5, carRearX - 60, carRearY, 150);
        redGlare.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
        redGlare.addColorStop(0.4, 'rgba(239, 68, 68, 0.4)');
        redGlare.addColorStop(1, 'transparent');
        ctx.fillStyle = redGlare;
        ctx.beginPath();
        ctx.arc(carRearX - 20, carRearY, 150, 0, Math.PI * 2);
        ctx.fill();

        // Spawn Brake Sparks when braking at speed
        if (speed > 5 && Math.random() < 0.65) {
          brakeSparks.push({
            x: carRearX + 60 + Math.random() * 120,
            y: carRearY + 16 + Math.random() * 10,
            vx: -(130 + Math.random() * 190),
            vy: -(25 + Math.random() * 65),
            size: 1.5 + Math.random() * 2.2,
            alpha: 1,
            color: Math.random() > 0.4 ? '#f59e0b' : '#ef4444',
            life: 0.45,
          });
        }
      }

      // 6. Draw Brake Sparks
      for (let i = brakeSparks.length - 1; i >= 0; i--) {
        const sp = brakeSparks[i];
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vy += 220 * dt; // gravity
        sp.life -= dt;
        sp.alpha = sp.life / 0.45;

        if (sp.life <= 0) {
          brakeSparks.splice(i, 1);
          continue;
        }

        ctx.fillStyle = sp.color;
        ctx.shadowColor = sp.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // 7. Speed Streaks on Asphalt
      if (speed > 0) {
        ctx.lineWidth = 1.5;
        for (const st of roadStreaks) {
          st.x -= (st.speed + speed * 6.5) * dt * 4;
          if (st.x < -st.length) {
            st.x = width + Math.random() * 80;
            st.y = height * 0.66 + Math.random() * (height * 0.3);
          }
          ctx.strokeStyle = `rgba(56, 189, 248, ${st.alpha * (speed / 60)})`;
          ctx.beginPath();
          ctx.moveTo(st.x, st.y);
          ctx.lineTo(st.x + st.length, st.y);
          ctx.stroke();
        }
      }

      // 8. Ultrasonic LiDAR Waves Pulsing on Road
      if (obstacle) {
        radarRadius = (radarRadius + 230 * dt) % 190;
        const frontBumperX = Math.min(280, width * 0.29);
        const frontBumperY = height * 0.76;

        ctx.strokeStyle = isBraking ? 'rgba(239, 68, 68, 0.7)' : 'rgba(6, 182, 212, 0.55)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(frontBumperX, frontBumperY, radarRadius, -Math.PI * 0.22, Math.PI * 0.22);
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', onResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [speed, isRunning, isStarting, isBraking, obstacle]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden carbon-bg border border-cyan-500/35 transition-all duration-300 shadow-[0_20px_60px_rgba(0,0,0,0.95)] ${statusGlowClass}`}>
      {/* Top Cyber Cockpit Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#010307]/98 border-b border-cyan-500/30 backdrop-blur-2xl">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main State Banner */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-tech font-bold uppercase tracking-wider shadow-lg ${stateBadgeColor}`}>
            <StateIcon className="w-4 h-4 animate-pulse" />
            <span>{stateTitle}</span>
          </div>

          {/* Drive Gear & Forward Heading Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-tech font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]">
            <span className={`w-2 h-2 rounded-full ${speed > 0 ? 'bg-emerald-400 animate-ping' : 'bg-emerald-600'}`} />
            <span>GEAR: <strong className="text-white font-mono-code">[ D ]</strong></span>
            <span className="text-[11px] font-mono-code text-emerald-200 tracking-wider hidden xs:inline">
              FORWARD {speed > 0 ? '▶▶▶' : '■'}
            </span>
          </div>

          {/* Door Status Alert Tag */}
          {door_open ? (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950 border border-amber-400 text-amber-300 text-xs font-tech font-bold animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <DoorOpen className="w-4 h-4 text-amber-400" />
              <span>
                {selectedModel === 'prototype' ? 'INSPECTION HOOD: OPEN' : 'SCISSOR DOOR: OPEN (AJAR)'}
              </span>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono-code text-emerald-400 bg-emerald-950/40 border border-emerald-500/30">
              <DoorClosed className="w-3.5 h-3.5" />
              <span>DOORS: FLUSH & LOCKED</span>
            </div>
          )}

          {/* Time to collision if moving toward obstacle */}
          {obstacle && speed > 5 && (
            <div className="hidden md:flex items-center gap-1 text-xs font-mono-code text-amber-300 px-2.5 py-1 rounded bg-amber-950/40 border border-amber-500/30">
              <span>EST. TTC:</span>
              <strong className="text-white">{ttc}s</strong>
            </div>
          )}
        </div>

        {/* Action Controls: Car Model Switcher & Door Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* CAR MODEL GRAPHICS SWITCHER (Titan GT vs ESP32 IoT Prototype vs Phantom EV) */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-cyan-500/30 text-xs font-tech">
            <button
              onClick={() => setSelectedModel('titan')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                selectedModel === 'titan' 
                  ? 'bg-cyan-600 text-white font-bold shadow-[0_0_12px_rgba(6,182,212,0.5)]' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Stealth Cyber Titan GT Hypercar"
            >
              <Car className="w-3.5 h-3.5" />
              <span>CYBER TITAN</span>
            </button>
            <button
              onClick={() => setSelectedModel('prototype')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                selectedModel === 'prototype' 
                  ? 'bg-emerald-600 text-white font-bold shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Real ESP32 Hardware Robot Chassis Prototype"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>ESP32 CHASSIS</span>
            </button>
            <button
              onClick={() => setSelectedModel('interceptor')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                selectedModel === 'interceptor' 
                  ? 'bg-purple-600 text-white font-bold shadow-[0_0_12px_rgba(168,85,247,0.5)]' 
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Stealth Autonomous EV Interceptor"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>PHANTOM EV</span>
            </button>
          </div>

          {/* Interactive Door Open / Close Button */}
          {onToggleDoor && (
            <button
              onClick={onToggleDoor}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-tech font-bold uppercase tracking-wider transition-all cursor-pointer ${
                door_open
                  ? 'bg-amber-600 text-white border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-cyan-400'
              }`}
              title="Click to Open or Close the Car Door / Inspection Hatch"
            >
              {door_open ? <DoorOpen className="w-4 h-4 text-white" /> : <DoorClosed className="w-4 h-4 text-cyan-400" />}
              <span>{door_open ? 'CLOSE DOOR' : 'OPEN DOOR'}</span>
            </button>
          )}

          {/* Perspective View Switch */}
          <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-tech">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === '3d' ? 'bg-cyan-700 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              3D
            </button>
            <button
              onClick={() => setViewMode('side')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                viewMode === 'side' ? 'bg-cyan-700 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              SIDE
            </button>
          </div>
        </div>
      </div>

      {/* Main Simulation Viewport (Canvas + Detailed Vector Vehicle Graphics) */}
      <div className="relative w-full h-[390px] sm:h-[450px] overflow-hidden select-none">
        {/* Layer 1: HTML5 60 FPS Visual Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />

        {/* Scanline CRT overlay filter */}
        <div className="absolute inset-0 scanlines opacity-35 pointer-events-none z-5" />

        {/* Emergency Braking Fullscreen Warning Strobe */}
        {isBraking && isAutoBrake && (
          <div className="absolute inset-0 bg-red-600/25 pointer-events-none z-10 animate-pulse" />
        )}

        {/* ========================================================================= */}
        {/* CAR CONTAINER: Positioned on the road with dynamic 3D perspective pitch   */}
        {/* ========================================================================= */}
        <div
          className={`absolute bottom-16 sm:bottom-20 left-4 sm:left-14 z-20 transition-all duration-300 ${
            viewMode === '3d' ? 'perspective-[1000px]' : ''
          }`}
          style={{
            transform: isBraking
              ? (viewMode === '3d' ? 'rotateY(10deg) rotate(2.5deg) translateY(4px)' : 'rotate(2deg) translateY(4px)')
              : (viewMode === '3d' ? 'rotateY(8deg) rotateX(2deg)' : 'none'),
          }}
        >
          {/* Underglow Neon Floor Aura */}
          <div
            className={`absolute -bottom-2 left-8 right-8 h-6 rounded-full blur-lg transition-all duration-300 ${
              isBraking
                ? 'bg-red-500/95 shadow-[0_0_40px_#ef4444]'
                : door_open
                ? 'bg-amber-400/85 shadow-[0_0_35px_#f59e0b]'
                : selectedModel === 'prototype'
                ? 'bg-emerald-400/85 shadow-[0_0_35px_#10b981]'
                : selectedModel === 'interceptor'
                ? 'bg-purple-500/85 shadow-[0_0_35px_#a855f7]'
                : isRunning
                ? 'bg-cyan-400/85 shadow-[0_0_35px_#06b6d4]'
                : 'bg-transparent'
            }`}
          />

          {/* Underbody Puddle Light when Door is Open */}
          {door_open && (
            <div
              className="absolute left-20 top-20 w-36 h-24 rounded-full pointer-events-none z-0 animate-pulse"
              style={{
                background: selectedModel === 'prototype'
                  ? 'radial-gradient(ellipse, rgba(16, 185, 129, 0.7) 0%, rgba(16, 185, 129, 0.15) 65%, transparent 100%)'
                  : 'radial-gradient(ellipse, rgba(6, 182, 212, 0.75) 0%, rgba(6, 182, 212, 0.18) 65%, transparent 100%)',
                filter: 'blur(8px)',
              }}
            />
          )}

          {/* ========================================================================= */}
          {/* VEHICLE GRAPHIC 1: CYBER TITAN GT (Stealth Hypercar with Scissor Door)   */}
          {/* ========================================================================= */}
          {selectedModel === 'titan' && (
            <div className="relative w-[240px] sm:w-[290px] h-[110px] sm:h-[132px]">
              <svg
                className="w-full h-full drop-shadow-[0_22px_40px_rgba(0,0,0,0.95)]"
                viewBox="0 0 290 132"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Paint Gradient: Deep Obsidian Stealth Carbon */}
                  <linearGradient id="titanBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="25%" stopColor="#0f172a" />
                    <stop offset="70%" stopColor="#050a14" />
                    <stop offset="100%" stopColor="#010307" />
                  </linearGradient>

                  {/* Windshield Glass Shader */}
                  <linearGradient id="titanGlassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#0284c7" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#082f49" stopOpacity="0.25" />
                  </linearGradient>

                  {/* Illuminated Cockpit Interior (Revealed when door opens!) */}
                  <linearGradient id="titanCockpitGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
                    <stop offset="50%" stopColor="#0284c7" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#081b33" stopOpacity="0.95" />
                  </linearGradient>

                  {/* Titanium Alloy Wheels */}
                  <linearGradient id="titanWheelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f1f5f9" />
                    <stop offset="45%" stopColor="#64748b" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>

                  <filter id="titanHeadlightFilter" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  <filter id="titanBrakeFilter" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* ACTIVE AERO REAR WING / AIRBRAKE (Pitches up 32° when braking!) */}
                <g
                  style={{
                    transformOrigin: '20px 58px',
                    transform: isBraking ? 'rotate(-32deg) translateY(-8px)' : 'none',
                    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <path
                    d="M 10 46 L 24 46 L 32 54 L 18 54 Z"
                    fill="#050a14"
                    stroke="#38bdf8"
                    strokeWidth="1.6"
                  />
                  <line x1="16" y1="54" x2="18" y2="68" stroke="#38bdf8" strokeWidth="2.5" />
                  {isBraking && (
                    <text x="8" y="42" fill="#ef4444" fontSize="5.5" fontFamily="monospace" fontWeight="bold">
                      AIRBRAKE ENGAGED
                    </text>
                  )}
                </g>

                {/* MAIN HYPERCAR BODY SHELL */}
                <path
                  d="M 18 76 C 18 66, 28 60, 44 60 L 58 60 C 64 46, 82 38, 104 38 L 176 38 C 206 38, 222 50, 238 62 L 264 68 C 274 70, 278 78, 278 86 L 278 90 C 278 96, 272 98, 262 98 L 238 98 C 234 84, 218 74, 198 74 C 178 74, 162 84, 158 98 L 102 98 C 98 84, 82 74, 64 74 C 46 74, 30 84, 26 98 L 18 98 C 16 98, 15 88, 18 76 Z"
                  fill="url(#titanBodyGrad)"
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                />

                {/* Aerodynamic Front Splitter & Carbon Side Skirts */}
                <rect x="22" y="96" width="224" height="3.5" rx="1.5" fill="#0284c7" />

                {/* COCKPIT INTERIOR REVEAL (WHEN SCISSOR DOOR IS OPEN!) */}
                <g className="cockpit-chamber">
                  <path
                    d="M 82 60 L 112 44 L 178 44 L 214 60 Z"
                    fill={door_open ? 'url(#titanCockpitGlow)' : 'url(#titanGlassGrad)'}
                    stroke="#0284c7"
                    strokeWidth="1.4"
                  />

                  {/* High-Detail Luxury Sports Interior Exposed When Door Opens */}
                  {door_open && (
                    <g className="animate-interior-glow">
                      {/* Carbon Racing Bucket Seat */}
                      <path
                        d="M 124 60 L 128 46 C 128 44, 134 44, 136 46 L 138 60 Z"
                        fill="#050a14"
                        stroke="#22d3ee"
                        strokeWidth="1.2"
                      />
                      {/* Harness Belts */}
                      <line x1="130" y1="48" x2="134" y2="58" stroke="#38bdf8" strokeWidth="1" />
                      {/* Steering Yoke */}
                      <circle cx="152" cy="52" r="5" fill="none" stroke="#22d3ee" strokeWidth="1.8" />
                      <line x1="147" y1="52" x2="157" y2="52" stroke="#ffffff" strokeWidth="1" />
                      {/* Glowing Digital Dashboard Telemetry Cluster */}
                      <rect x="158" y="47" width="10" height="6" rx="1.5" fill="#06b6d4" />
                      <line x1="160" y1="50" x2="166" y2="50" stroke="#ffffff" strokeWidth="1" />
                    </g>
                  )}
                </g>

                {/* Cockpit Center Pillar */}
                <line x1="148" y1="44" x2="148" y2="60" stroke="#050a14" strokeWidth="3" />

                {/* ================= ANIMATED GULLWING / SCISSOR CAR DOOR ================= */}
                {/* Lifts upward smoothly in 3D perspective revealing the glowing cabin! */}
                <g
                  style={{
                    transformOrigin: '104px 44px',
                    transform: door_open ? 'rotate(-44deg) translateY(-26px) scale(1.04)' : 'none',
                    transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    cursor: 'pointer',
                  }}
                  onClick={onToggleDoor}
                >
                  {/* Door Outer Carbon Shell */}
                  <path
                    d="M 102 44 L 152 44 L 164 60 L 164 82 L 98 82 L 98 60 Z"
                    fill="#0a1222"
                    stroke={door_open ? '#f59e0b' : '#38bdf8'}
                    strokeWidth={door_open ? '2.4' : '1.5'}
                  />

                  {/* Door Window Tint Glass */}
                  <path
                    d="M 106 46 L 148 46 L 156 58 L 102 58 Z"
                    fill="url(#titanGlassGrad)"
                    stroke="#0284c7"
                    strokeWidth="1"
                  />

                  {/* Hydraulic Strut Cylinder Piston (Visible when door is open!) */}
                  {door_open && (
                    <line x1="102" y1="80" x2="98" y2="64" stroke="#e2e8f0" strokeWidth="2.5" />
                  )}

                  {/* Aerodynamic Door Character Crease */}
                  <line x1="104" y1="68" x2="154" y2="68" stroke="#0284c7" strokeWidth="1" strokeDasharray="4 2" />

                  {/* Flush Door Handle */}
                  <rect x="108" y="72" width="16" height="3" rx="1" fill={door_open ? '#f59e0b' : '#38bdf8'} />
                  <text x="130" y="75" fill="#38bdf8" fontSize="5" fontFamily="monospace" fontWeight="bold">
                    TITAN
                  </text>
                </g>

                {/* Front HC-SR04 Ultrasonic Sonar Sensor Pod */}
                <rect x="273" y="76" width="8" height="15" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.4" />
                <circle cx="277" cy="80.5" r="2.5" fill="#e0f2fe" stroke="#0369a1" strokeWidth="0.8" />
                <circle cx="277" cy="87" r="2.5" fill="#e0f2fe" stroke="#0369a1" strokeWidth="0.8" />

                {/* Front Xenon Matrix LED Headlight Projector */}
                <polygon
                  points="264,70 276,74 276,78 258,76"
                  fill={isRunning || isStarting ? '#38bdf8' : '#334155'}
                  filter={isRunning || isStarting ? 'url(#titanHeadlightFilter)' : undefined}
                />

                {/* Full-Width Rear Crimson Laser Taillight Bar */}
                <polygon
                  points="16,70 24,70 21,80 15,80"
                  fill={isBraking ? '#ef4444' : '#7f1d1d'}
                  stroke={isBraking ? '#fca5a5' : '#991b1b'}
                  strokeWidth="1.4"
                  filter={isBraking ? 'url(#titanBrakeFilter)' : undefined}
                />
                <rect
                  x="82"
                  y="45"
                  width="11"
                  height="3"
                  rx="1"
                  fill={isBraking ? '#ef4444' : '#450a0a'}
                  filter={isBraking ? 'url(#titanBrakeFilter)' : undefined}
                />

                {/* REAR WHEEL & BRAKE */}
                <g transform="translate(64, 98)">
                  <circle cx="0" cy="0" r="19" fill="#010307" stroke="#1e293b" strokeWidth="3.5" />
                  <circle
                    cx="0" cy="0" r="13"
                    fill={isBraking ? '#7f1d1d' : '#334155'}
                    stroke={isBraking ? '#ef4444' : '#475569'}
                    strokeWidth="1.5"
                  />
                  <circle cx="0" cy="0" r="12" fill="url(#titanWheelGrad)" stroke="#64748b" strokeWidth="1.2" />

                  {/* Rotating Turbine Spokes */}
                  <g 
                    className="wheel-rotor"
                    style={{
                      animation: speed > 0 ? `wheelSpin ${wheelSpinSpeed}s linear infinite` : 'none',
                      transformOrigin: 'center',
                      transformBox: 'fill-box',
                    }}
                  >
                    <line x1="-10" y1="0" x2="10" y2="0" stroke="#06b6d4" strokeWidth="2.2" />
                    <line x1="0" y1="-10" x2="0" y2="10" stroke="#06b6d4" strokeWidth="2.2" />
                    <line x1="-8" y1="-8" x2="8" y2="8" stroke="#f1f5f9" strokeWidth="1.6" />
                    <line x1="-8" y1="8" x2="8" y2="-8" stroke="#f1f5f9" strokeWidth="1.6" />
                    {/* Forward rotation tracking marker - prevents optical reverse wagon-wheel effect */}
                    <circle cx="8" cy="0" r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
                  </g>

                  {/* Brake Caliper Clamp */}
                  <path
                    d="M -7 -12 A 14 14 0 0 1 7 -12"
                    stroke={isBraking ? '#ef4444' : '#38bdf8'}
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle cx="0" cy="0" r="4.5" fill="#080e18" stroke="#38bdf8" strokeWidth="1.4" />
                </g>

                {/* FRONT WHEEL & BRAKE */}
                <g transform="translate(198, 98)">
                  <circle cx="0" cy="0" r="19" fill="#010307" stroke="#1e293b" strokeWidth="3.5" />
                  <circle
                    cx="0" cy="0" r="13"
                    fill={isBraking ? '#7f1d1d' : '#334155'}
                    stroke={isBraking ? '#ef4444' : '#475569'}
                    strokeWidth="1.5"
                  />
                  <circle cx="0" cy="0" r="12" fill="url(#titanWheelGrad)" stroke="#64748b" strokeWidth="1.2" />

                  <g 
                    className="wheel-rotor"
                    style={{
                      animation: speed > 0 ? `wheelSpin ${wheelSpinSpeed}s linear infinite` : 'none',
                      transformOrigin: 'center',
                      transformBox: 'fill-box',
                    }}
                  >
                    <line x1="-10" y1="0" x2="10" y2="0" stroke="#06b6d4" strokeWidth="2.2" />
                    <line x1="0" y1="-10" x2="0" y2="10" stroke="#06b6d4" strokeWidth="2.2" />
                    <line x1="-8" y1="-8" x2="8" y2="8" stroke="#f1f5f9" strokeWidth="1.6" />
                    <line x1="-8" y1="8" x2="8" y2="-8" stroke="#f1f5f9" strokeWidth="1.6" />
                    {/* Forward rotation tracking marker - prevents optical reverse wagon-wheel effect */}
                    <circle cx="8" cy="0" r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
                  </g>

                  <path
                    d="M -7 -12 A 14 14 0 0 1 7 -12"
                    stroke={isBraking ? '#ef4444' : '#38bdf8'}
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle cx="0" cy="0" r="4.5" fill="#080e18" stroke="#38bdf8" strokeWidth="1.4" />
                </g>
              </svg>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VEHICLE GRAPHIC 2: ESP32-C3 SMART ROBOT CAR (College IoT Physical Twin)   */}
          {/* ========================================================================= */}
          {selectedModel === 'prototype' && (
            <div className="relative w-[240px] sm:w-[290px] h-[110px] sm:h-[132px]">
              <svg
                className="w-full h-full drop-shadow-[0_22px_40px_rgba(0,0,0,0.95)]"
                viewBox="0 0 290 132"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Acrylic Chassis Plate Tint */}
                  <linearGradient id="acrylicPlate" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#0f1f33" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#050a14" stopOpacity="0.95" />
                  </linearGradient>

                  {/* L298N Red Motor Driver Heatsink */}
                  <linearGradient id="l298nRed" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#991b1b" />
                  </linearGradient>

                  {/* Yellow DC Geared Motors */}
                  <linearGradient id="yellowMotor" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#ca8a04" />
                  </linearGradient>
                </defs>

                {/* BOTTOM ACRYLIC CHASSIS DECK */}
                <rect x="25" y="80" width="235" height="7" rx="3" fill="url(#acrylicPlate)" stroke="#10b981" strokeWidth="1.5" />

                {/* BRASS STANDOFF PILLARS */}
                <rect x="45" y="55" width="4" height="25" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
                <rect x="135" y="55" width="4" height="25" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
                <rect x="225" y="55" width="4" height="25" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />

                {/* TOP ACRYLIC CHASSIS DECK */}
                <rect x="35" y="52" width="215" height="6" rx="2.5" fill="url(#acrylicPlate)" stroke="#10b981" strokeWidth="1.5" />

                {/* YELLOW TT DC GEARED MOTORS (Mounted underneath) */}
                <rect x="42" y="84" width="38" height="14" rx="2" fill="url(#yellowMotor)" stroke="#854d0e" strokeWidth="1" />
                <rect x="182" y="84" width="38" height="14" rx="2" fill="url(#yellowMotor)" stroke="#854d0e" strokeWidth="1" />

                {/* 18650 LI-ION DUAL CELL BATTERY PACK */}
                <rect x="55" y="60" width="46" height="18" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="1.2" />
                <rect x="58" y="63" width="18" height="12" rx="2" fill="#0284c7" />
                <rect x="80" y="63" width="18" height="12" rx="2" fill="#0284c7" />
                <text x="60" y="72" fill="#ffffff" fontSize="4.5" fontFamily="monospace" fontWeight="bold">
                  18650 7.4V
                </text>

                {/* L298N DUAL H-BRIDGE MOTOR DRIVER MODULE */}
                <rect x="110" y="58" width="38" height="20" rx="2" fill="url(#l298nRed)" stroke="#f87171" strokeWidth="1" />
                {/* Black Heatsink Fins */}
                <rect x="115" y="60" width="14" height="10" rx="1" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
                <line x1="118" y1="60" x2="118" y2="70" stroke="#94a3b8" strokeWidth="1" />
                <line x1="122" y1="60" x2="122" y2="70" stroke="#94a3b8" strokeWidth="1" />
                <line x1="126" y1="60" x2="126" y2="70" stroke="#94a3b8" strokeWidth="1" />
                <text x="113" y="76" fill="#fef08a" fontSize="4" fontFamily="monospace" fontWeight="bold">
                  L298N DRIVER
                </text>

                {/* ESP32-C3 DEVELOPMENT BOARD (Mounted on upper deck) */}
                <rect x="160" y="34" width="55" height="19" rx="2.5" fill="#064e3b" stroke="#34d399" strokeWidth="1.2" />
                {/* Metallic RF Shield */}
                <rect x="168" y="37" width="22" height="13" rx="1.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="0.8" />
                <text x="170" y="45" fill="#0f172a" fontSize="4" fontFamily="monospace" fontWeight="bold">
                  ESP32-C
                </text>
                {/* Copper Trace Antenna on PCB */}
                <path d="M 162 38 L 166 38 L 166 42 L 162 42 L 162 46 L 166 46" stroke="#f59e0b" strokeWidth="1" fill="none" />
                {/* Blinking LEDs on ESP32 */}
                <circle cx="196" cy="40" r="1.5" fill="#ef4444" /> {/* Power LED */}
                <circle cx="196" cy="46" r="1.5" fill="#38bdf8" className="animate-ping" /> {/* Wi-Fi Activity */}
                <text x="194" y="51" fill="#a7f3d0" fontSize="3.5" fontFamily="monospace">
                  Wi-Fi
                </text>

                {/* FRONT HC-SR04 ULTRASONIC SENSOR (Mounted on front bumper) */}
                <rect x="250" y="65" width="16" height="24" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
                {/* Transmitter Transducer with chrome mesh */}
                <circle cx="258" cy="71" r="5" fill="#e2e8f0" stroke="#0369a1" strokeWidth="1" />
                <circle cx="258" cy="71" r="2.5" fill="#0284c7" />
                {/* Receiver Transducer */}
                <circle cx="258" cy="83" r="5" fill="#e2e8f0" stroke="#0369a1" strokeWidth="1" />
                <circle cx="258" cy="83" r="2.5" fill="#0284c7" />

                {/* Pulsing Sonar Beam Rings From HC-SR04 */}
                {obstacle && (
                  <g className="animate-pulse">
                    <path d="M 266 68 A 12 12 0 0 1 266 86" stroke="#06b6d4" strokeWidth="1.5" fill="none" />
                    <path d="M 272 65 A 18 18 0 0 1 272 89" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
                  </g>
                )}

                {/* ================= ANIMATED INSPECTION HATCH / CHASSIS WING DOOR ================= */}
                {/* Opens upward smoothly at 45° revealing internal circuitry and wires */}
                <g
                  style={{
                    transformOrigin: '40px 52px',
                    transform: door_open ? 'rotate(-42deg) translateY(-18px) scale(1.03)' : 'none',
                    transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    cursor: 'pointer',
                  }}
                  onClick={onToggleDoor}
                >
                  {/* Acrylic Clear Top Hood Panel */}
                  <path
                    d="M 38 52 L 150 40 L 230 40 L 238 52 Z"
                    fill="url(#acrylicPlate)"
                    stroke={door_open ? '#f59e0b' : '#10b981'}
                    strokeWidth={door_open ? '2.4' : '1.5'}
                  />
                  {/* Hydraulic Prop Rod (Visible when open!) */}
                  {door_open && (
                    <line x1="55" y1="52" x2="70" y2="35" stroke="#facc15" strokeWidth="2" />
                  )}
                  {/* Hatch Handle / Tag */}
                  <rect x="120" y="42" width="25" height="4" rx="1.5" fill={door_open ? '#f59e0b' : '#10b981'} />
                  <text x="123" y="45.5" fill="#ffffff" fontSize="3.5" fontFamily="monospace" fontWeight="bold">
                    INSPECTION
                  </text>
                </g>

                {/* ROBOT WHEEL 1 (REAR) - Heavy Rubber Tread Tires */}
                <g transform="translate(60, 98)">
                  <circle cx="0" cy="0" r="19" fill="#0f172a" stroke="#334155" strokeWidth="3" />
                  <circle cx="0" cy="0" r="14" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="6" fill="#0f172a" />
                  <g 
                    className="wheel-rotor"
                    style={{
                      animation: speed > 0 ? `wheelSpin ${wheelSpinSpeed}s linear infinite` : 'none',
                      transformOrigin: 'center',
                      transformBox: 'fill-box',
                    }}
                  >
                    <line x1="-12" y1="0" x2="12" y2="0" stroke="#000000" strokeWidth="2.5" />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#000000" strokeWidth="2.5" />
                    {/* Forward rotation tracking marker */}
                    <circle cx="10" cy="0" r="2.2" fill="#10b981" stroke="#ffffff" strokeWidth="0.8" />
                  </g>
                  {/* Brake Clamp / Red LED indicator */}
                  {isBraking && (
                    <circle cx="0" cy="0" r="16" fill="none" stroke="#ef4444" strokeWidth="2.5" className="animate-ping" />
                  )}
                </g>

                {/* ROBOT WHEEL 2 (FRONT) */}
                <g transform="translate(200, 98)">
                  <circle cx="0" cy="0" r="19" fill="#0f172a" stroke="#334155" strokeWidth="3" />
                  <circle cx="0" cy="0" r="14" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="6" fill="#0f172a" />
                  <g 
                    className="wheel-rotor"
                    style={{
                      animation: speed > 0 ? `wheelSpin ${wheelSpinSpeed}s linear infinite` : 'none',
                      transformOrigin: 'center',
                      transformBox: 'fill-box',
                    }}
                  >
                    <line x1="-12" y1="0" x2="12" y2="0" stroke="#000000" strokeWidth="2.5" />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#000000" strokeWidth="2.5" />
                    {/* Forward rotation tracking marker */}
                    <circle cx="10" cy="0" r="2.2" fill="#10b981" stroke="#ffffff" strokeWidth="0.8" />
                  </g>
                  {isBraking && (
                    <circle cx="0" cy="0" r="16" fill="none" stroke="#ef4444" strokeWidth="2.5" className="animate-ping" />
                  )}
                </g>
              </svg>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VEHICLE GRAPHIC 3: PHANTOM EV INTERCEPTOR (Autonomous Cruiser)           */}
          {/* ========================================================================= */}
          {selectedModel === 'interceptor' && (
            <div className="relative w-[240px] sm:w-[290px] h-[110px] sm:h-[132px]">
              <svg
                className="w-full h-full drop-shadow-[0_22px_40px_rgba(0,0,0,0.95)]"
                viewBox="0 0 290 132"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Paint Gradient: Deep Midnight Violet Obsidian */}
                  <linearGradient id="interceptorBody" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b0764" />
                    <stop offset="35%" stopColor="#1e1b4b" />
                    <stop offset="75%" stopColor="#090a16" />
                    <stop offset="100%" stopColor="#020308" />
                  </linearGradient>

                  <linearGradient id="interceptorGlass" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="#7e22ce" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.3" />
                  </linearGradient>
                </defs>

                {/* ROOF SPINNING LIDAR SCANNER PUCK */}
                <g transform="translate(145, 34)">
                  <rect x="-8" y="0" width="16" height="7" rx="2" fill="#0f172a" stroke="#a855f7" strokeWidth="1.2" />
                  <circle cx="0" cy="3.5" r="2.5" fill="#c084fc" className="animate-ping" />
                  {/* Roof Strobe Light Bars */}
                  {isBraking && (
                    <rect x="-18" y="4" width="36" height="3" rx="1" fill="#ef4444" className="animate-pulse" />
                  )}
                </g>

                {/* MAIN BODY HULL */}
                <path
                  d="M 20 74 C 20 62, 32 58, 48 58 L 65 58 C 72 44, 90 38, 115 38 L 180 38 C 210 38, 226 48, 242 60 L 268 66 C 276 68, 280 76, 280 84 L 280 90 C 280 96, 274 98, 264 98 L 240 98 C 236 84, 218 74, 198 74 C 178 74, 162 84, 158 98 L 102 98 C 98 84, 82 74, 64 74 C 46 74, 30 84, 26 98 L 20 98 Z"
                  fill="url(#interceptorBody)"
                  stroke="#a855f7"
                  strokeWidth="1.8"
                />

                {/* Aerodynamic Skirt */}
                <rect x="25" y="96" width="220" height="3.5" rx="1.5" fill="#7e22ce" />

                {/* COCKPIT CABIN */}
                <path
                  d="M 90 58 L 120 42 L 180 42 L 216 58 Z"
                  fill={door_open ? '#581c87' : 'url(#interceptorGlass)'}
                  stroke="#a855f7"
                  strokeWidth="1.4"
                />

                {/* BUTTERFLY WING DOOR (SWINGS & LIFTS UPWARD!) */}
                <g
                  style={{
                    transformOrigin: '110px 42px',
                    transform: door_open ? 'rotate(-40deg) translateY(-22px) scale(1.03)' : 'none',
                    transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    cursor: 'pointer',
                  }}
                  onClick={onToggleDoor}
                >
                  <path
                    d="M 108 42 L 155 42 L 165 58 L 165 82 L 104 82 L 104 58 Z"
                    fill="#1e1b4b"
                    stroke={door_open ? '#f59e0b' : '#c084fc'}
                    strokeWidth={door_open ? '2.4' : '1.5'}
                  />
                  <path
                    d="M 112 44 L 150 44 L 158 56 L 108 56 Z"
                    fill="url(#interceptorGlass)"
                  />
                  <rect x="114" y="70" width="16" height="3" rx="1" fill="#c084fc" />
                  <text x="133" y="73.5" fill="#c084fc" fontSize="4.5" fontFamily="monospace" fontWeight="bold">
                    EV-AEB
                  </text>
                </g>

                {/* FRONT HC-SR04 SENSOR & LASER HEADLIGHTS */}
                <rect x="274" y="74" width="7" height="15" rx="2" fill="#581c87" stroke="#a855f7" strokeWidth="1.2" />
                <polygon
                  points="266,68 277,72 277,76 260,74"
                  fill={isRunning || isStarting ? '#c084fc' : '#475569'}
                />

                {/* REAR LIGHT BAR */}
                <polygon
                  points="18,68 25,68 22,78 17,78"
                  fill={isBraking ? '#ef4444' : '#7f1d1d'}
                  stroke={isBraking ? '#fca5a5' : '#991b1b'}
                  strokeWidth="1.2"
                />

                {/* REAR WHEEL */}
                <g transform="translate(64, 98)">
                  <circle cx="0" cy="0" r="19" fill="#030712" stroke="#1f2937" strokeWidth="3" />
                  <circle cx="0" cy="0" r="13" fill="#1e1b4b" stroke="#7e22ce" strokeWidth="1.5" />
                  <g 
                    className="wheel-rotor"
                    style={{
                      animation: speed > 0 ? `wheelSpin ${wheelSpinSpeed}s linear infinite` : 'none',
                      transformOrigin: 'center',
                      transformBox: 'fill-box',
                    }}
                  >
                    <line x1="-10" y1="0" x2="10" y2="0" stroke="#c084fc" strokeWidth="2" />
                    <line x1="0" y1="-10" x2="0" y2="10" stroke="#c084fc" strokeWidth="2" />
                    {/* Forward rotation tracking marker */}
                    <circle cx="8" cy="0" r="2" fill="#c084fc" stroke="#ffffff" strokeWidth="0.8" />
                  </g>
                </g>

                {/* FRONT WHEEL */}
                <g transform="translate(198, 98)">
                  <circle cx="0" cy="0" r="19" fill="#030712" stroke="#1f2937" strokeWidth="3" />
                  <circle cx="0" cy="0" r="13" fill="#1e1b4b" stroke="#7e22ce" strokeWidth="1.5" />
                  <g 
                    className="wheel-rotor"
                    style={{
                      animation: speed > 0 ? `wheelSpin ${wheelSpinSpeed}s linear infinite` : 'none',
                      transformOrigin: 'center',
                      transformBox: 'fill-box',
                    }}
                  >
                    <line x1="-10" y1="0" x2="10" y2="0" stroke="#c084fc" strokeWidth="2" />
                    <line x1="0" y1="-10" x2="0" y2="10" stroke="#c084fc" strokeWidth="2" />
                    {/* Forward rotation tracking marker */}
                    <circle cx="8" cy="0" r="2" fill="#c084fc" stroke="#ffffff" strokeWidth="0.8" />
                  </g>
                </g>
              </svg>
            </div>
          )}

          {/* Floating Holographic Door Alert Tag */}
          {door_open && (
            <div className="absolute -top-12 left-20 px-3 py-1 rounded-full bg-amber-950/98 border border-amber-400 text-amber-200 text-[11px] font-tech font-bold uppercase tracking-wider shadow-2xl flex items-center gap-1.5 animate-bounce">
              <DoorOpen className="w-4 h-4 text-amber-400" />
              <span>
                {selectedModel === 'prototype' ? 'INSPECTION HOOD OPEN' : 'CAR DOOR OPEN (AJAR)'}
              </span>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3D HAZARD ATTENUATOR CRASH BARRIER (FRONT OBSTACLE DETECTED BY ESP32)     */}
        {/* ========================================================================= */}
        {obstacle && (
          <div
            className="absolute bottom-14 sm:bottom-16 z-20 transition-all duration-300"
            style={{
              left: `${obstacleXPercent}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {/* Red Warning Shadow on Asphalt */}
            <div
              className={`absolute -bottom-2 -left-8 -right-8 h-5 rounded-full blur-lg ${
                distance <= settings.danger_threshold ? 'bg-red-500/90' : 'bg-amber-500/70'
              }`}
            />

            <div className="relative flex flex-col items-center">
              {/* Strobing Emergency Warning Beacon */}
              <div
                className={`w-6 h-6 rounded-full border-2 mb-1 flex items-center justify-center animate-pulse ${
                  distance <= settings.danger_threshold
                    ? 'bg-red-600 border-red-200 shadow-[0_0_25px_#ef4444]'
                    : 'bg-amber-500 border-yellow-200 shadow-[0_0_20px_#f59e0b]'
                }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-white shadow" />
              </div>

              {/* Industrial Concrete & Steel Crash Absorber Barrier */}
              <div className="w-18 sm:w-22 h-26 sm:h-32 rounded-t-xl bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border-2 border-amber-400 shadow-2xl relative overflow-hidden flex flex-col justify-between p-1.5">
                {/* Yellow & Black Chevron Stripes */}
                <div
                  className="w-full h-10 rounded-md opacity-95 shadow-inner"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 12px, #0a0e17 12px, #0a0e17 24px)',
                  }}
                />

                <div className="flex flex-col items-center justify-center py-1">
                  <AlertTriangle className="w-7 h-7 text-amber-400 animate-pulse" />
                  <span className="text-[10px] font-tech font-bold text-amber-300 uppercase tracking-tight">
                    HAZARD
                  </span>
                </div>

                <div
                  className="w-full h-6 rounded-md opacity-95"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 8px, #050811 8px, #050811 16px)',
                  }}
                />
              </div>

              <div className="w-26 h-3 bg-slate-900 border-t border-slate-600 rounded-full shadow" />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TARGET ACQUISITION RETICLE & DISTANCE LASER LINE                          */}
        {/* ========================================================================= */}
        {obstacle && (
          <div
            className="absolute bottom-28 sm:bottom-32 z-25 pointer-events-none"
            style={{
              left: 'clamp(230px, 30vw, 320px)',
              width: `${Math.max(30, (obstacleXPercent - 34))}%`,
              height: '50px',
            }}
          >
            <div className="relative w-full h-full flex items-center">
              {/* Laser Beam with Glow */}
              <div
                className={`w-full h-1 relative transition-colors duration-200 ${
                  distance <= settings.danger_threshold
                    ? 'bg-red-500 shadow-[0_0_15px_#ef4444]'
                    : distance <= settings.warning_threshold
                    ? 'bg-amber-400 shadow-[0_0_15px_#f59e0b]'
                    : 'bg-cyan-400 shadow-[0_0_15px_#06b6d4]'
                }`}
              >
                {/* Center Floating HUD Badge */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 -top-8 px-3.5 py-1.5 rounded-full font-tech font-bold text-xs tracking-wider border shadow-2xl flex items-center gap-2 whitespace-nowrap backdrop-blur-2xl ${
                    distance <= settings.danger_threshold
                      ? 'bg-red-950/98 text-red-100 border-red-500 animate-bounce'
                      : distance <= settings.warning_threshold
                      ? 'bg-amber-950/98 text-amber-100 border-amber-500'
                      : 'bg-cyan-950/98 text-cyan-100 border-cyan-400'
                  }`}
                >
                  <Radio className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>SONAR DISTANCE: <strong className="text-white text-sm">{distance.toFixed(2)}m</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ambient Dark Cockpit Telemetry Strip at Bottom */}
        <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-[11px] font-mono-code text-slate-400 z-10 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>MODEL: <strong className="text-cyan-300 font-bold uppercase">{selectedModel}</strong></span>
            <span className="text-emerald-400 font-bold hidden sm:inline">· DIRECTION: FORWARD DRIVE (0° HEADING) ▶▶▶</span>
          </div>

          <div className="flex items-center gap-3">
            <span>DOOR LATCH: <strong className={door_open ? 'text-amber-400 font-bold' : 'text-emerald-400'}>{door_open ? 'DOOR AJAR (OPEN)' : 'LOCKED'}</strong></span>
            <span>·</span>
            <span>HC-SR04 ECHO: <strong className="text-white">{obstacle ? `${(distance * 5.8).toFixed(1)} ms` : 'CLEAR'}</strong></span>
            <span>·</span>
            <span>BRAKE: <strong className={isBraking ? 'text-red-400 font-bold' : 'text-slate-400'}>{isBraking ? 'AUTOMATIC ACTIVE' : 'RELEASED'}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
