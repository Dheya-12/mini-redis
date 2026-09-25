/**
 * "The three worlds" (WebGL, three.js).
 *
 * Three photographs sit on a ring 15 units wide, bent to it, and turn a quarter of the way as the section scrolls in.
 * The camera then pulls back and narrows (focal length 22.6 → 300) onto the front card until it fills the screen;
 * the next two worlds are uncovered over it from the bottom up, and the titles below follow (Mansions, Villas,
 * Penthouses) with a counter and a progress ring. Positions, focal lengths, offsets and the scroll ranges are the
 * original's; the scene is written here.
 */
import * as THREE from "three";
import { Flow } from "three/examples/jsm/modifiers/CurveModifier.js";
import { matches } from "@/lib/mq";
import { easings } from "@/behaviours/parallax/engine";
import { createRun } from "@/behaviours/parallax/engine";
import { contentAnimationOf, runAnimation } from "@/behaviours/contentAnimation";

const CARD_W = 5;
const CARD_H = (480 / 720) * 0.85 * 5;
const RING = 15;

type Config = {
  cameraPoints: { position: [number, number, number]; focalLength: number; rotation: [number, number, number] }[];
  viewOffset: number;
  progressMin: number;
  progressMax: number | null;
  extraSpaceAfterLastItem: number;
  cardOffsetOnLine: number;
  cardItemOffsetOnLine: number;
};
const DESKTOP: Config = {
  cameraPoints: [
    { position: [0, 0, -22], focalLength: 22.56276459333814, rotation: [-Math.PI, 0, 0] },
    { position: [0, 0.9, -57.4], focalLength: 300, rotation: [-Math.PI, 0, 0] },
  ],
  viewOffset: -0.15, progressMin: 0.15, progressMax: null, extraSpaceAfterLastItem: 0, cardOffsetOnLine: 0.16225, cardItemOffsetOnLine: 0.065,
};
const PHONE: Config = {
  cameraPoints: [
    { position: [0, 0, -22], focalLength: 22.56276459333814, rotation: [-Math.PI, 0, 0] },
    { position: [0, 1.25, -57.4], focalLength: 300, rotation: [-Math.PI, 0, 0] },
  ],
  viewOffset: -0.05, progressMin: 0.05, progressMax: 0.95, extraSpaceAfterLastItem: 25, cardOffsetOnLine: 0.43025 - 0.25, cardItemOffsetOnLine: 0.056,
};

/** a horizontal circle */
class Ring extends THREE.Curve<THREE.Vector3> {
  constructor() { super(); }
  getPoint(t: number, target = new THREE.Vector3()) {
    return target.set(Math.cos(t * Math.PI * 2) * RING, 0, Math.sin(t * Math.PI * 2) * RING);
  }
}

const WIPE_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
/** shows the texture up to a height (0 = nothing, 1 = everything) */
const WIPE_FRAGMENT = /* glsl */ `
uniform sampler2D map;
uniform float uProgress;
varying vec2 vUv;
void main() {
  if (uProgress < vUv.y) discard;
  gl_FragColor = texture2D(map, vUv);
}`;

const mixN = (a: number, b: number, t: number) => a + (b - a) * t;
/** maps v from [a, b] to [c, d], clamped */
const map = (v: number, a: number, b: number, c: number, d: number) => {
  const lo = Math.min(c, d), hi = Math.max(c, d);
  return Math.max(lo, Math.min(hi, ((v - a) / (b - a)) * (d - c) + c));
};
const PROGRESS_RING = 373.24566650390625;

export function initThreeWorlds(container: HTMLElement) {
  const sticky = container.closest<HTMLElement>(".sticky");
  if (!sticky) return () => {};
  const cfg = () => (matches("sm-down") ? PHONE : DESKTOP);
  const c0 = cfg();
  const images = [1, 3, 2].map((n) => `/media/landing/6.three-worlds/image-${n}@${matches("md-down") ? "xs" : "md"}.webp`);

  // ---- renderer, camera, scene
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setPixelRatio(2);
  container.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.fromArray(c0.cameraPoints[0].position);
  camera.rotation.set(...c0.cameraPoints[0].rotation, "XYZ");
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

  // ---- cards on the ring, and the wipes that uncover the next worlds
  const loader = new THREE.TextureLoader();
  const curve = new Ring();
  const flows: Flow[] = [];
  const cards = new THREE.Group();
  const wipes = new THREE.Group();
  const wipeItems: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  const disposables: { dispose: () => void }[] = [];
  images.forEach((url, t) => {
    const colour = loader.load(url, (tex) => { tex.colorSpace = THREE.SRGBColorSpace; });
    colour.colorSpace = THREE.SRGBColorSpace;
    const geometry = new THREE.PlaneGeometry(CARD_W, CARD_H, 10, 1);
    const material = new THREE.MeshBasicMaterial({ map: colour, side: THREE.DoubleSide });
    const flow = new Flow(new THREE.Mesh(geometry, material));
    flow.updateCurve(0, curve);
    flow.moveAlongCurve(t * c0.cardItemOffsetOnLine + c0.cardOffsetOnLine);
    cards.add(flow.object3D);
    flows.push(flow);
    disposables.push(geometry, material, (flow.object3D as THREE.Mesh).material as THREE.Material, colour);
    if (t < images.length - 1) {
      const raw = loader.load(url);
      const wm = new THREE.ShaderMaterial({ uniforms: { map: { value: raw }, uProgress: { value: 0 } }, vertexShader: WIPE_VERTEX, fragmentShader: WIPE_FRAGMENT, side: THREE.DoubleSide });
      const wg = new THREE.PlaneGeometry(CARD_W, CARD_H, 10, 1);
      const mesh = new THREE.Mesh(wg, wm);
      mesh.position.z = 0.01 * t - 15.02;
      mesh.scale.y = -1;
      mesh.visible = false;
      wipeItems.unshift(mesh);
      wipes.add(mesh);
      disposables.push(wg, wm, raw);
    }
  });
  scene.add(cards, wipes);

  // ---- scroll runs across the sticky frame
  const extra = c0.extraSpaceAfterLastItem;
  const run = createRun(sticky, { clamp: true, enableMq: null, frames: { "parallax-100-0": { progress: 0 }, "parallax--100-0": { progress: 1 }, "parallax--200-0": { progress: 2 }, [`parallax-${100 + extra}-100`]: { progress: 3 } } });
  const runImages = createRun(sticky, { clamp: true, enableMq: null, frames: { "parallax--250-0": { progress: 0 }, [`parallax-${100 + extra}-100`]: { progress: 1 } } });
  const runTexts = createRun(sticky, { clamp: true, enableMq: null, frames: { "parallax--200-0": { progress: 0 }, [`parallax-${150 + extra}-100`]: { progress: 1 } } });

  // ---- titles, counter and progress ring
  const titles = document.querySelector<HTMLElement>(".js-three-worlds-titles");
  const progress = document.querySelector<HTMLElement>(".js-three-worlds-explore-progress");
  const progressLine = document.querySelector<SVGElement>(".js-three-worlds-explore-progress-line");
  const counter = document.querySelector<HTMLElement>(".js-three-worlds-explore-counter");
  const progressTitle = document.querySelector<HTMLElement>(".js-three-worlds-explore-title");
  let cardIndex = -1;
  let progressVisible = false;
  const setCardIndex = (e: number) => {
    if (cardIndex !== e) {
      cardIndex = e;
      contentAnimationOf(titles)?.open(e);
      if (counter) counter.textContent = String(Math.max(1, e + 1));
    }
    const show = e >= 0;
    if (show !== progressVisible) {
      progressVisible = show;
      progress?.classList.toggle("l-three-worlds-sticky__explore-progress--hidden", !show);
      if (progressTitle) runAnimation(progressTitle, show ? "titleUp" : "titleUpOut", { direction: show ? 1 : -1 });
    }
  };

  const imageProgress = (e: number) => {
    const c = cfg();
    const aspect = size.height / size.width;
    const min = c.progressMin;
    return e * ((c.progressMax || 1 + min - Math.abs(aspect / 2 / ((480 / 720) * 0.85) - 1) + 0.1) - min) + min;
  };

  let lastTurn = 0;
  const frame = () => {
    const c = cfg();
    const s = parseFloat(run.group.values.progress ?? "0") || 0;
    const turn = easings.easeOutQuad(Math.min(1, s));
    const delta = turn - lastTurn;
    lastTurn = turn;
    if (delta) flows.forEach((f) => f.moveAlongCurve(-0.25 * delta));
    const zoom = Math.min(2, Math.max(1, s)) - 1;
    const r = easings.easeInOutQuad(easings.easeInQuad(zoom));
    const n = easings.easeInOutQuad(zoom);
    const [p0, p1] = c.cameraPoints;
    camera.position.y = mixN(p0.position[1], p1.position[1], n);
    camera.position.z = mixN(p0.position[2], p1.position[2], r);
    camera.setFocalLength(mixN(p0.focalLength, p1.focalLength, r));
    camera.setViewOffset(size.width, size.height, 0, (1 - n) * size.height * c.viewOffset, size.width, size.height);
    const g = runImages.group.ctx.position;
    const u = wipeItems.length;
    for (let e = 0; e < u; e++) {
      if (g > 0) wipeItems[e].material.uniforms.uProgress.value = imageProgress(map(g, e / u, (e + 1) / u, 0, 1));
      wipeItems[e].visible = g > 0;
    }
    const f = runTexts.group.ctx.position;
    setCardIndex(f === 0 ? -1 : Math.floor(f * u));
    progressLine?.style.setProperty("stroke-dashoffset", String(map(s, 2, 3, PROGRESS_RING, 0)));
    renderer.render(scene, camera);
  };

  // ---- render while on screen
  let visible = false;
  let raf = 0;
  const loop = () => { raf = visible ? requestAnimationFrame(loop) : 0; frame(); };
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible && !raf) raf = requestAnimationFrame(loop);
  });
  io.observe(container);

  return () => {
    visible = false;
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    run.destroy();
    runImages.destroy();
    runTexts.destroy();
    disposables.forEach((d) => d.dispose());
    renderer.dispose();
    renderer.domElement.remove();
  };
}
