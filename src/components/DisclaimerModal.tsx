import React from 'react';
import { ShieldAlert, X, AlertTriangle } from 'lucide-react';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DisclaimerModal: React.FC<DisclaimerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg p-6 rounded-2xl glass-panel border border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-3 border-b border-amber-500/20 text-amber-400">
          <AlertTriangle className="w-6 h-6 animate-pulse" />
          <h3 className="font-tech text-lg font-bold uppercase tracking-wider text-white">
            PROJECT SAFETY & USAGE DISCLAIMER
          </h3>
        </div>

        <div className="py-4 space-y-3 text-xs text-slate-300 leading-relaxed font-sans">
          <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200">
            <strong>Important Notice:</strong> This web application is a prototype visualization and digital twin dashboard for an academic college IoT-based automatic braking project.
          </div>

          <p>
            It is designed strictly for educational bench demonstrations, small-scale robotics car chassis (ESP32 microcontrollers, DC motors, and ultrasonic sensors), and simulated fail-safe telemetry.
          </p>

          <p className="font-semibold text-slate-200">
            It is <u>NOT</u> intended for use in, or direct control of, a full-size road vehicle, passenger automotive braking system, or life-critical machinery.
          </p>

          <p className="text-slate-400 text-[11px] font-mono-code pt-1">
            Department of Electronics &amp; Computer Engineering · Autonomous Robotics Capstone
          </p>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-tech font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
          >
            I Understand &amp; Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
