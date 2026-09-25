/**
 * Interface sound (desktop only), synthesised with Web Audio — the original ships no audio files.
 * Measured design:
 *  - master gain fades to 0.75 over 0.8 s when enabled, to 0 over 0.35 s when muted or the tab is hidden;
 *  - a soft ambient pad: five sine tones per 18 s cycle, 1.5 s attack, band-limited (120 Hz – 1.1 kHz),
 *    panned across the stereo field, with a short generated room reverb;
 *  - a click / hover tone: a sine that glides down 3 % into D4, E4 or F4 (by item), with a slightly detuned twin.
 * On the first home visit, a click anywhere during the "Click to enable sound" prompt switches it on.
 */
type Voice = { at: number; len: number; freq: number; pan: number; gain: number };
const PAD: Voice[] = [
  { at: 0.4, len: 6.4, freq: 220, pan: -0.92, gain: 0.05 },
  { at: 3.6, len: 5.6, freq: 349.23, pan: 0.9, gain: 0.036 },
  { at: 8, len: 6.2, freq: 130.81, pan: -0.62, gain: 0.044 },
  { at: 11.2, len: 5.2, freq: 440, pan: 0.94, gain: 0.026 },
  { at: 14.4, len: 3.2, freq: 174.61, pan: -0.35, gain: 0.03 },
];
const CYCLE = 18;
const NOTES = [293.66, 329.63, 349.23];

class InterfaceSound {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private room!: ConvolverNode;
  private ui!: BiquadFilterNode;
  private pad: { stop: () => void } | null = null;
  private button: HTMLButtonElement | null = null;
  private mq!: MediaQueryList;
  enabled = false;
  private last = { time: -Infinity, index: null as number | null };
  private clicks = 0;

  init() {
    this.button = document.querySelector<HTMLButtonElement>("[data-sound]");
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!this.button || !Ctor) return;
    this.mq = window.matchMedia("(max-width: 639px)");
    this.syncButton();
    this.button.addEventListener("click", async () => {
      if (this.phone()) return;
      this.enabled = !this.enabled;
      this.syncButton();
      this.fade();
      if (this.enabled) { window.dispatchEvent(new CustomEvent("sound_enabled")); await this.unlock(); this.click(); }
    });
    document.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || (e.target as Element)?.closest?.("[data-sound]")) return;
      if (this.enabled) this.click();
      this.unlock();
    }, { capture: true, passive: true });
    for (const ev of ["keydown", "wheel", "touchend", "pointerup"]) document.addEventListener(ev, () => this.unlock(), { capture: true, passive: true });
    document.addEventListener("visibilitychange", () => (document.hidden ? this.fade() : this.unlock()));
    this.mq.addEventListener("change", () => { this.syncButton(); this.fade(); });
    // first home visit: a click during the sound prompt turns sound on
    if (!this.phone() && document.querySelector(".gallery")) {
      const arm = (e: PointerEvent) => {
        if (e.button !== 0 || (e.target as Element)?.closest?.("[data-sound]")) return;
        this.enable();
        document.removeEventListener("pointerdown", arm, true);
      };
      document.addEventListener("pointerdown", arm, true);
      window.addEventListener("preloader_prompt_out", () => setTimeout(() => document.removeEventListener("pointerdown", arm, true), 1500), { once: true });
    }
  }

  private phone() { return this.mq?.matches ?? false; }

  private syncButton() {
    if (!this.button) return;
    this.button.hidden = this.phone();
    this.button.setAttribute("aria-pressed", String(this.enabled));
    this.button.setAttribute("aria-label", this.enabled ? "Mute sound" : "Enable sound");
  }

  enable() {
    if (this.phone()) return;
    const was = this.enabled;
    this.enabled = true;
    this.syncButton();
    this.unlock();
    if (!was) window.dispatchEvent(new CustomEvent("sound_enabled"));
  }

  private fade() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const g = this.master.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    const on = this.enabled && !document.hidden && !this.phone();
    g.linearRampToValueAtTime(on ? 0.75 : 0, now + (on ? 0.8 : 0.35));
  }

  async unlock() {
    if (!this.enabled || document.hidden || this.phone()) return;
    try {
      if (!this.ctx) this.build();
      if (this.ctx!.state !== "running") await this.ctx!.resume();
      if (this.ctx!.state === "running") { if (!this.pad) this.pad = this.startPad(); this.fade(); }
    } catch { /* autoplay policy: retried on the next gesture */ }
  }

  private build() {
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);
    // a 1.4 s stereo room: smoothed noise with a 30 ms onset and a cubic decay
    const len = Math.ceil(ctx.sampleRate * 1.4);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      let smooth = 0;
      for (let i = 0; i < len; i++) {
        smooth = smooth * 0.75 + (Math.random() * 2 - 1) * 0.25;
        data[i] = smooth * Math.min(1, i / (ctx.sampleRate * 0.03)) * (1 - i / len) ** 3;
      }
    }
    this.room = ctx.createConvolver();
    this.room.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.18;
    this.room.connect(wet).connect(this.master);
    this.ui = ctx.createBiquadFilter();
    this.ui.type = "lowpass";
    this.ui.frequency.value = 900;
    this.ui.Q.value = 0.4;
    this.ui.connect(this.master);
  }

  private startPad() {
    const ctx = this.ctx!;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 120;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1100;
    const bus = ctx.createGain();
    bus.gain.value = 0.85;
    hp.connect(lp).connect(bus).connect(this.master);
    const send = ctx.createGain();
    send.gain.value = 0.12;
    bus.connect(send).connect(this.room);
    const live = new Set<OscillatorNode>();
    let cycleStart = ctx.currentTime + 0.08;
    const voice = (t: number, v: Voice) => {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      const pan = ctx.createStereoPanner();
      osc.type = "sine";
      osc.frequency.value = v.freq;
      pan.pan.value = v.pan;
      const release = Math.min(1.8, v.len * 0.4);
      amp.gain.setValueAtTime(0, t);
      amp.gain.linearRampToValueAtTime(v.gain, t + 1.5);
      amp.gain.setValueAtTime(v.gain, t + Math.max(1.55, v.len - release));
      amp.gain.exponentialRampToValueAtTime(0.0001, t + v.len);
      osc.connect(amp).connect(pan).connect(hp);
      osc.onended = () => live.delete(osc);
      live.add(osc);
      osc.start(t);
      osc.stop(t + v.len + 0.02);
    };
    const schedule = () => { while (cycleStart < ctx.currentTime + CYCLE) { PAD.forEach((v) => voice(cycleStart + v.at, v)); cycleStart += CYCLE; } };
    schedule();
    const timer = window.setInterval(schedule, 700);
    return { stop: () => { clearInterval(timer); live.forEach((o) => { try { o.stop(); } catch { /* ended */ } }); hp.disconnect(); lp.disconnect(); bus.disconnect(); send.disconnect(); } };
  }

  click() {
    this.clicks += 1;
    this.play(this.clicks, true);
  }

  /** tone for item `index` (hovering images and titles); repeated triggers within 50 ms are ignored */
  play(index: number, isClick = false) {
    if (!this.enabled || document.hidden || this.phone()) return;
    if (!this.ctx || this.ctx.state !== "running") { this.unlock(); return; }
    const t = this.ctx.currentTime;
    if ((!isClick && index === this.last.index && t - this.last.time < 0.05) || (isClick && t - this.last.time < 0.02)) return;
    this.last = { time: t, index };
    const base = NOTES[Math.abs(index) % 3];
    for (const layer of [{ ratio: 1, gain: 0.12, decay: 0.2 }, { ratio: 1.006, gain: 0.04, decay: 0.18 }]) {
      const osc = this.ctx.createOscillator();
      const amp = this.ctx.createGain();
      const f = base * layer.ratio;
      osc.type = "sine";
      osc.frequency.setValueAtTime(f * 1.03, t);
      osc.frequency.exponentialRampToValueAtTime(f, t + 0.07);
      amp.gain.setValueAtTime(0, t);
      amp.gain.linearRampToValueAtTime(layer.gain, t + 0.02);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + layer.decay);
      osc.connect(amp).connect(this.ui);
      osc.onended = () => { osc.disconnect(); amp.disconnect(); };
      osc.start(t);
      osc.stop(t + layer.decay + 0.02);
    }
  }
}

export const sound = new InterfaceSound();
