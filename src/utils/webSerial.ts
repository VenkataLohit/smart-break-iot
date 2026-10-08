/**
 * Web Serial API utility for direct hardware connection to ESP32 / ESP32-C (ESP32-C3/S3)
 * Allows plug-and-play real-time telemetry streaming at 115200 baud directly into the browser!
 */

export interface SerialConnectionStatus {
  isConnected: boolean;
  portName?: string;
  baudRate: number;
  packetsReceived: number;
  lastPacketTime?: string;
  error?: string;
}

type TelemetryCallback = (data: any) => void;
type StatusCallback = (status: SerialConnectionStatus) => void;
type RawLineCallback = (line: string, direction: 'rx' | 'tx') => void;

class WebSerialManager {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private readableStreamClosed: any = null;
  private writableStreamClosed: any = null;
  private keepReading: boolean = false;
  private packetsCount: number = 0;
  private onTelemetry: TelemetryCallback | null = null;
  private onStatus: StatusCallback | null = null;
  private onRawLine: RawLineCallback | null = null;

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public setCallbacks(
    telemetryCb: TelemetryCallback, 
    statusCb: StatusCallback,
    rawLineCb?: RawLineCallback
  ) {
    this.onTelemetry = telemetryCb;
    this.onStatus = statusCb;
    if (rawLineCb) {
      this.onRawLine = rawLineCb;
    }
  }

  public setRawLineCallback(cb: RawLineCallback | null) {
    this.onRawLine = cb;
  }

  public async connect(baudRate: number = 115200): Promise<boolean> {
    if (!this.isSupported()) {
      if (this.onStatus) {
        this.onStatus({
          isConnected: false,
          baudRate,
          packetsReceived: 0,
          error: 'Web Serial API is not supported in this browser. Please use Google Chrome, Microsoft Edge, Brave, or Opera on desktop.',
        });
      }
      return false;
    }

    try {
      const nav = navigator as any;
      this.port = await nav.serial.requestPort();

      await this.port.open({ baudRate });
      this.keepReading = true;
      this.packetsCount = 0;

      // Set up writer for sending commands to ESP32
      const textEncoder = new TextEncoderStream();
      this.writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);
      this.writer = textEncoder.writable.getWriter();

      if (this.onStatus) {
        this.onStatus({
          isConnected: true,
          baudRate,
          packetsReceived: 0,
          portName: 'ESP32 Serial (USB CDC / UART)',
        });
      }

      if (this.onRawLine) {
        this.onRawLine(`[SYSTEM] Port opened successfully @ ${baudRate} baud. Listening for ESP32 JSON stream...`, 'rx');
      }

      this.readSerialLoop();
      return true;
    } catch (err: any) {
      if (this.onStatus) {
        this.onStatus({
          isConnected: false,
          baudRate,
          packetsReceived: this.packetsCount,
          error: err?.message || 'Connection cancelled or port already open in another application (close Arduino IDE Serial Monitor if open).',
        });
      }
      return false;
    }
  }

  public async send(text: string): Promise<boolean> {
    if (!this.writer || !this.port) return false;
    try {
      const payload = text.endsWith('\n') ? text : `${text}\n`;
      await this.writer.write(payload);
      if (this.onRawLine) {
        this.onRawLine(payload.trim(), 'tx');
      }
      return true;
    } catch (err) {
      console.error('Serial write error:', err);
      return false;
    }
  }

  private async readSerialLoop() {
    const textDecoder = new TextDecoderStream();
    this.readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    let buffer = '';

    try {
      while (this.keepReading) {
        const { value, done } = await this.reader.read();
        if (done) {
          break;
        }
        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;

            if (this.onRawLine) {
              this.onRawLine(cleanLine, 'rx');
            }

            if (cleanLine.startsWith('{') && cleanLine.endsWith('}')) {
              try {
                const parsed = JSON.parse(cleanLine);
                this.packetsCount++;
                if (this.onTelemetry) {
                  this.onTelemetry(parsed);
                }
                if (this.onStatus) {
                  this.onStatus({
                    isConnected: true,
                    baudRate: 115200,
                    packetsReceived: this.packetsCount,
                    portName: 'ESP32 Serial (USB CDC / UART)',
                    lastPacketTime: new Date().toLocaleTimeString(),
                  });
                }
              } catch {
                // partial or invalid JSON line
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('Serial read error:', err);
    } finally {
      this.disconnect();
    }
  }

  public async disconnect() {
    this.keepReading = false;
    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {}
      this.reader = null;
    }
    if (this.readableStreamClosed) {
      try {
        await this.readableStreamClosed.catch(() => {});
      } catch {}
      this.readableStreamClosed = null;
    }
    if (this.writer) {
      try {
        await this.writer.close();
      } catch {}
      this.writer = null;
    }
    if (this.writableStreamClosed) {
      try {
        await this.writableStreamClosed.catch(() => {});
      } catch {}
      this.writableStreamClosed = null;
    }
    if (this.port) {
      try {
        await this.port.close();
      } catch {}
      this.port = null;
    }

    if (this.onStatus) {
      this.onStatus({
        isConnected: false,
        baudRate: 115200,
        packetsReceived: this.packetsCount,
      });
    }

    if (this.onRawLine) {
      this.onRawLine('[SYSTEM] USB Port closed and released.', 'rx');
    }
  }
}

export const webSerialManager = new WebSerialManager();
