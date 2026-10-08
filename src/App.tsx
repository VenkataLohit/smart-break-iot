import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  TelemetryData, 
  SystemSettings, 
  AlertEvent, 
  TripHistory, 
  HistoryPoint 
} from './types/telemetry';
import { Navigation, NavTab } from './components/Navigation';
import { DigitalTwinCarSimulation } from './components/DigitalTwinCarSimulation';
import { LiveDataCards } from './components/LiveDataCards';
import { LiveSensorPanel } from './components/LiveSensorPanel';
import { LiveTrackingHeader } from './components/LiveTrackingHeader';
import { LiveMonitoringPage } from './components/LiveMonitoringPage';
import { VehicleDetailsPage } from './components/VehicleDetailsPage';
import { AlertsPage } from './components/AlertsPage';
import { HistoryPage } from './components/HistoryPage';
import { SettingsPage } from './components/SettingsPage';
import { HardwareFirmwarePage } from './components/HardwareFirmwarePage';
import { DisclaimerModal } from './components/DisclaimerModal';
import { Esp32ConnectModal } from './components/Esp32ConnectModal';
import { VercelPublishModal } from './components/VercelPublishModal';
import { soundEffects } from './utils/audioAlerts';
import { webSerialManager, SerialConnectionStatus } from './utils/webSerial';
import { 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Play, 
  Square, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  DoorOpen
} from 'lucide-react';

const INITIAL_SETTINGS: SystemSettings = {
  danger_threshold: 1.0,
  warning_threshold: 3.0,
  caution_threshold: 5.0,
  max_speed: 60,
  demo_mode: false, // Default to LIVE AUTOMATIC TRACKING
  audio_alerts: true,
  auto_brake_enabled: true,
  esp32_endpoint: '/ws',
};

const INITIAL_TELEMETRY: TelemetryData = {
  car_status: 'running',
  speed: 32,
  distance: 5.2,
  motor: true,
  brake: false,
  obstacle: false,
  brake_mode: 'none',
  door_open: false,
  doors: { driver: false, passenger: false },
  esp32_connected: true,
  wifi_rssi: -52,
  voltage: 11.9,
  current_draw: 1.3,
  timestamp: new Date().toLocaleTimeString(),
  motor_pwm: 180,
};

const INITIAL_ALERTS: AlertEvent[] = [
  {
    id: 'alt-1',
    timestamp: '10:42:15',
    event: 'Obstacle detected within caution zone (3.2m)',
    type: 'warning',
    distance: 3.2,
    speed: 35,
    source: 'sensor',
  },
  {
    id: 'alt-2',
    timestamp: '10:42:18',
    event: 'Proximity violation (< 1.0m) - AUTOMATIC EMERGENCY BRAKE ENGAGED',
    type: 'critical',
    distance: 0.85,
    speed: 32,
    source: 'automatic_brake',
  },
  {
    id: 'alt-3',
    timestamp: '10:42:20',
    event: 'Vehicle stopped safely by ESP32 without obstacle collision',
    type: 'info',
    distance: 0.82,
    speed: 0,
    source: 'automatic_brake',
  },
];

const INITIAL_TRIPS: TripHistory[] = [
  {
    id: 'trip-1',
    title: 'ESP32-C Live Track Run #1',
    timestamp: 'Today, 10:40 AM',
    durationSeconds: 185,
    distanceMeters: 420,
    maxSpeed: 42,
    avgSpeed: 24.5,
    autoBrakeCount: 3,
    manualBrakeCount: 0,
    status: 'completed',
    points: [
      { time: '0s', speed: 0, distance: 6.0, brakeActive: false, autoBrake: false },
      { time: '10s', speed: 20, distance: 5.8, brakeActive: false, autoBrake: false },
      { time: '25s', speed: 38, distance: 4.5, brakeActive: false, autoBrake: false },
      { time: '35s', speed: 38, distance: 2.8, brakeActive: false, autoBrake: false },
      { time: '40s', speed: 12, distance: 0.9, brakeActive: true, autoBrake: true },
      { time: '45s', speed: 0, distance: 0.85, brakeActive: true, autoBrake: true },
      { time: '60s', speed: 25, distance: 5.5, brakeActive: false, autoBrake: false },
      { time: '80s', speed: 42, distance: 4.8, brakeActive: false, autoBrake: false },
      { time: '95s', speed: 0, distance: 0.75, brakeActive: true, autoBrake: true },
    ],
  },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [settings, setSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [telemetry, setTelemetry] = useState<TelemetryData>(INITIAL_TELEMETRY);
  const [alerts, setAlerts] = useState<AlertEvent[]>(INITIAL_ALERTS);
  const [trips, setTrips] = useState<TripHistory[]>(INITIAL_TRIPS);
  const [historyStream, setHistoryStream] = useState<TelemetryData[]>([INITIAL_TELEMETRY]);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isEsp32ModalOpen, setIsEsp32ModalOpen] = useState(false);
  const [isVercelModalOpen, setIsVercelModalOpen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Toggle Car Door Open / Closed
  const handleToggleDoor = () => {
    setTelemetry((prev) => {
      const nextDoor = !prev.door_open;
      if (nextDoor) {
        addAlert('Driver door opened. Interior cabin ambient lighting activated.', 'warning', 'sensor', prev.distance, prev.speed);
      } else {
        addAlert('Driver door closed and securely locked.', 'info', 'sensor', prev.distance, prev.speed);
      }
      return {
        ...prev,
        door_open: nextDoor,
        doors: { driver: nextDoor, passenger: false },
        timestamp: new Date().toLocaleTimeString(),
      };
    });
  };

  // Serial & WebSocket Hardware Connection States
  const [serialStatus, setSerialStatus] = useState<SerialConnectionStatus>({
    isConnected: false,
    baudRate: 115200,
    packetsReceived: 0,
  });
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [packetCount, setPacketCount] = useState(128);

  // Automatic Real-Time Emulation Loop (runs automatically when physical board is offline)
  const [isAutoSenseLoopActive, setIsAutoSenseLoopActive] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const autoSenseTimerRef = useRef<number | null>(null);

  // Initialize Web Audio alerts
  useEffect(() => {
    soundEffects.setEnabled(audioEnabled && settings.audio_alerts);
  }, [audioEnabled, settings.audio_alerts]);

  // Append new alert event
  const addAlert = useCallback((
    event: string, 
    type: 'critical' | 'warning' | 'info' | 'success', 
    source: 'automatic_brake' | 'manual_brake' | 'sensor' | 'system',
    dist: number,
    spd: number
  ) => {
    const newAlert: AlertEvent = {
      id: `alt-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      event,
      type,
      distance: dist,
      speed: spd,
      source,
    };
    setAlerts((prev) => [newAlert, ...prev.slice(0, 49)]);
  }, []);

  // Web Serial Callbacks setup
  useEffect(() => {
    webSerialManager.setCallbacks(
      (data) => {
        // Direct real hardware packet received from ESP32-C via USB Serial!
        setPacketCount((c) => c + 1);
        setIsAutoSenseLoopActive(false); // Stop emulation when real hardware speaks

        setTelemetry((prev) => {
          const nextSpeed = typeof data.speed === 'number' ? data.speed : prev.speed;
          const nextDist = typeof data.distance === 'number' ? data.distance : prev.distance;
          const nextBrake = typeof data.brake === 'boolean' ? data.brake : prev.brake;
          const nextMotor = typeof data.motor === 'boolean' ? data.motor : prev.motor;
          const nextObstacle = typeof data.obstacle === 'boolean' ? data.obstacle : (nextDist < settings.caution_threshold);
          const nextBrakeMode = data.brake_mode || (nextBrake ? 'automatic' : 'none');
          const nextStatus = data.car_status || (nextBrake ? (nextSpeed === 0 ? 'stopped' : 'braking') : (nextMotor ? 'running' : 'off'));

          // If automatic brake triggered on hardware
          if (nextBrake && !prev.brake) {
            soundEffects.playBrakeActuation();
            addAlert(
              `[ESP32-C SENSE] Hardware Automatic Emergency Brake engaged at ${nextDist.toFixed(2)}m!`,
              'critical',
              'automatic_brake',
              nextDist,
              nextSpeed
            );
          }

          return {
            ...prev,
            ...data,
            speed: nextSpeed,
            distance: nextDist,
            brake: nextBrake,
            motor: nextMotor,
            obstacle: nextObstacle,
            brake_mode: nextBrakeMode,
            car_status: nextStatus,
            esp32_connected: true,
            timestamp: new Date().toLocaleTimeString(),
          };
        });
      },
      (status) => {
        setSerialStatus(status);
        if (status.isConnected) {
          addAlert('ESP32-C connected via USB Serial (115200 baud). Live telemetry active.', 'success', 'system', telemetry.distance, telemetry.speed);
        }
      }
    );
  }, [settings.caution_threshold, addAlert, telemetry.distance, telemetry.speed]);

  // Connect to ESP32-C via USB Serial
  const handleConnectSerial = async () => {
    const ok = await webSerialManager.connect(115200);
    if (!ok && serialStatus.error) {
      addAlert(`USB Serial: ${serialStatus.error}`, 'warning', 'system', telemetry.distance, telemetry.speed);
    }
  };

  const handleDisconnectSerial = async () => {
    await webSerialManager.disconnect();
    addAlert('ESP32-C USB Serial disconnected.', 'info', 'system', telemetry.distance, telemetry.speed);
  };

  // WebSocket Server Connection (/ws) with robust lifecycle management
  useEffect(() => {
    let wsUrl = settings.esp32_endpoint;
    if (wsUrl.startsWith('/')) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}${wsUrl}`;
    }

    let isMounted = true;
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;
    let retryAttempts = 0;

    const connectWebSocket = () => {
      if (!isMounted) return;
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          retryAttempts = 0;
          setIsWsConnected(true);
          setTelemetry((prev) => ({ ...prev, esp32_connected: true }));
        };

        socket.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            setPacketCount((c) => c + 1);
            setIsAutoSenseLoopActive(false);

            setTelemetry((prev) => {
              const nextSpeed = typeof data.speed === 'number' ? data.speed : prev.speed;
              const nextDist = typeof data.distance === 'number' ? data.distance : prev.distance;
              const nextBrake = typeof data.brake === 'boolean' ? data.brake : prev.brake;

              if (nextBrake && !prev.brake) {
                soundEffects.playBrakeActuation();
                addAlert(
                  `[ESP32-C SENSE] Automatic Brake engaged over Wi-Fi at ${nextDist.toFixed(2)}m!`,
                  'critical',
                  'automatic_brake',
                  nextDist,
                  nextSpeed
                );
              }

              return {
                ...prev,
                ...data,
                esp32_connected: true,
                timestamp: new Date().toLocaleTimeString(),
              };
            });
          } catch {}
        };

        socket.onclose = () => {
          if (!isMounted) return;
          setIsWsConnected(false);
          // Exponential backoff to avoid console error flood if WebSocket upgrade is unavailable
          if (retryAttempts < 5) {
            retryAttempts++;
            reconnectTimeout = setTimeout(connectWebSocket, Math.min(3000 * retryAttempts, 12000));
          }
        };

        socket.onerror = () => {
          if (!isMounted) return;
          setIsWsConnected(false);
        };
      } catch {
        if (!isMounted) return;
        setIsWsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.close();
      }
    };
  }, [settings.esp32_endpoint, addAlert]);

  // Buffer telemetry stream for oscilloscopes
  useEffect(() => {
    setHistoryStream((prev) => [...prev.slice(-35), telemetry]);
  }, [telemetry]);

  // Sound alarms on obstacle approach
  useEffect(() => {
    if (telemetry.obstacle) {
      if (telemetry.distance <= settings.danger_threshold) {
        soundEffects.playObstacleWarning('danger');
      } else if (telemetry.distance <= settings.warning_threshold) {
        soundEffects.playObstacleWarning('warning');
      } else if (telemetry.distance <= settings.caution_threshold) {
        soundEffects.playObstacleWarning('caution');
      }
    }
  }, [telemetry.obstacle, telemetry.distance, settings]);

  // ================= AUTOMATIC REAL-TIME EMULATION LOOP =================
  // When no physical USB or Wi-Fi packet has arrived, this loop runs AUTONOMOUSLY
  // so the car drives, senses obstacles, automatically brakes, stops, and resumes
  // without needing any manual button clicks!
  useEffect(() => {
    if (!isAutoSenseLoopActive || serialStatus.isConnected || isWsConnected) {
      if (autoSenseTimerRef.current) clearInterval(autoSenseTimerRef.current);
      return;
    }

    let cycleStep = 0;
    // Cycle length: 30 steps of 400ms = 12 seconds per autonomous trial run
    autoSenseTimerRef.current = window.setInterval(() => {
      cycleStep = (cycleStep + 1) % 36;
      setPacketCount((c) => c + 1);

      setTelemetry((prev) => {
        let nextSpeed = prev.speed;
        let nextDist = prev.distance;
        let nextObstacle = prev.obstacle;
        let nextBrake = prev.brake;
        let nextBrakeMode = prev.brake_mode;
        let nextMotor = prev.motor;
        let nextStatus = prev.car_status;

        // 0-4s: Normal Highway Driving (No obstacle)
        if (cycleStep <= 10) {
          nextMotor = true;
          nextBrake = false;
          nextBrakeMode = 'none';
          nextObstacle = false;
          nextDist = 5.8;
          nextSpeed = Math.min(36, (cycleStep * 4) + 12);
          nextStatus = 'running';
        }
        // 4-6s: Obstacle Appears in Caution Zone (4.0m down to 2.8m)
        else if (cycleStep <= 16) {
          nextObstacle = true;
          nextDist = Math.max(2.2, 4.8 - ((cycleStep - 10) * 0.45));
          nextSpeed = 34;
          nextStatus = 'running';
        }
        // 6-8s: Approaching Danger Threshold (< 1.0m) -> AUTOMATIC BRAKE TRIGGERS!
        else if (cycleStep <= 22) {
          nextObstacle = true;
          nextDist = Math.max(0.78, 2.2 - ((cycleStep - 16) * 0.35));

          if (nextDist <= settings.danger_threshold) {
            nextBrake = true;
            nextBrakeMode = 'automatic';
            nextMotor = false;
            nextSpeed = Math.max(0, prev.speed - 9);
            nextStatus = nextSpeed === 0 ? 'stopped' : 'braking';

            if (!prev.brake) {
              soundEffects.playBrakeActuation();
              addAlert(
                `[AUTO-SENSE] Sonar detected barrier at ${nextDist.toFixed(2)}m! AUTOMATIC EMERGENCY BRAKE ENGAGED!`,
                'critical',
                'automatic_brake',
                nextDist,
                prev.speed
              );
            }
          }
        }
        // 8-11s: Fully Stopped Before Obstacle
        else if (cycleStep <= 30) {
          nextSpeed = 0;
          nextStatus = 'stopped';
          nextBrake = true;
          nextBrakeMode = 'automatic';
          nextMotor = false;
          nextDist = 0.75;
          nextObstacle = true;
        }
        // 11-12s: Obstacle Cleared, Prepare for Next Run
        else {
          nextObstacle = false;
          nextDist = 5.5;
          nextBrake = false;
          nextBrakeMode = 'none';
          nextMotor = true;
          nextSpeed = 10;
          nextStatus = 'starting';
        }

        return {
          ...prev,
          speed: nextSpeed,
          distance: nextDist,
          obstacle: nextObstacle,
          brake: nextBrake,
          brake_mode: nextBrakeMode,
          motor: nextMotor,
          car_status: nextStatus,
          timestamp: new Date().toLocaleTimeString(),
        };
      });
    }, 380);

    return () => {
      if (autoSenseTimerRef.current) clearInterval(autoSenseTimerRef.current);
    };
  }, [isAutoSenseLoopActive, serialStatus.isConnected, isWsConnected, settings.danger_threshold, addAlert]);

  const handleConnectWs = (url: string) => {
    setSettings((prev) => ({ ...prev, esp32_endpoint: url }));
    addAlert(`Connecting to ESP32 Wi-Fi WebSocket at ${url}`, 'info', 'system', telemetry.distance, telemetry.speed);
  };

  const handleDisconnectWs = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsWsConnected(false);
    addAlert('Wi-Fi WebSocket disconnected', 'info', 'system', telemetry.distance, telemetry.speed);
  };

  return (
    <div className="min-h-screen bg-[#020308] carbon-bg text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Navigation Bar */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isDemoMode={isAutoSenseLoopActive}
        onToggleDemoMode={() => {
          setIsAutoSenseLoopActive(!isAutoSenseLoopActive);
        }}
        esp32Connected={serialStatus.isConnected || isWsConnected || isAutoSenseLoopActive}
        alertCount={alerts.filter((a) => a.type === 'critical').length}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(!audioEnabled)}
        onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
        onOpenEsp32Modal={() => setIsEsp32ModalOpen(true)}
        onOpenVercelModal={() => setIsVercelModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Automatic Tracking Banner with Direct Hardware Sync */}
        <LiveTrackingHeader
          serialStatus={serialStatus}
          isWsConnected={isWsConnected}
          isAutoSenseLoopActive={isAutoSenseLoopActive}
          onToggleAutoSenseLoop={() => setIsAutoSenseLoopActive(!isAutoSenseLoopActive)}
          onConnectSerial={handleConnectSerial}
          onDisconnectSerial={handleDisconnectSerial}
          onConnectWs={() => setIsEsp32ModalOpen(true)}
          onOpenEsp32Modal={() => setIsEsp32ModalOpen(true)}
          lastPacketTime={telemetry.timestamp}
          totalPackets={packetCount}
          carStatus={telemetry.car_status}
          obstacle={telemetry.obstacle}
          distance={telemetry.distance}
        />

        {/* Prominent Emergency Brake Alert Banner when stopped/braking by ESP32 */}
        {telemetry.brake && telemetry.brake_mode === 'automatic' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950 via-red-900 to-rose-950 border-2 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)] flex flex-wrap items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg">
                <ShieldAlert className="w-7 h-7 animate-bounce" />
              </div>
              <div>
                <h3 className="font-tech text-lg sm:text-xl font-bold text-white tracking-wider">
                  🛑 AUTOMATIC BRAKING ACTIVE — VEHICLE STOPPED BY ESP32 SENSOR
                </h3>
                <p className="text-xs text-red-200 font-mono-code">
                  HC-SR04 sensed obstacle at {telemetry.distance.toFixed(2)}m (&lt; {settings.danger_threshold}m threshold). Motors cut off and counter-EMF brake engaged.
                </p>
              </div>
            </div>

            <div className="text-xs font-tech font-bold px-3 py-1.5 rounded-lg bg-black/40 border border-red-400 text-red-200">
              SPEED: 0 km/h · DIGITAL TWIN HALTED
            </div>
          </div>
        )}

        {/* Dashboard View */}
        {currentTab === 'dashboard' && (
          <div className="space-y-5">
            {/* 1. Main Animated Digital Twin Simulation (Senses in Real-Time & Shows Doors!) */}
            <DigitalTwinCarSimulation
              telemetry={telemetry}
              settings={settings}
              onToggleDoor={handleToggleDoor}
            />

            {/* 2. Live Telemetry Gauges & Status Cards */}
            <LiveDataCards
              telemetry={telemetry}
              settings={settings}
              onToggleDoor={handleToggleDoor}
            />

            {/* 3. Live Sensor Panel (Ultrasonic Distance, Motor, Speed, Sonar Echo) */}
            <LiveSensorPanel
              telemetry={telemetry}
            />

            {/* Autonomous Road Scenario Controls (ESP32 AEB Radar Test) */}
            <div className="cyber-panel rounded-2xl p-4 sm:p-5 border border-cyan-500/25">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-tech text-sm font-bold uppercase tracking-wider text-white">
                    AUTONOMOUS ROAD SCENARIO CONTROLS (ESP32 AEB RADAR TEST)
                  </h3>
                </div>
                <span className="text-[11px] font-mono-code text-slate-400">
                  Tests autonomous obstacle detection and emergency braking
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => {
                    setIsAutoSenseLoopActive(false);
                    soundEffects.playBrakeActuation();
                    addAlert(
                      '[AUTONOMOUS AEB] Front obstacle detected at 0.82m! ESP32 Automatic Emergency Brake activated!',
                      'critical',
                      'automatic_brake',
                      0.82,
                      telemetry.speed
                    );
                    setTelemetry((p) => ({
                      ...p,
                      obstacle: true,
                      distance: 0.82,
                      brake: true,
                      brake_mode: 'automatic',
                      motor: false,
                      speed: 0,
                      car_status: 'stopped',
                      timestamp: new Date().toLocaleTimeString(),
                    }));
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-tech font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-red-500/30 active:scale-95 transition-all cursor-pointer"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Test Sudden Obstacle (Auto-Brake)</span>
                </button>

                <button
                  onClick={() => {
                    setIsAutoSenseLoopActive(false);
                    addAlert(
                      '[AUTONOMOUS CRUISE] Path cleared. ESP32 motor drive resumed at 34 km/h.',
                      'info',
                      'sensor',
                      5.8,
                      34
                    );
                    setTelemetry((p) => ({
                      ...p,
                      obstacle: false,
                      distance: 5.8,
                      brake: false,
                      brake_mode: 'none',
                      motor: true,
                      speed: 34,
                      car_status: 'running',
                      timestamp: new Date().toLocaleTimeString(),
                    }));
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-tech font-bold text-xs uppercase tracking-wider shadow-lg hover:shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>Resume Clear Cruise (34 km/h)</span>
                </button>

                <button
                  onClick={handleToggleDoor}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-tech font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border ${
                    telemetry.door_open
                      ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-cyan-400'
                  }`}
                >
                  <DoorOpen className="w-4 h-4 text-amber-400" />
                  <span>{telemetry.door_open ? 'Close Car Door' : 'Open Car Door (Scissor / Hatch)'}</span>
                </button>

                <button
                  onClick={() => {
                    setIsAutoSenseLoopActive(true);
                    addAlert(
                      'Continuous Autonomous Sensing loop resumed. Real-time ESP32 closed-loop active.',
                      'success',
                      'system',
                      telemetry.distance,
                      telemetry.speed
                    );
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-200 font-tech font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4 text-cyan-400" />
                  <span>Resume Continuous Auto-Sense Loop</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Telemetry Stream & Oscilloscope */}
        {currentTab === 'monitoring' && (
          <LiveMonitoringPage
            telemetry={telemetry}
            historyStream={historyStream}
          />
        )}

        {/* Vehicle Specs & Pinout */}
        {currentTab === 'vehicle' && (
          <VehicleDetailsPage
            telemetry={telemetry}
          />
        )}

        {/* Alert Log */}
        {currentTab === 'alerts' && (
          <AlertsPage
            alerts={alerts}
            onClearAlerts={() => setAlerts([])}
          />
        )}

        {/* History Analytics */}
        {currentTab === 'history' && (
          <HistoryPage
            trips={trips}
          />
        )}

        {/* Settings */}
        {currentTab === 'settings' && (
          <SettingsPage
            settings={settings}
            onSaveSettings={(newSettings) => {
              setSettings(newSettings);
              addAlert('Updated automatic braking thresholds & system configuration', 'info', 'system', telemetry.distance, telemetry.speed);
            }}
            onOpenVercelModal={() => setIsVercelModalOpen(true)}
          />
        )}

        {/* ESP32-C Firmware Code & Guide */}
        {currentTab === 'firmware' && (
          <HardwareFirmwarePage onOpenConnectModal={() => setIsEsp32ModalOpen(true)} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-[#050811] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs font-mono-code text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>IoT-Based Automatic Car Braking and Real-Time Vehicle Monitoring System</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsVercelModalOpen(true)}
              className="flex items-center gap-1.5 text-white hover:text-cyan-400 font-tech font-bold transition-colors cursor-pointer"
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 76 65">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
              <span>Deploy on Vercel</span>
            </button>
            <span>·</span>
            <button
              onClick={() => setIsDisclaimerOpen(true)}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Academic Prototype Disclaimer
            </button>
            <span>·</span>
            <span>ESP32-C RISC-V Digital Twin</span>
          </div>
        </div>
      </footer>

      {/* Safety Disclaimer Modal */}
      <DisclaimerModal
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />

      {/* ESP32 Arduino IDE & Hardware Connection Center Modal */}
      <Esp32ConnectModal
        isOpen={isEsp32ModalOpen}
        onClose={() => setIsEsp32ModalOpen(false)}
        serialStatus={serialStatus}
        isWsConnected={isWsConnected}
        telemetry={telemetry}
        onConnectSerial={handleConnectSerial}
        onDisconnectSerial={handleDisconnectSerial}
        onConnectWs={handleConnectWs}
        onDisconnectWs={handleDisconnectWs}
      />

      {/* Vercel Publish & Deployment Modal */}
      <VercelPublishModal
        isOpen={isVercelModalOpen}
        onClose={() => setIsVercelModalOpen(false)}
      />
    </div>
  );
}
