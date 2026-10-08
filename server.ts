import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// In-memory Authoritative Telemetry State
let currentTelemetry = {
  car_status: 'off',
  speed: 0,
  distance: 5.8,
  motor: false,
  brake: false,
  obstacle: false,
  brake_mode: 'none',
  door_open: false,
  esp32_connected: true,
  wifi_rssi: -55,
  voltage: 11.9,
  current_draw: 0.1,
  timestamp: new Date().toLocaleTimeString(),
  motor_pwm: 0,
};

let alertEvents = [
  {
    id: 'alt-init-1',
    timestamp: '10:42:15',
    event: 'Obstacle detected within caution zone (3.2m)',
    type: 'warning',
    distance: 3.2,
    speed: 35,
    source: 'sensor',
  },
  {
    id: 'alt-init-2',
    timestamp: '10:42:18',
    event: 'Proximity violation (< 1.0m) - AUTOMATIC EMERGENCY BRAKE ENGAGED',
    type: 'critical',
    distance: 0.85,
    speed: 32,
    source: 'automatic_brake',
  },
];

const server = http.createServer(app);

// Attach WebSocket Server on /ws
const wss = new WebSocketServer({ server, path: '/ws' });

function broadcast(data: string) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

wss.on('connection', (ws: WebSocket) => {
  // Immediately dispatch current telemetry state on connection
  ws.send(JSON.stringify(currentTelemetry));

  ws.on('message', (message: string) => {
    try {
      const parsed = JSON.parse(message.toString());
      // Validate incoming data
      if (typeof parsed === 'object' && parsed !== null) {
        currentTelemetry = {
          ...currentTelemetry,
          ...parsed,
          timestamp: new Date().toLocaleTimeString(),
        };
        broadcast(JSON.stringify(currentTelemetry));
      }
    } catch {
      // Ignore invalid packet
    }
  });
});

// REST API Endpoints
app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    telemetry: currentTelemetry,
    connected_clients: wss.clients.size,
  });
});

app.get('/api/vehicle', (_req: Request, res: Response) => {
  res.json({
    vehicle_name: 'Auto Brake Prototype Mk-IV',
    controller: 'ESP32 NodeMCU-32S',
    sensor: 'HC-SR04 Ultrasonic Sensor',
    motor_driver: 'L298N Dual H-Bridge',
    communication: 'Wi-Fi 802.11 b/g/n & WebSockets',
    brake_system: 'Automatic Counter-EMF + Micro-Servo Clamp',
    project_type: 'IoT-Based Automatic Car Braking and Real-Time Monitoring',
    status: 'Connected',
  });
});

app.get('/api/alerts', (_req: Request, res: Response) => {
  res.json({ alerts: alertEvents });
});

// Endpoint for ESP32 or external test scripts to push telemetry over HTTP
app.post('/api/esp32/telemetry', (req: Request, res: Response) => {
  const { speed, distance, motor, brake, obstacle, car_status, brake_mode, wifi_rssi, door_open } = req.body;

  // Validate sensor bounds (Section 21: do not trust invalid sensor values)
  const validSpeed = typeof speed === 'number' && speed >= 0 && speed <= 120 ? speed : currentTelemetry.speed;
  const validDistance = typeof distance === 'number' && distance >= 0 && distance <= 20 ? distance : currentTelemetry.distance;

  currentTelemetry = {
    ...currentTelemetry,
    speed: validSpeed,
    distance: validDistance,
    motor: typeof motor === 'boolean' ? motor : currentTelemetry.motor,
    brake: typeof brake === 'boolean' ? brake : currentTelemetry.brake,
    obstacle: typeof obstacle === 'boolean' ? obstacle : currentTelemetry.obstacle,
    car_status: typeof car_status === 'string' ? car_status : currentTelemetry.car_status,
    brake_mode: typeof brake_mode === 'string' ? brake_mode : currentTelemetry.brake_mode,
    wifi_rssi: typeof wifi_rssi === 'number' ? wifi_rssi : currentTelemetry.wifi_rssi,
    door_open: typeof door_open === 'boolean' ? door_open : currentTelemetry.door_open,
    esp32_connected: true,
    timestamp: new Date().toLocaleTimeString(),
  };

  // Broadcast update to all connected digital twin browsers
  broadcast(JSON.stringify(currentTelemetry));

  res.json({ status: 'success', telemetry: currentTelemetry });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite middlewares in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(Number(port), '0.0.0.0', () => {
    console.log(`Auto Brake IoT Server running on http://0.0.0.0:${port}`);
    console.log(`WebSocket server active on ws://0.0.0.0:${port}/ws`);
  });
}

startServer();
