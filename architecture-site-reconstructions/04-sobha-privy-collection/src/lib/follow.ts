/**
 * A value that follows its target by a share of the remaining distance each frame (the original's pointer, cursor and
 * progress smoothing). Works on a number or on a record of numbers; `onUpdate` receives each intermediate value.
 */
type Shape = number | Record<string, number>;

export class Follower<T extends Shape> {
  private value: T;
  private target: T;
  private raf = 0;
  constructor(initial: T, private strength: number, private onUpdate: (v: T) => void) {
    this.value = clone(initial);
    this.target = clone(initial);
  }
  get(): T { return this.value; }
  set(target: Partial<T> | T) {
    this.target = typeof target === "number" ? (target as T) : ({ ...(this.target as object), ...(target as object) } as T);
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
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
    const s = this.strength;
    let settled = true;
    const step = (v: number, t: number) => {
      const n = v + (t - v) * s;
      if (Math.abs(t - n) < 1e-4) return t;
      settled = false;
      return n;
    };
    if (typeof this.value === "number") this.value = step(this.value, this.target as number) as T;
    else {
      const next: Record<string, number> = {};
      for (const k of Object.keys(this.target as object)) next[k] = step((this.value as Record<string, number>)[k] ?? 0, (this.target as Record<string, number>)[k]);
      this.value = next as T;
    }
    this.onUpdate(this.value);
    if (!settled) this.raf = requestAnimationFrame(this.tick);
  };
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; }
}

const clone = <T extends Shape>(v: T): T => (typeof v === "number" ? v : ({ ...(v as Record<string, number>) } as T));
