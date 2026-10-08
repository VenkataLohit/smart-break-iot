import React from 'react';
import { TelemetryData } from '../types/telemetry';
import { 
  Cpu, 
  Radio, 
  Zap, 
  ShieldCheck, 
  Wifi, 
  Layers, 
  Sliders, 
  Battery, 
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface VehicleDetailsPageProps {
  telemetry: TelemetryData;
}

export const VehicleDetailsPage: React.FC<VehicleDetailsPageProps> = ({ telemetry }) => {
  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 pointer-events-none flex items-center justify-end pr-8">
          <Cpu className="w-80 h-80 text-cyan-400" />
        </div>

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/40 font-mono-code text-xs font-bold">
              COLLEGE CAPSTONE PROJECT
            </span>
            <span className="text-xs text-slate-400 font-mono-code">· Department of Electronics & Computer Engineering</span>
          </div>

          <h2 className="font-tech text-2xl sm:text-3xl font-bold text-white tracking-wide">
            Auto Brake Prototype — Model Mk-IV
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            An advanced IoT-integrated vehicular safety platform demonstrating predictive ultrasonic collision detection,
            autonomous emergency braking (AEB) actuation, and bidirectional digital twin synchronization via WebSocket telemetry.
          </p>
        </div>
      </div>

      {/* Main Specs Table Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Core System Specifications */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 pb-2 border-b border-slate-800">
            <Cpu className="w-5 h-5" />
            <h3 className="font-tech text-base font-bold uppercase tracking-wider text-white">
              CORE CONTROLLER
            </h3>
          </div>

          <div className="space-y-2.5 text-xs font-mono-code">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Microcontroller:</span>
              <span className="text-cyan-300 font-bold">ESP32 NodeMCU-32S</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Architecture:</span>
              <span className="text-white">Xtensa 32-bit Dual-Core LX6</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Clock Frequency:</span>
              <span className="text-white">240 MHz</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">SRAM / Flash:</span>
              <span className="text-white">520 KB / 4 MB SPI Flash</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Firmware RTOS:</span>
              <span className="text-emerald-400 font-bold">FreeRTOS v10.4</span>
            </div>
          </div>
        </div>

        {/* Card 2: Proximity Sensing & Sonar */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 pb-2 border-b border-slate-800">
            <Radio className="w-5 h-5" />
            <h3 className="font-tech text-base font-bold uppercase tracking-wider text-white">
              SENSORY SUBSYSTEM
            </h3>
          </div>

          <div className="space-y-2.5 text-xs font-mono-code">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Primary Sensor:</span>
              <span className="text-cyan-300 font-bold">HC-SR04 Ultrasonic</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Operating Frequency:</span>
              <span className="text-white">40 kHz Acoustic Pulse</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Effective Range:</span>
              <span className="text-emerald-400 font-bold">2 cm to 400 cm</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Measuring Angle:</span>
              <span className="text-white">15° Conical Field of View</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Speed Sensor:</span>
              <span className="text-white">LM393 Optical Disc Encoder</span>
            </div>
          </div>
        </div>

        {/* Card 3: Powertrain & Braking Actuation */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/20 space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 pb-2 border-b border-slate-800">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-tech text-base font-bold uppercase tracking-wider text-white">
              BRAKING & POWERTRAIN
            </h3>
          </div>

          <div className="space-y-2.5 text-xs font-mono-code">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Motor Driver:</span>
              <span className="text-cyan-300 font-bold">L298N Dual H-Bridge</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Drive Motors:</span>
              <span className="text-white">4x DC Geared (300 RPM @ 12V)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Auto Brake Logic:</span>
              <span className="text-red-400 font-bold">Dynamic Counter-EMF + Cutoff</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Physical Actuator:</span>
              <span className="text-white">SG90 / MG996R Brake Clamp</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Power Supply:</span>
              <span className="text-emerald-400">11.1V 3S 2200mAh LiPo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Pinout & Wiring Table */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400">
            <Layers className="w-5 h-5" />
            <h3 className="font-tech text-base font-bold uppercase tracking-wider text-white">
              ESP32 HARDWARE PINOUT & INTERFACE MAPPING
            </h3>
          </div>
          <span className="text-xs font-mono-code text-slate-400">Verified for ESP-WROOM-32</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-code">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-tech">
                <th className="py-2.5 px-3">ESP32 Pin</th>
                <th className="py-2.5 px-3">Target Component</th>
                <th className="py-2.5 px-3">Signal Type</th>
                <th className="py-2.5 px-3">Operating Function</th>
                <th className="py-2.5 px-3">Logic Voltage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-bold text-cyan-400">GPIO 5</td>
                <td className="py-2.5 px-3">HC-SR04 Trig</td>
                <td className="py-2.5 px-3 text-amber-300">Digital Output</td>
                <td className="py-2.5 px-3">10µs ultrasonic trigger pulse generator</td>
                <td className="py-2.5 px-3">3.3V</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-bold text-cyan-400">GPIO 18</td>
                <td className="py-2.5 px-3">HC-SR04 Echo</td>
                <td className="py-2.5 px-3 text-emerald-300">Digital Input</td>
                <td className="py-2.5 px-3">Pulse duration timer (via voltage divider)</td>
                <td className="py-2.5 px-3">3.3V (5V clamped)</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-bold text-cyan-400">GPIO 19</td>
                <td className="py-2.5 px-3">Optical Speed Encoder</td>
                <td className="py-2.5 px-3 text-emerald-300">Interrupt Input</td>
                <td className="py-2.5 px-3">Wheel slot count for velocity estimation</td>
                <td className="py-2.5 px-3">3.3V</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-bold text-cyan-400">GPIO 25</td>
                <td className="py-2.5 px-3">L298N IN1</td>
                <td className="py-2.5 px-3 text-amber-300">PWM Output</td>
                <td className="py-2.5 px-3">Forward rotation drive left side</td>
                <td className="py-2.5 px-3">3.3V</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-bold text-cyan-400">GPIO 26</td>
                <td className="py-2.5 px-3">L298N IN2</td>
                <td className="py-2.5 px-3 text-amber-300">PWM Output</td>
                <td className="py-2.5 px-3">Reverse / Electrical Brake clamping</td>
                <td className="py-2.5 px-3">3.3V</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-bold text-cyan-400">GPIO 27</td>
                <td className="py-2.5 px-3">L298N IN3 &amp; IN4</td>
                <td className="py-2.5 px-3 text-amber-300">PWM Output</td>
                <td className="py-2.5 px-3">Right side drive &amp; synchronized stop</td>
                <td className="py-2.5 px-3">3.3V</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-bold text-cyan-400">GPIO 2</td>
                <td className="py-2.5 px-3">Active Buzzer &amp; Brake LED</td>
                <td className="py-2.5 px-3 text-rose-300">Digital Output</td>
                <td className="py-2.5 px-3">Hardware acoustic alarm &amp; tail light alert</td>
                <td className="py-2.5 px-3">3.3V</td>
              </tr>
              <tr className="hover:bg-slate-900/40">
                <td className="py-2.5 px-3 font-bold text-cyan-400">GPIO 4</td>
                <td className="py-2.5 px-3">SG90 Servo Brake Clamp</td>
                <td className="py-2.5 px-3 text-amber-300">PWM (50 Hz)</td>
                <td className="py-2.5 px-3">Mechanical disc brake pad caliper actuation</td>
                <td className="py-2.5 px-3">3.3V (5V power)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
