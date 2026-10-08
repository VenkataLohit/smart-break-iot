import React, { useState } from 'react';
import { SystemSettings } from '../types/telemetry';
import { 
  Sliders, 
  ShieldAlert, 
  Volume2, 
  Cpu, 
  RotateCcw, 
  Save, 
  Check, 
  AlertTriangle,
  Rocket,
  Globe,
  ExternalLink
} from 'lucide-react';

interface SettingsPageProps {
  settings: SystemSettings;
  onSaveSettings: (newSettings: SystemSettings) => void;
  onOpenVercelModal?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onSaveSettings,
  onOpenVercelModal,
}) => {
  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetDefaults = () => {
    const defaults: SystemSettings = {
      danger_threshold: 1.0,
      warning_threshold: 3.0,
      caution_threshold: 5.0,
      max_speed: 60,
      demo_mode: settings.demo_mode,
      audio_alerts: true,
      auto_brake_enabled: true,
      esp32_endpoint: 'ws://192.168.4.1:81',
    };
    setFormData(defaults);
    onSaveSettings(defaults);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-tech text-xl font-bold text-white tracking-wide">
                AUTOMATIC BRAKING THRESHOLDS & SYSTEM PARAMETERS
              </h2>
              <p className="text-xs text-slate-400 font-mono-code">
                Configure ultrasonic safety trigger zones, speed governors, and ESP32 hardware bindings
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-tech border border-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pt-5">
          {/* Thresholds Group */}
          <div className="space-y-4">
            <h3 className="font-tech text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              PROXIMITY BRAKING TRIGGER THRESHOLDS (METERS)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Danger / Auto Brake Threshold */}
              <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2">
                <label className="block text-xs font-tech font-bold text-red-300 uppercase tracking-wide">
                  🔴 DANGER THRESHOLD (AUTO BRAKE)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0.2"
                    max="3.0"
                    value={formData.danger_threshold}
                    onChange={(e) => setFormData({ ...formData, danger_threshold: parseFloat(e.target.value) || 1.0 })}
                    className="w-full bg-slate-900 border border-red-500/50 rounded-lg px-3 py-2 text-white font-mono-code text-sm focus:outline-none focus:border-red-400"
                  />
                  <span className="text-xs font-mono-code text-slate-400">meters</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Activates immediate motor cut-off and physical brake caliper clamp when distance drops below this value.
                </p>
              </div>

              {/* Warning Threshold */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <label className="block text-xs font-tech font-bold text-amber-300 uppercase tracking-wide">
                  🟠 WARNING THRESHOLD (ADAS BUZZER)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={formData.warning_threshold}
                    onChange={(e) => setFormData({ ...formData, warning_threshold: parseFloat(e.target.value) || 3.0 })}
                    className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-2 text-white font-mono-code text-sm focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-xs font-mono-code text-slate-400">meters</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Triggers intermittent acoustic ADAS beeps and UI amber warning banner.
                </p>
              </div>

              {/* Caution Threshold */}
              <div className="p-4 rounded-xl bg-yellow-950/20 border border-yellow-500/30 space-y-2">
                <label className="block text-xs font-tech font-bold text-yellow-300 uppercase tracking-wide">
                  🟡 CAUTION THRESHOLD (RADAR DETECT)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="2.0"
                    max="6.0"
                    value={formData.caution_threshold}
                    onChange={(e) => setFormData({ ...formData, caution_threshold: parseFloat(e.target.value) || 5.0 })}
                    className="w-full bg-slate-900 border border-yellow-500/50 rounded-lg px-3 py-2 text-white font-mono-code text-sm focus:outline-none focus:border-yellow-400"
                  />
                  <span className="text-xs font-mono-code text-slate-400">meters</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Sonar locks onto front obstacle; display shows distance vector.
                </p>
              </div>
            </div>
          </div>

          {/* Powertrain & Audio Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <label className="block text-xs font-tech font-bold text-slate-300 uppercase tracking-wide">
                MAXIMUM VEHICLE SPEED GOVERNOR
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="20"
                  max="100"
                  value={formData.max_speed}
                  onChange={(e) => setFormData({ ...formData, max_speed: parseInt(e.target.value) || 60 })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-code text-sm focus:outline-none focus:border-cyan-400"
                />
                <span className="text-xs font-mono-code text-slate-400">km/h</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Speedometer scale upper bound and motor driver PWM ceiling limit.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <label className="block text-xs font-tech font-bold text-slate-300 uppercase tracking-wide">
                ESP32 WEBSOCKET ENDPOINT URL
              </label>
              <input
                type="text"
                value={formData.esp32_endpoint}
                onChange={(e) => setFormData({ ...formData, esp32_endpoint: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono-code text-sm focus:outline-none focus:border-cyan-400"
                placeholder="ws://192.168.4.1:81 or /ws"
              />
              <p className="text-[11px] text-slate-400">
                Direct WebSocket server URI running on the physical ESP32 or backend gateway.
              </p>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-tech text-xs font-bold text-white block">
                  SYNTHESIZED WEB AUDIO ADAS BUZZER
                </span>
                <span className="text-[11px] text-slate-400">
                  Emit audio alarms through speakers when distance drops into warning/danger zones.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.audio_alerts}
                onChange={(e) => setFormData({ ...formData, audio_alerts: e.target.checked })}
                className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
              <div>
                <span className="font-tech text-xs font-bold text-white block">
                  EMERGENCY AUTO-BRAKE SUBSYSTEM
                </span>
                <span className="text-[11px] text-slate-400">
                  Master kill-switch for automatic braking. When enabled, cuts motor on obstacle danger.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.auto_brake_enabled}
                onChange={(e) => setFormData({ ...formData, auto_brake_enabled: e.target.checked })}
                className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-tech font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
            >
              {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{saved ? 'Settings Saved & Applied!' : 'Save & Update System'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Vercel Cloud Deployment Card */}
      <div className="glass-panel rounded-2xl p-6 border border-white/20 bg-gradient-to-br from-black/80 via-slate-950/80 to-[#070e1c]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-black border border-white/30 flex items-center justify-center text-white shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 76 65">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-tech text-base font-bold text-white tracking-wide">
                  VERCEL PRODUCTION PUBLISHING
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-code font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Pre-configured
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono-code">
                Auto-optimized SPA build, vercel.json rewrites, and full Web Serial ESP32 hardware support on HTTPS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onOpenVercelModal && (
              <button
                type="button"
                onClick={onOpenVercelModal}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-slate-200 font-tech font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-white/20 active:scale-95 cursor-pointer"
              >
                <Rocket className="w-4 h-4" />
                <span>Open Vercel Deploy Wizard</span>
              </button>
            )}
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-tech text-xs border border-slate-700 cursor-pointer"
            >
              <span>vercel.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
