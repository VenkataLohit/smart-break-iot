/**
 * Web Audio API synthesizer for Automotive ADAS Collision Warning and Brake Alerts
 */
class SoundEffects {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private lastBeepTime: number = 0;

  constructor() {
    // Lazy initialize upon first user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(val: boolean) {
    this.isEnabled = val;
  }

  // Double high-pitch warning beep for imminent obstacle
  public playObstacleWarning(urgency: 'caution' | 'warning' | 'danger') {
    if (!this.isEnabled) return;
    const now = Date.now();
    const interval = urgency === 'danger' ? 250 : urgency === 'warning' ? 500 : 1000;
    if (now - this.lastBeepTime < interval) return;
    this.lastBeepTime = now;

    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      const freq = urgency === 'danger' ? 1400 : urgency === 'warning' ? 950 : 650;
      osc.type = urgency === 'danger' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(urgency === 'danger' ? 0.35 : 0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.16);
    } catch {
      // Audio might fail if user hasn't interacted yet
    }
  }

  // Low tone brake actuator sound
  public playBrakeActuation() {
    if (!this.isEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch {
      // ignore
    }
  }

  // Engine start hum
  public playEngineStart() {
    if (!this.isEnabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.7);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.75);
    } catch {
      // ignore
    }
  }
}

export const soundEffects = new SoundEffects();
