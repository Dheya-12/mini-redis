/**
 * The frame shared by the WebGL scenes: a transparent renderer at twice the pixel density (as on the original), a
 * perspective camera, a scene sized to its container, and a render loop that runs only while the container is on
 * screen. `onFrame` callbacks (before rendering) and `afterFrame` callbacks receive the time since the previous frame
 * (ms, at most 60).
 */
import * as THREE from "three";

export type AppOptions = {
  fov?: number;
  near?: number;
  far?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** a see-through canvas (default); opaque scenes clear to black */
  alpha?: boolean;
  logarithmicDepthBuffer?: boolean;
};

export function createApp(container: HTMLElement, o: AppOptions = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: o.alpha ?? true, logarithmicDepthBuffer: !!o.logarithmicDepthBuffer });
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setPixelRatio(2);
  container.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(o.fov ?? 45, 1, o.near ?? 0.1, o.far ?? 1000);
  camera.position.fromArray(o.position ?? [1, 1, 1]);
  camera.rotation.set(...(o.rotation ?? [0, 0, 0]), "XYZ");
  const size = { width: 0, height: 0 };
  const resize = () => {
    size.width = container.clientWidth || window.innerWidth;
    size.height = container.clientHeight || window.innerHeight;
    renderer.setSize(size.width, size.height);
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  const frames: ((dt: number) => void)[] = [];
  const afterFrames: ((dt: number) => void)[] = [];
  let visible = false;
  let raf = 0;
  let last = performance.now() - 16;
  const loop = () => {
    raf = visible ? requestAnimationFrame(loop) : 0;
    const now = performance.now();
    const dt = Math.min(now - last, 60);
    last = now;
    frames.forEach((f) => f(dt));
    renderer.render(scene, camera);
    afterFrames.forEach((f) => f(dt));
  };
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible && !raf) { last = performance.now() - 16; raf = requestAnimationFrame(loop); }
  });
  io.observe(container);
  const onVisibility = () => { if (!document.hidden) last = performance.now() - 16; };
  document.addEventListener("visibilitychange", onVisibility);

  const loader = new THREE.TextureLoader();
  const disposables: { dispose: () => void }[] = [];
  return {
    renderer, scene, camera, size, loader, disposables,
    onFrame: (f: (dt: number) => void) => frames.push(f),
    afterFrame: (f: (dt: number) => void) => afterFrames.push(f),
    dispose() {
      visible = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

/** the ring the cards are bent to: a horizontal circle, 15 units across */
export class Ring extends THREE.Curve<THREE.Vector3> {
  constructor(private radius = 15) { super(); }
  getPoint(t: number, target = new THREE.Vector3()) {
    return target.set(Math.cos(t * Math.PI * 2) * this.radius, 0, Math.sin(t * Math.PI * 2) * this.radius);
  }
}

/** a card's size on the ring */
export const CARD = { width: 5, height: (480 / 720) * 0.85 * 5 };

/**
 * A value that eases through keyframes: a cardinal spline (tension 0.5) through evenly spaced values, sampled
 * 25 times per span and read back with linear interpolation. Position 0..1 covers all keyframes.
 */
export class Keyframes {
  private samples: { x: number; y: number }[];
  constructor(values: number[], tension = 0.5, perSpan = 25) {
    const n = values.length;
    const pts = values.map((y, x) => ({ x, y }));
    const at = (i: number) => pts[Math.max(0, Math.min(n - 1, i))];
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i < n - 1; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      const t1x = (p2.x - p0.x) * tension, t1y = (p2.y - p0.y) * tension;
      const t2x = (p3.x - p1.x) * tension, t2y = (p3.y - p1.y) * tension;
      for (let k = 0; k < perSpan; k++) {
        const s = k / perSpan, s2 = s * s, s3 = s2 * s;
        const h1 = 2 * s3 - 3 * s2 + 1, h2 = -2 * s3 + 3 * s2, h3 = s3 - 2 * s2 + s, h4 = s3 - s2;
        out.push({ x: (h1 * p1.x + h2 * p2.x + h3 * t1x + h4 * t2x) / (n - 1), y: h1 * p1.y + h2 * p2.y + h3 * t1y + h4 * t2y });
      }
    }
    out.push({ x: 1, y: values[n - 1] });
    this.samples = out;
  }
  at(position: number) {
    const t = Math.max(0, Math.min(1, position));
    const s = this.samples;
    for (let i = 0; i < s.length - 1; i++) {
      if (s[i].x === t) return s[i].y;
      if (s[i + 1].x === t) return s[i + 1].y;
      if (s[i].x < t && t <= s[i + 1].x) return s[i].y + (s[i + 1].y - s[i].y) * ((t - s[i].x) / (s[i + 1].x - s[i].x));
    }
    return 0;
  }
}

/** maps v from [a, b] to [c, d] (clamped) */
export const mapRange = (v: number, a: number, b: number, c: number, d: number) => {
  const lo = Math.min(c, d), hi = Math.max(c, d);
  return Math.max(lo, Math.min(hi, ((v - a) / (b - a)) * (d - c) + c));
};

/**
 * Eases a value towards its target as the original does: each frame covers `strength × dt / 16` of the remaining
 * distance (dt in ms), never overshooting, and snaps once within `precision`.
 */
export function approach(value: number, target: number, strength: number, dt: number, precision = 0.001) {
  if (Math.abs(target - value) < precision) return target;
  const next = value + (target - value) * ((strength * (dt || 16)) / 16);
  return value < target ? Math.min(target, next) : Math.max(target, next);
}

/**
 * The pointer across the window (0..1), eased by `strength` per frame. Like the original, the eased value starts at 0
 * and jumps to the pointer on its first movement; touches park it in the middle.
 */
export function pointer(strength: number) {
  const state = { x: 0, y: 0, tx: 0, ty: 0, dx: 0, set: false, touching: false };
  let lastX = 0;
  const move = (e: PointerEvent) => {
    if (state.touching || e.pointerType === "touch") return;
    const x = e.clientX / window.innerWidth, y = e.clientY / window.innerHeight;
    if (!state.set) { state.x = state.tx = lastX = x; state.y = state.ty = y; state.set = true; }
    else { state.tx = x; state.ty = y; }
  };
  const touch = () => { state.touching = true; state.set = false; state.x = state.tx = lastX = 0.5; state.y = state.ty = 0.5; };
  let timer = 0;
  const release = () => { clearTimeout(timer); timer = window.setTimeout(() => { state.touching = false; }, 500); };
  window.addEventListener("pointermove", move);
  window.addEventListener("touchstart", touch);
  window.addEventListener("touchend", release);
  window.addEventListener("touchcancel", release);
  return {
    state,
    update(dt: number) {
      state.x = approach(state.x, state.tx, strength, dt);
      state.y = approach(state.y, state.ty, strength, dt);
      state.dx = state.x - lastX;
      lastX = state.x;
    },
    dispose() {
      clearTimeout(timer);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("touchstart", touch);
      window.removeEventListener("touchend", release);
      window.removeEventListener("touchcancel", release);
    },
  };
}
