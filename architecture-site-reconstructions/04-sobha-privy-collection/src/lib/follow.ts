/**
 * A value that follows its target (the original's pointer, cursor and progress smoothing): each frame covers
 * `strength × elapsed / 16 ms` of the remaining distance, never overshooting, and snaps once within 0.001.
 * Works on a number or on a record of numbers; `onUpdate` receives each intermediate value.
 */
type Shape = number | Record<string, number>;

export class Follower<T extends Shape> {
  private value: T;
  private target: T;
  private raf = 0;
  private last = 0;
  constructor(initial: T, private strength: number, private onUpdate: (v: T) => void) {
    this.value = clone(initial);
    this.target = clone(initial);
  }
  get(): T { return this.value; }
  set(target: Partial<T> | T) {
    this.target = typeof target === "number" ? (target as T) : ({ ...(this.target as object), ...(target as object) } as T);
    if (!this.raf) { this.last = performance.now(); this.raf = requestAnimationFrame(this.tick); }
  }
  /** jumps to the target at once */
  jump(target: T) {
    this.stop();
    this.value = clone(target);
    this.target = clone(target);
    this.onUpdate(this.value);
  }
  private tick = () => {
    this.raf = 0;
    const now = performance.now();
    const k = (this.strength * (now - this.last || 16)) / 16;
    this.last = now;
    let settled = true;
    const step = (v: number, t: number) => {
      if (Math.abs(t - v) < 0.001) return t;
      const n = v + (t - v) * k;
      settled = false;
      return v < t ? Math.min(t, n) : Math.max(t, n);
    };
    if (typeof this.value === "number") this.value = step(this.value, this.target as number) as T;
    else {
      const next: Record<string, number> = {};
      for (const key of Object.keys(this.target as object)) next[key] = step((this.value as Record<string, number>)[key] ?? 0, (this.target as Record<string, number>)[key]);
      this.value = next as T;
    }
    this.onUpdate(this.value);
    if (!settled) this.raf = requestAnimationFrame(this.tick);
  };
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; }
}

const clone = <T extends Shape>(v: T): T => (typeof v === "number" ? v : ({ ...(v as Record<string, number>) } as T));
