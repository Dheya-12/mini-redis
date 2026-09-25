/** A camera frame is an SVG viewBox: [x, y, width, height]. */
export type ViewBox = [number, number, number, number];

export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
/** 0 at `lo` → 1 at `hi`, clamped. */
export const ramp = (w: number, lo: number, hi: number) => clamp((w - lo) / (hi - lo), 0, 1);

export const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
/** Symmetric power ease: gentle start, fast middle, long settle. */
export const easeInOutPow = (t: number, a: number) =>
  t < 0.5 ? Math.pow(2 * t, a) / 2 : 1 - Math.pow(2 * (1 - t), a) / 2;

export type CameraPath = { length: number; at(t: number): ViewBox };

/**
 * Smooth zoom-and-pan between two frames (van Wijk & Nuij, "Smooth and efficient zooming
 * and panning", 2003): a single arc-length-uniform path that zooms out while panning and
 * keeps the destination framed throughout. `length` is the path's perceptual length.
 */
export function cameraPath(from: ViewBox, to: ViewBox): CameraPath {
  const rho = Math.SQRT2;
  const c0 = [from[0] + from[2] / 2, from[1] + from[3] / 2];
  const c1 = [to[0] + to[2] / 2, to[1] + to[3] / 2];
  const w0 = from[2];
  const w1 = to[2];
  const aspect0 = from[3] / from[2];
  const aspect1 = to[3] / to[2];
  const dx = c1[0] - c0[0];
  const dy = c1[1] - c0[1];
  const d2 = dx * dx + dy * dy;

  let length: number;
  let centreAndWidth: (t: number) => [number, number, number];

  if (d2 < 1e-9) {
    // Pure zoom.
    length = Math.abs(Math.log(w1 / w0)) / rho;
    centreAndWidth = (t) => [c0[0], c0[1], w0 * Math.pow(w1 / w0, t)];
  } else {
    const d1 = Math.sqrt(d2);
    const b0 = (w1 * w1 - w0 * w0 + rho ** 4 * d2) / (2 * w0 * rho ** 2 * d1);
    const b1 = (w1 * w1 - w0 * w0 - rho ** 4 * d2) / (2 * w1 * rho ** 2 * d1);
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
    const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
    length = (r1 - r0) / rho;
    const coshR0 = Math.cosh(r0);
    const sinhR0 = Math.sinh(r0);
    centreAndWidth = (t) => {
      const s = t * length;
      const u = (w0 / rho ** 2) * (coshR0 * Math.tanh(r0 + rho * s) - sinhR0);
      const k = u / d1;
      return [c0[0] + k * dx, c0[1] + k * dy, (w0 * coshR0) / Math.cosh(r0 + rho * s)];
    };
  }

  return {
    length,
    at(t) {
      const [cx, cy, w] = centreAndWidth(t);
      const h = w * (aspect0 + (aspect1 - aspect0) * t);
      return [cx - w / 2, cy - h / 2, w, h];
    },
  };
}

/**
 * Marker size curves: [camera width, on-screen radius px], interpolated in log-log space
 * so growth is a smooth power law between anchors.
 */
export const MARKER_CURVES = {
  amenity: [
    [500, 1.5],
    [80, 24],
    [0.88, 1600],
  ],
  station: [
    [2000, 6],
    [500, 6],
    [80, 3],
  ],
  busStop: [
    [2000, 5],
    [500, 5],
    [80, 2],
  ],
} as const satisfies Record<string, readonly (readonly [number, number])[]>;

export function markerRadius(curve: readonly (readonly [number, number])[], w: number) {
  if (w >= curve[0][0]) return curve[0][1];
  const last = curve[curve.length - 1];
  if (w <= last[0]) return last[1];
  const lw = Math.log(w);
  for (let i = 0; i < curve.length - 1; i++) {
    const [w0, r0] = curve[i];
    const [w1, r1] = curve[i + 1];
    if (w <= w0 && w >= w1) {
      const t = (lw - Math.log(w0)) / (Math.log(w1) - Math.log(w0));
      return Math.exp(Math.log(r0) + (Math.log(r1) - Math.log(r0)) * t);
    }
  }
  return last[1];
}
