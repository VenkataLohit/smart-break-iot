import React, { useState } from 'react';
import { 
  Car, 
  Activity, 
  AlertTriangle, 
  Clock, 
  Sliders, 
  Cpu, 
  Radio, 
  Wifi, 
  WifiOff, 
  Menu, 
  X,
  Volume2,
  VolumeX,
  Info,
  Moon
} from 'lucide-react';

export type NavTab = 'dashboard' | 'monitoring' | 'vehicle' | 'alerts' | 'history' | 'settings' | 'firmware';

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  esp32Connected: boolean;
  alertCount: number;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onOpenDisclaimer: () => void;
  onOpenEsp32Modal?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  isDemoMode,
  onToggleDemoMode,
  esp32Connected,
  alertCount,
  audioEnabled,
  onToggleAudio,
  onOpenDisclaimer,
  onOpenEsp32Modal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Live Dashboard', icon: Car },
    { id: 'monitoring', label: 'Telemetry Stream', icon: Activity },
    { id: 'vehicle', label: 'Vehicle Specs', icon: Cpu },
    { id: 'alerts', label: 'Alert Events', icon: AlertTriangle },
    { id: 'history', label: 'Trip Analytics', icon: Clock },
    { id: 'settings', label: 'Thresholds', icon: Sliders },
    { id: 'firmware', label: 'ESP32 Code & Guide', icon: Radio },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#000000]/95 backdrop-blur-2xl border-b border-cyan-500/30 shadow-[0_4px_35px_rgba(0,0,0,0.8)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Car className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-tech text-lg sm:text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-white">
                  AUTO BRAKE IoT
                </span>
                <span className="hidden md:inline-block text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30">
                  DIGITAL TWIN v2.4
                </span>
              </div>
              <p className="hidden sm:block text-[10px] text-slate-400 font-mono-code tracking-tight">
                Automatic Emergency Braking & Vehicle Telemetry System
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-tech font-semibold tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.id === 'alerts' && alertCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono-code bg-red-600 text-white font-bold animate-pulse">
                      {alertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Status Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio Alarm Mute/Unmute */}
            <button
              onClick={onToggleAudio}
              title={audioEnabled ? 'Mute ADAS Sound Beeps' : 'Enable ADAS Audio Alerts'}
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Mode Switch: Live IoT Mode vs Auto-Sense Emulation */}
            <button
              onClick={onToggleDemoMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-tech font-bold uppercase tracking-wider transition-all cursor-pointer ${
                isDemoMode
                  ? 'bg-purple-950/70 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : 'bg-emerald-950/70 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-purple-400 animate-pulse' : 'bg-emerald-400 animate-ping'}`} />
              <span className="hidden sm:inline">{isDemoMode ? '🟣 AUTO-SENSE LOOP' : '🟢 LIVE TRACKING (ESP32-C)'}</span>
              <span className="sm:hidden">{isDemoMode ? 'AUTO-SENSE' : 'LIVE'}</span>
            </button>

            {/* ESP32 Hardware Status Badge & Connect Modal Button */}
            <button
              onClick={onOpenEsp32Modal}
              title="Open ESP32 Connection Center & Arduino IDE Code"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-tech font-bold uppercase tracking-wider transition-all cursor-pointer ${
                esp32Connected
                  ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:bg-emerald-900'
                  : 'bg-gradient-to-r from-cyan-900/90 to-blue-900/90 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:from-cyan-800 hover:to-blue-800 animate-pulse'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-300" />
              <span>{esp32Connected ? 'ESP32 CONNECTED' : 'CONNECT ESP32'}</span>
            </button>

            {/* Publish to Vercel Button */}
            {onOpenVercelModal && (
              <button
                onClick={onOpenVercelModal}
                title="Publish & Deploy Website to Vercel"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 hover:border-white/60 bg-black/90 hover:bg-black text-white text-xs font-tech font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(255,255,255,0.12)] cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 76 65">
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
                <span className="hidden sm:inline">PUBLISH TO VERCEL</span>
                <span className="sm:hidden">VERCEL</span>
              </button>
            )}

            {/* Dark Theme Active Indicator */}
            <div 
              title="Stealth OLED Dark Mode Active" 
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-tech font-semibold tracking-wider shadow-[0_0_12px_rgba(6,182,212,0.15)]"
            >
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono-code text-cyan-300">DARK MODE</span>
            </div>

            {/* Info / Disclaimer Button */}
            <button
              onClick={onOpenDisclaimer}
              title="Project Safety Disclaimer"
              className="p-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <Info className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-cyan-500/20 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-tech font-semibold tracking-wider transition-colors ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <span>{item.label}</span>
                  </div>
                  {item.id === 'alerts' && alertCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono-code bg-red-600 text-white font-bold">
                      {alertCount}
                    </span>
                  )}
                </button>
              );
            })}

            {onOpenVercelModal && (
              <button
                onClick={() => {
                  onOpenVercelModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-tech font-semibold tracking-wider text-white bg-slate-900 border border-slate-700 hover:border-slate-500 transition-colors mt-2"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 76 65">
                  <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                </svg>
                <span>PUBLISH TO VERCEL</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
