import React, { useState } from 'react';
import { AlertEvent } from '../types/telemetry';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  CheckCircle2, 
  Filter, 
  Trash2, 
  Download,
  Clock,
  Radio
} from 'lucide-react';

interface AlertsPageProps {
  alerts: AlertEvent[];
  onClearAlerts: () => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ alerts, onClearAlerts }) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'all') return true;
    return alert.type === filter;
  });

  const exportAlerts = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(alerts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `auto_brake_alerts_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl glass-panel border border-cyan-500/20">
        <div>
          <h2 className="font-tech text-xl font-bold text-white tracking-wide flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            SAFETY ALERTS & REAL-TIME EVENT LOG
          </h2>
          <p className="text-xs text-slate-400 font-mono-code">
            Immutable timeline of proximity violations, automatic braking triggers, and sensor events
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Segmented Control */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-tech">
            {(['all', 'critical', 'warning', 'info'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                  filter === t
                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={exportAlerts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-tech border border-slate-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Log</span>
          </button>

          <button
            onClick={onClearAlerts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 text-xs font-tech border border-rose-500/30 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 overflow-hidden">
        {filteredAlerts.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400/60 mb-3" />
            <h3 className="font-tech text-lg text-slate-300 font-bold">NO ALERTS RECORDED</h3>
            <p className="text-xs text-slate-500 font-mono-code mt-1">
              Vehicle has operated within safe distance thresholds or the log was cleared.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono-code">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-tech">
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Event Description</th>
                  <th className="py-3 px-4">Distance</th>
                  <th className="py-3 px-4">Speed</th>
                  <th className="py-3 px-4">Trigger Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {filteredAlerts.map((alert) => {
                  let badge = 'text-cyan-400 bg-cyan-950/60 border-cyan-500/30';
                  let Icon = Info;
                  if (alert.type === 'critical') {
                    badge = 'text-red-400 bg-red-950/80 border-red-500/50';
                    Icon = ShieldAlert;
                  } else if (alert.type === 'warning') {
                    badge = 'text-amber-400 bg-amber-950/80 border-amber-500/50';
                    Icon = AlertTriangle;
                  }

                  return (
                    <tr key={alert.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{alert.timestamp}</span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-tech font-bold uppercase ${badge}`}>
                          <Icon className="w-3 h-3" />
                          <span>{alert.type}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-white">
                        {alert.event}
                      </td>

                      <td className="py-3 px-4">
                        <span className={alert.distance <= 1.0 ? 'text-red-400 font-bold' : alert.distance <= 3.0 ? 'text-amber-400' : 'text-slate-300'}>
                          {alert.distance.toFixed(2)} m
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {Math.round(alert.speed)} km/h
                      </td>

                      <td className="py-3 px-4 text-slate-400">
                        {alert.source === 'automatic_brake' && <span className="text-red-400">ESP32 Auto-Brake</span>}
                        {alert.source === 'manual_brake' && <span className="text-blue-400">Manual Brake</span>}
                        {alert.source === 'sensor' && <span className="text-amber-400">HC-SR04 Sonar</span>}
                        {alert.source === 'system' && <span className="text-slate-400">System Link</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
