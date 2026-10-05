/* Synthesisierte Sound-Effekte (keine Audiodateien nötig) */

type Mat = "stone" | "dirt" | "wood" | "glass" | "sand" | "plant" | "liquid";

export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  enabled = true;

  resume() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      const len = Math.floor(this.ctx.sampleRate * 0.4);
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(v ? 0.5 : 0, this.ctx.currentTime, 0.02);
  }

  private noiseBurst(freq: number, q: number, dur: number, gain: number, type: BiquadFilterType = "bandpass") {
    if (!this.enabled || !this.ctx || !this.master || !this.noise) return;
    const t = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.5;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq * (0.9 + Math.random() * 0.25);
    f.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random() * 0.2);
    src.stop(t + dur + 0.02);
  }

  private tone(freq: number, dur: number, gain: number, type: OscillatorType = "square", slide = 0) {
    if (!this.enabled || !this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  private mat(m: Mat) {
    switch (m) {
      case "stone": return [900, 1.4, 0.17] as const;
      case "dirt": return [360, 1.0, 0.14] as const;
      case "wood": return [620, 2.2, 0.16] as const;
      case "glass": return [3200, 0.9, 0.13] as const;
      case "sand": return [1500, 0.8, 0.11] as const;
      case "plant": return [2300, 0.7, 0.08] as const;
      default: return [700, 1.0, 0.14] as const;
    }
  }

  dig(m: Mat) {
    const [f, q, d] = this.mat(m);
    this.noiseBurst(f, q, d, 0.5);
    if (m === "glass") this.tone(2100, 0.09, 0.08, "triangle");
    if (m === "liquid") this.tone(420, 0.2, 0.16, "sine", -240);
  }

  place(m: Mat) {
    const [f, q] = this.mat(m);
    this.noiseBurst(f * 1.15, q, 0.1, 0.4);
    this.tone(m === "wood" ? 240 : 160, 0.07, 0.09, "square");
  }

  step(m: Mat) {
    const [f, q] = this.mat(m);
    this.noiseBurst(f * 0.85, q, 0.07, 0.13);
  }

  jump() {
    this.noiseBurst(500, 1, 0.06, 0.1);
  }

  land(v: number) {
    this.noiseBurst(220, 0.9, 0.1, Math.min(0.3, 0.06 + v * 0.02));
  }

  splash() {
    this.noiseBurst(1100, 0.5, 0.35, 0.3, "lowpass");
    this.tone(300, 0.25, 0.1, "sine", -120);
  }

  ui(up = true) {
    this.tone(up ? 520 : 380, 0.06, 0.07, "square");
  }
}

export const sfx = new Sfx();
