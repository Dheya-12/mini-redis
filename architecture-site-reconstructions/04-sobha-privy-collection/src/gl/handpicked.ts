/**
 * "Handpicked" gallery (WebGL, three.js).
 *
 * Thirteen photographs bent around the same 15-unit ring, fading towards its far side, tilted by the pointer's height
 * and drifting with its sideways movement. Scrolling through the section carries the camera along five keyframes
 * (eased through a cardinal spline) and turns the ring by half a card per unit of progress; the view slides up
 * as the section arrives and away as it leaves. Keyframes, ranges and factors are the original's.
 */
import * as THREE from "three";
import { Flow } from "three/examples/jsm/modifiers/CurveModifier.js";
import { matches } from "@/lib/mq";
import { createRun, easings } from "@/behaviours/parallax/engine";
import { createApp, Ring, CARD, Keyframes, mapRange, pointer } from "./app";

type Key = { position: [number, number, number]; rotation: [number, number, number] };
const deg = Math.PI / 180;
const DESKTOP: Key[] = [
  { position: [2.5, 0.4, -25], rotation: [-148.52 * deg, 5.29 * deg, -29.75 * deg] },
  { position: [2.5, 2.4, -25], rotation: [-148.52 * deg, 5.29 * deg, -29.75 * deg] },
  { position: [0, 0.4, -21], rotation: [-180 * deg, 0, 13.75 * deg] },
  { position: [0, 0.25, -20], rotation: [-180 * deg, 0, -8 * deg] },
  { position: [0, 0.25, -20], rotation: [-180 * deg, 0, -8 * deg] },
];
const PHONE: Key[] = [
  { position: [2.5, 0.6, -25], rotation: [-148.52 * deg, 5.29 * deg, -29.75 * deg] },
  { position: [2.5, 0.6, -25], rotation: [-148.52 * deg, 5.29 * deg, -29.75 * deg] },
  { position: [0, 0.6, -21], rotation: [-180 * deg, 0, 13.75 * deg] },
  { position: [0, -0.1, -20], rotation: [-180 * deg, 0, -8 * deg] },
  { position: [0, -0.1, -20], rotation: [-180 * deg, 0, -8 * deg] },
];

export function initHandpicked(container: HTMLElement) {
  const sticky = container.closest<HTMLElement>(".sticky");
  const section = container.closest<HTMLElement>(".section");
  if (!sticky || !section) return () => {};
  const phone = matches("sm-down");
  const keys = phone ? PHONE : DESKTOP;
  const small = matches("md-down");
  const images = small
    ? [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 1].map((n) => `/media/landing/9.handpicked-carousel/image-gallery-${n}@xs.webp`)
    : Array.from({ length: 13 }, (_, i) => `/media/landing/9.handpicked-carousel/image-gallery-${i + 1}@md.webp`);

  const app = createApp(container, { fov: 45, far: 100, position: keys[0].position, rotation: keys[0].rotation });
  const curves = {
    position: [0, 1, 2].map((a) => new Keyframes(keys.map((k) => k.position[a]))),
    rotation: [0, 1, 2].map((a) => new Keyframes(keys.map((k) => k.rotation[a]))),
  };
  const mouse = pointer(0.01);

  const ring = new Ring();
  const cards = new THREE.Group();
  const flows: { flow: Flow; material: THREE.MeshBasicMaterial }[] = [];
  images.forEach((url, t) => {
    const map = app.loader.load(url, (tex) => { tex.colorSpace = THREE.SRGBColorSpace; });
    map.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map, side: THREE.DoubleSide, transparent: true });
    const geometry = new THREE.PlaneGeometry(CARD.width, CARD.height, 10, 1);
    const flow = new Flow(new THREE.Mesh(geometry, material));
    // Flow renders a copy of the material (bent by its shader): that copy is the one to fade
    const shown = (flow.object3D as THREE.Mesh).material as THREE.MeshBasicMaterial;
    flow.updateCurve(0, ring);
    flow.moveAlongCurve(t / images.length);
    cards.add(flow.object3D);
    if (t === 10) shown.opacity = 0.25;
    flows.push({ flow, material: shown });
    app.disposables.push(geometry, material, shown, map);
  });
  app.scene.add(cards);

  const run = createRun(sticky, { clamp: true, enableMq: null, mobileSmooth: true, frames: { "parallax-100-0": { progress: 0 }, "parallax-0-100": { progress: 1 } } });
  const runStart = createRun(sticky, { clamp: true, enableMq: null, mobileSmooth: true, frames: { "parallax-50-0": { progress: 0 }, "parallax-0-0": { progress: 1 } } });
  const runEnd = createRun(section, { clamp: true, enableMq: null, mobileSmooth: true, frames: { "parallax-150-100": { progress: 0 }, "parallax-100-100": { progress: 1 } } });

  let last = 0;
  app.onFrame((dt) => {
    mouse.update(dt);
    cards.rotation.x = -0.05 * (mouse.state.y - 0.5);
    const t = run.group.ctx.position;
    const step = t - last;
    last = t;
    const h = app.size.height;
    const arrive = (easings.easeSectionInverse(runStart.group.ctx.position) - 1) * h * 0.25;
    const leave = easings.easeSectionInverse(runEnd.group.ctx.position) * h * 0.25;
    app.camera.setViewOffset(app.size.width, h, 0, -arrive + leave, app.size.width, h);
    app.camera.position.set(curves.position[0].at(t), curves.position[1].at(t), curves.position[2].at(t));
    app.camera.rotation.set(curves.rotation[0].at(t), curves.rotation[1].at(t), curves.rotation[2].at(t));
    for (const { flow, material } of flows) {
      flow.moveAlongCurve(dt * mouse.state.dx * 0.003 + 0.5 * step);
      material.opacity = mapRange(Math.abs(flow.uniforms.pathOffset.value - 0.5), 0.15, 0.5, 0.25, 1);
    }
  });

  return () => { run.destroy(); runStart.destroy(); runEnd.destroy(); mouse.dispose(); app.dispose(); };
}
