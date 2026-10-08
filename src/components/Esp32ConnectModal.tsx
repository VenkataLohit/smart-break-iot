import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Cpu, 
  Usb, 
  Wifi, 
  Code2, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Play, 
  Square, 
  Volume2, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  DUAL_MODE_SKETCH, 
  SERIAL_ONLY_SKETCH, 
  SOFT_AP_SKETCH, 
  ARDUINO_IDE_STEPS, 
  PINOUT_SPECS 
} from '../utils/arduinoSketches';
import { webSerialManager, SerialConnectionStatus } from '../utils/webSerial';
import { TelemetryData } from '../types/telemetry';

interface Esp32ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  serialStatus: SerialConnectionStatus;
  isWsConnected: boolean;
  telemetry: TelemetryData;
  onConnectSerial: () => Promise<void>;
  onDisconnectSerial: () => Promise<void>;
  onConnectWs?: (url: string) => void;
  onDisconnectWs?: () => void;
}

export const Esp32ConnectModal: React.FC<Esp32ConnectModalProps> = ({
  isOpen,
  onClose,
  serialStatus,
  isWsConnected,
  telemetry,
  onConnectSerial,
  onDisconnectSerial,
  onConnectWs,
  onDisconnectWs,
}) => {
  const [activeTab, setActiveTab] = useState<'code' | 'serial' | 'wifi' | 'wiring'>('code');
  const [selectedSketch, setSelectedSketch] = useState<'dual' | 'serial' | 'ap'>('dual');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [terminalLogs, setTerminalLogs] = useState<{ id: string; time: string; text: string; dir: 'rx' | 'tx' | 'sys' }[]>([
    { id: '1', time: new Date().toLocaleTimeString(), text: 'ESP32 Hardware Bridge initialized. Ready to connect via USB Serial or Wi-Fi.', dir: 'sys' }
  ]);
  const [customCommand, setCustomCommand] = useState('');
  const [wsUrl, setWsUrl] = useState('ws://192.168.1.100:81');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Hook raw lines from WebSerial into the in-modal terminal
  useEffect(() => {
    webSerialManager.setRawLineCallback((line: string, direction: 'rx' | 'tx') => {
      setTerminalLogs((prev) => [
        ...prev.slice(-150),
        {
          id: `${Date.now()}-${Math.random()}`,
          time: new Date().toLocaleTimeString(),
          text: line,
          dir: direction,
        },
      ]);
    });
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (activeTab === 'serial') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, activeTab]);

  if (!isOpen) return null;

  const getCodeContent = () => {
    if (selectedSketch === 'dual') return DUAL_MODE_SKETCH;
    if (selectedSketch === 'serial') return SERIAL_ONLY_SKETCH;
    return SOFT_AP_SKETCH;
  };

  const getFilename = () => {
    if (selectedSketch === 'dual') return 'ESP32_AutoBrake_DualMode.ino';
    if (selectedSketch === 'serial') return 'ESP32_AutoBrake_SerialOnly.ino';
    return 'ESP32_AutoBrake_SoftAP.ino';
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeContent());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const handleDownloadIno = () => {
    const element = document.createElement('a');
    const file = new Blob([getCodeContent()], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = getFilename();
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyUrl = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleSendCommand = async (cmdString: string) => {
    if (!serialStatus.isConnected) {
      setTerminalLogs((p) => [
        ...p,
        { id: `${Date.now()}`, time: new Date().toLocaleTimeString(), text: '[ERROR] Please connect USB Serial first to send hardware commands.', dir: 'sys' }
      ]);
      return;
    }
    await webSerialManager.send(cmdString);
  };

  const isConnected = serialStatus.isConnected || isWsConnected;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#030712] border border-cyan-500/40 shadow-[0_0_60px_rgba(6,182,212,0.25)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/25 bg-gradient-to-r from-[#030712] via-[#08142c] to-[#030712]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/90 border border-cyan-500/60 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-tech text-base sm:text-lg font-bold text-white tracking-wider">
                  ESP32 ARDUINO IDE CONNECTION CENTER
                </h2>
                <span className={`text-[10px] font-mono-code font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  isConnected
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'bg-rose-950 text-rose-300 border-rose-500'
                }`}>
                  {isConnected ? '● HARDWARE LIVE' : '○ DISCONNECTED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Upload firmware in Arduino IDE, connect your physical ESP32 via USB or Wi-Fi, and feed real ultrasonic sensors into the Digital Twin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 py-2.5 bg-black/50 border-b border-slate-800 overflow-x-auto text-xs font-tech font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'code'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>1. Arduino IDE Code (.ino)</span>
          </button>

          <button
            onClick={() => setActiveTab('serial')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'serial'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Usb className="w-4 h-4 text-emerald-400" />
            <span>2. USB Web Serial (Direct)</span>
            {serialStatus.isConnected && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('wifi')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'wifi'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Wifi className="w-4 h-4 text-sky-400" />
            <span>3. Wi-Fi WebSocket (LAN)</span>
            {isWsConnected && (
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('wiring')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'wiring'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>4. Wiring & Pinout Guide</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: ARDUINO IDE CODE */}
          {activeTab === 'code' && (
            <div className="space-y-5">
              {/* Quick instructions banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/60 via-cyan-950/50 to-slate-950 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <div className="text-xs text-slate-300">
                    <strong className="text-cyan-300 font-tech uppercase">Ready for Arduino IDE:</strong> Copy this C++ sketch, paste it into Arduino IDE, select your ESP32 board, and upload. Once flashed, plug the USB cable in and switch to the <strong className="text-emerald-300">USB Web Serial</strong> tab!
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-tech font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                  </button>

                  <button
                    onClick={handleDownloadIno}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-tech font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                    title="Download Arduino .ino file"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Download .ino</span>
                  </button>
                </div>
              </div>

              {/* Sketch Variation Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-tech text-slate-400 uppercase tracking-wider mr-1">Choose Sketch Type:</span>
                <button
                  onClick={() => setSelectedSketch('dual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-tech font-semibold transition-all cursor-pointer ${
                    selectedSketch === 'dual'
                      ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ⚡ Dual USB Serial + Wi-Fi (Recommended)
                </button>

                <button
                  onClick={() => setSelectedSketch('serial')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-tech font-semibold transition-all cursor-pointer ${
                    selectedSketch === 'serial'
                      ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🔌 USB Serial Only (No Wi-Fi / Simplest)
                </button>

                <button
                  onClick={() => setSelectedSketch('ap')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-tech font-semibold transition-all cursor-pointer ${
                    selectedSketch === 'ap'
                      ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🌐 Wi-Fi Hotspot SoftAP (Standalone)
                </button>
              </div>

              {/* Code Display Window */}
              <div className="rounded-xl border border-slate-800 bg-[#02050c] overflow-hidden shadow-inner">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-slate-950/80 text-[11px] font-mono-code text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span>{getFilename()}</span>
                    <span>·</span>
                    <span>C++ / Arduino IDE</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>115200 BAUD</span>
                    <span>·</span>
                    <button
                      onClick={handleCopyCode}
                      className="text-cyan-400 hover:text-cyan-300 font-bold uppercase cursor-pointer"
                    >
                      {copiedCode ? '✓ COPIED' : 'COPY'}
                    </button>
                  </div>
                </div>

                <pre className="p-4 text-xs font-mono-code text-cyan-100/90 leading-relaxed overflow-x-auto max-h-[380px] selection:bg-cyan-700 selection:text-white">
                  <code>{getCodeContent()}</code>
                </pre>
              </div>

              {/* Step-by-Step Arduino IDE Guide */}
              <div className="space-y-3">
                <h3 className="font-tech text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>Step-by-Step Arduino IDE Flashing Checklist</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ARDUINO_IDE_STEPS.map((s) => (
                    <div 
                      key={s.step} 
                      className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300 font-tech text-xs font-bold flex items-center justify-center">
                          {s.step}
                        </span>
                        <h4 className="font-tech text-xs font-bold text-white tracking-wide">{s.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">{s.desc}</p>
                      {s.step === 2 && (
                        <button
                          onClick={() => handleCopyUrl('https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json')}
                          className="mt-2 text-[10px] font-mono-code text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedUrl ? 'Copied URL!' : 'Copy ESP32 Board URL'}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USB WEB SERIAL CONSOLE */}
          {activeTab === 'serial' && (
            <div className="space-y-4">
              {/* Connection Controls Bar */}
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg ${
                    serialStatus.isConnected
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-400 shadow-emerald-500/20'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}>
                    <Usb className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-tech text-sm font-bold text-white">
                      {serialStatus.isConnected ? 'ESP32 USB SERIAL LINK ACTIVE' : 'CONNECT PHYSICAL ESP32 VIA USB'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {serialStatus.isConnected
                        ? `Streaming live at ${serialStatus.baudRate} baud · ${serialStatus.packetsReceived} packets received`
                        : 'Plug your ESP32 into any USB port and click Connect (Requires Chrome, Edge, or Opera)'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono-code">
                    <span className="text-slate-400">BAUD:</span>
                    <select
                      value={baudRate}
                      onChange={(e) => setBaudRate(Number(e.target.value))}
                      disabled={serialStatus.isConnected}
                      className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value={115200} className="bg-slate-900">115200 (Default)</option>
                      <option value={9600} className="bg-slate-900">9600</option>
                      <option value={57600} className="bg-slate-900">57600</option>
                      <option value={230400} className="bg-slate-900">230400</option>
                    </select>
                  </div>

                  {serialStatus.isConnected ? (
                    <button
                      onClick={onDisconnectSerial}
                      className="px-4 py-2 rounded-xl bg-rose-950 border border-rose-500 text-rose-300 font-tech font-bold text-xs uppercase tracking-wider hover:bg-rose-900 transition-all cursor-pointer"
                    >
                      Disconnect Port
                    </button>
                  ) : (
                    <button
                      onClick={onConnectSerial}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-tech font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-emerald-500/30 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Usb className="w-4 h-4" />
                      <span>Select Port & Connect</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Hardware Quick Action Controls */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-tech text-slate-300 font-bold uppercase tracking-wider">
                  <span>Send Real Hardware Control Commands to ESP32:</span>
                  <span className="text-[11px] text-slate-400 font-mono-code">
                    Current Echo: {telemetry.distance.toFixed(2)}m · {telemetry.speed.toFixed(0)} km/h
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleSendCommand('{"command":"BRAKE"}')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-950 border border-red-500/70 hover:bg-red-900 text-red-200 font-tech text-xs font-bold uppercase transition-all cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    <span>Send Emergency Brake (Cut Motor + Servo 90°)</span>
                  </button>

                  <button
                    onClick={() => handleSendCommand('{"command":"CRUISE"}')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-950 border border-emerald-500/70 hover:bg-emerald-900 text-emerald-200 font-tech text-xs font-bold uppercase transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Send Resume Cruise (Motor On + Servo 0°)</span>
                  </button>

                  <button
                    onClick={() => handleSendCommand('{"command":"BUZZER_TEST"}')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/70 hover:bg-cyan-900 text-cyan-200 font-tech text-xs font-bold uppercase transition-all cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Test Buzzer Alarm</span>
                  </button>
                </div>
              </div>

              {/* Raw Serial Terminal */}
              <div className="rounded-xl border border-slate-800 bg-[#010409] overflow-hidden shadow-inner">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950 text-[11px] font-mono-code text-slate-400">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>LIVE SERIAL MONITOR TERMINAL (115200 BAUD)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400">{terminalLogs.length} LINES</span>
                    <button
                      onClick={() => setTerminalLogs([])}
                      className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                      title="Clear terminal"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>CLEAR</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 font-mono-code text-xs text-slate-300 h-64 overflow-y-auto space-y-1">
                  {terminalLogs.length === 0 ? (
                    <div className="text-slate-600 text-center py-10">Terminal is empty. Connect ESP32 to view incoming packets.</div>
                  ) : (
                    terminalLogs.map((log) => (
                      <div 
                        key={log.id} 
                        className={`leading-tight flex items-start gap-2 ${
                          log.dir === 'tx'
                            ? 'text-cyan-300 font-semibold'
                            : log.dir === 'sys'
                            ? 'text-amber-400'
                            : log.text.includes('"brake":true')
                            ? 'text-rose-400 font-bold'
                            : 'text-emerald-300/90'
                        }`}
                      >
                        <span className="text-[10px] text-slate-600 select-none">[{log.time}]</span>
                        <span className="text-[10px] uppercase font-bold select-none text-slate-500">
                          {log.dir === 'tx' ? 'TX ▶' : log.dir === 'sys' ? 'SYS ●' : 'RX ◀'}
                        </span>
                        <span className="break-all">{log.text}</span>
                      </div>
                    ))
                  )}
                  <div ref={terminalEndRef} />
                </div>

                {/* Custom Command Input */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (customCommand.trim()) {
                      handleSendCommand(customCommand.trim());
                      setCustomCommand('');
                    }
                  }}
                  className="flex items-center gap-2 p-2 border-t border-slate-800 bg-slate-950"
                >
                  <input
                    type="text"
                    value={customCommand}
                    onChange={(e) => setCustomCommand(e.target.value)}
                    placeholder='Type custom command or JSON, e.g. {"command":"BRAKE"} or {"speed":25}'
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono-code text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-tech font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Send (TX)
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: WI-FI WEBSOCKET */}
          {activeTab === 'wifi' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/30 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-lg ${
                    isWsConnected
                      ? 'bg-sky-950 border-sky-500 text-sky-400 shadow-sky-500/20'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}>
                    <Wifi className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-tech text-sm font-bold text-white">
                      {isWsConnected ? 'ESP32 WI-FI WEBSOCKET ACTIVE' : 'CONNECT OVER LOCAL WI-FI (LAN)'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      When your ESP32 is on the same local Wi-Fi, it runs a WebSocket server on Port 81 for wireless telemetry.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={wsUrl}
                    onChange={(e) => setWsUrl(e.target.value)}
                    placeholder="ws://192.168.1.100:81"
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono-code text-cyan-300 focus:outline-none focus:border-cyan-400 w-56"
                  />

                  {isWsConnected ? (
                    <button
                      onClick={onDisconnectWs}
                      className="px-4 py-2 rounded-xl bg-rose-950 border border-rose-500 text-rose-300 font-tech font-bold text-xs uppercase cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => onConnectWs?.(wsUrl)}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-tech font-bold text-xs uppercase cursor-pointer"
                    >
                      Connect Wi-Fi
                    </button>
                  )}
                </div>
              </div>

              {/* Wi-Fi Instructions */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-300">
                <h4 className="font-tech text-white font-bold uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>How to find your ESP32 IP Address:</span>
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                  <li>In the Arduino code, set your home Wi-Fi SSID and Password.</li>
                  <li>After uploading, open the Serial Monitor (Tools &gt; Serial Monitor @ 115200 baud).</li>
                  <li>When connected, the ESP32 prints: <code className="text-cyan-300 font-mono-code">[WIFI] Connected! Local IP: 192.168.x.x</code></li>
                  <li>Enter <code className="text-cyan-300 font-mono-code">ws://192.168.x.x:81</code> above and click Connect Wi-Fi.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: WIRING & PINOUT GUIDE */}
          {activeTab === 'wiring' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-white">
                    ESP32 HARDWARE PINOUT & WIRING MATRIX
                  </h3>
                  <p className="text-xs text-slate-400 font-sans">
                    Recommended GPIO pin assignments for NodeMCU-32S, ESP32-WROOM-32, and DOIT ESP32 DevKit V1.
                  </p>
                </div>
              </div>

              {/* Pin Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs font-mono-code">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Component & Function</th>
                      <th className="px-4 py-2.5 text-cyan-400">ESP32 Pin</th>
                      <th className="px-4 py-2.5">Wire Color</th>
                      <th className="px-4 py-2.5">Hardware Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-[#02050c]">
                    {PINOUT_SPECS.map((pin, i) => (
                      <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                        <td className="px-4 py-2.5 text-white font-semibold">{pin.component}</td>
                        <td className="px-4 py-2.5 text-cyan-300 font-bold">{pin.esp32Pin}</td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5">
                            <span 
                              className="w-2.5 h-2.5 rounded-full" 
                              style={{ 
                                backgroundColor: 
                                  pin.wireColor === 'Red' ? '#ef4444' : 
                                  pin.wireColor === 'Black' ? '#374151' : 
                                  pin.wireColor === 'Yellow' ? '#eab308' : 
                                  pin.wireColor === 'Green' ? '#22c55e' : 
                                  pin.wireColor === 'Blue' ? '#3b82f6' : 
                                  pin.wireColor === 'Purple' ? '#a855f7' : 
                                  pin.wireColor === 'Orange' ? '#f97316' : '#e2e8f0' 
                              }} 
                            />
                            <span className="text-slate-300">{pin.wireColor}</span>
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 text-[11px]">{pin.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Important Electrical Safety Warnings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-200">
                    <strong className="text-amber-300 block mb-1">HC-SR04 5V Echo Level Protection:</strong>
                    The HC-SR04 Echo pin outputs 5V pulses, while ESP32 GPIOs are rated for 3.3V. Place a 1kΩ resistor between Echo and GPIO 18, and a 2kΩ resistor from GPIO 18 to GND to safely step down the voltage.
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-cyan-200">
                    <strong className="text-cyan-300 block mb-1">Motor Power Isolation:</strong>
                    Power the L298N motors with a separate 7.4V (2S LiPo) or 9V battery pack rather than the ESP32 3.3V rail. Always connect the battery negative to the ESP32 GND to maintain a common ground reference.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-slate-800 bg-slate-950/90 text-xs font-tech">
          <div className="flex items-center gap-2 text-slate-400">
            <span>Status:</span>
            <span className={isConnected ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {serialStatus.isConnected
                ? `⚡ USB Connected (${serialStatus.packetsReceived} packets)`
                : isWsConnected
                ? '🌐 Wi-Fi WebSocket Connected'
                : '○ Hardware Not Connected (Virtual Auto-Sense Active)'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {activeTab !== 'code' && (
              <button
                onClick={() => setActiveTab('code')}
                className="px-3.5 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                View Arduino Code
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider cursor-pointer shadow-lg"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
