/**
 * "Location" (WebGL, three.js): the 3D map of Dubai.
 *
 * The original's city model (glTF with AVIF textures and two point lights) is lit by a room environment and seen
 * through a narrow lens (11.42°). Scrolling through the sticky frame flies the camera along four viewpoints stored in
 * the model (on phones, four fixed ones), eased through a cardinal spline and smoothed 15 % per frame; the pointer's
 * horizontal position swings the camera ±5° around its target. Volumetric clouds hang over the first viewpoints and
 * clear after 40 % of the flight; from 20 % the landmark pins (HTML, projected from the model) appear one after
 * another. A pin that opens a modal stays lit while its modal is open, and the other pins step back.
 *
 * Positions, ranges, factors and cloud settings are the original's; the scene code and shaders are written here (the
 * cloud raymarcher follows three.js's MIT-licensed `webgl_volume_cloud` example, as the original's does).
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise.js";
import { matches } from "@/lib/mq";
import { createRun } from "@/behaviours/parallax/engine";
import { createApp, Keyframes, pointer, approach } from "./app";

const MODEL = "/webgl/location/model.gltf";

/** landmark meshes and the pins that mark them (stagger: order of appearance, 75 ms apart) */
const PINS: { mesh: string; element: string; stagger?: number }[] = [
  { mesh: "SOBHA_Objects_SeaHeaven", element: ".js-pin-seaheaven", stagger: 0 },
  { mesh: "SOBHA_Objects_S_Tower", element: ".js-pin-s-tower", stagger: 1 },
  { mesh: "SOBHA_Objects_Sobha_Realty", element: ".js-pin-sobha-realty" },
  { mesh: "SOBHA_Objects_Siniya_Island", element: ".js-pin-siniya-island" },
  { mesh: "Burj_Halifa_1", element: ".js-pin-burj-halifa" },
  { mesh: "Dubai_Mall_1", element: ".js-pin-dubai-mall" },
  { mesh: "Burj_AL_Arab_Sail_1", element: ".js-pin-burj-al-arab-sail", stagger: 3 },
  { mesh: "Ippodrome_1", element: ".js-pin-ippodrome" },
  { mesh: "FRAME_1", element: ".js-pin-frame" },
  { mesh: "Museum_Future", element: ".js-pin-museum-future" },
  { mesh: "Ain_Dubai_Devil_Wheel_1", element: ".js-pin-ain-dubai-devil-wheel", stagger: 2 },
  { mesh: "Ras_Al_Khor_Wildlife_Sanctuary", element: ".js-pin-ras-al-khor-wildlife-sanctuary", stagger: 0 },
  { mesh: "Dubai_Harbour", element: ".js-pin-dubai-harbour", stagger: 0 },
  { mesh: "Palm_Jumeirah", element: ".js-pin-palm-jumeirah", stagger: 4 },
];

type View = { position: [number, number, number]; lookAt: [number, number, number] };
/** phones fly a path of their own (desktop's comes from the model's Camera_Position_N / Target_Position_N nodes) */
const PHONE_PATH: View[] = [
  { position: [-152.69979858398438, 451.6778259277344, 519.029052734375], lookAt: [-26.60472297668457, 0, -54.50779724121094] },
  { position: [-110.42467498779297, 210.0479278564453, 311.63323974609375], lookAt: [-110.10267639160156, 0, -28.730846405029297] },
  { position: [262.3120422363281, 127.9754943847656, 216.70069885253906], lookAt: [53.188697814941406, 0, -123.73531341552734] },
  { position: [90.66888427734375, 143.09762573242188, 30.883031845092773], lookAt: [141.3771514892578, 0, -289.6700744628906] },
];

/** cloud volumes over the opening viewpoints (steps halve on phones) */
const CLOUDS = [
  { position: [-110, 300, 360], scale: [40, 10, 40], opacity: 0.35, steps: 20 },
  { position: [-160, 370, 440], scale: [97, 40, 55], steps: 30 },
  { position: [-170, 230, 190], scale: [70, 30, 80], opacity: 0.35, steps: 20 },
  { position: [0, 150, 80], scale: [230, 30, 120], opacity: 0.15, steps: 20 },
  { position: [-1, 180, 230], scale: [230, 30, 120], opacity: 0.2, steps: 20 },
] as const;

// ---------------------------------------------------------------- clouds

/** a 128³ density field: stretched Perlin noise, fading out towards the edges of the box */
function cloudTexture() {
  const size = 128;
  const data = new Uint8Array(size * size * size);
  const noise = new ImprovedNoise();
  const v = new THREE.Vector3();
  let i = 0;
  for (let z = 0; z < size; z++)
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const d = 1 - v.set(x, y, z).subScalar(size / 2).divideScalar(size).length();
        data[i++] = (128 + 128 * noise.noise((x * 0.05) / 1.5, y * 0.05, (z * 0.05) / 1.5)) * d * d;
      }
  const tex = new THREE.Data3DTexture(data, size, size, size);
  tex.format = THREE.RedFormat;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}

const CLOUD_VERTEX = /* glsl */ `
uniform vec3 cameraPos;
varying vec3 vOrigin;
varying vec3 vDirection;
#include <common>
#include <logdepthbuf_pars_vertex>
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vOrigin = vec3(inverse(modelMatrix) * vec4(cameraPos, 1.0)).xyz;
  vDirection = position - vOrigin;
  gl_Position = projectionMatrix * mvPosition;
  #include <logdepthbuf_vertex>
}`;

/** marches the ray through the unit box, accumulating density; jittered per pixel and frame */
const CLOUD_FRAGMENT = /* glsl */ `
precision highp sampler3D;
varying vec3 vOrigin;
varying vec3 vDirection;
uniform vec3 base;
uniform sampler3D map;
uniform float threshold;
uniform float range;
uniform float opacity;
uniform float steps;
uniform float frame;
#include <common>
#include <logdepthbuf_pars_fragment>

uint hash(uint s) {
  s = (s ^ 61u) ^ (s >> 16u);
  s *= 9u;
  s = s ^ (s >> 4u);
  s *= 0x27d4eb2du;
  s = s ^ (s >> 15u);
  return s;
}

vec2 hitBox(vec3 orig, vec3 dir) {
  vec3 inv = 1.0 / dir;
  vec3 a = (vec3(-0.5) - orig) * inv;
  vec3 b = (vec3(0.5) - orig) * inv;
  vec3 lo = min(a, b);
  vec3 hi = max(a, b);
  return vec2(max(lo.x, max(lo.y, lo.z)), min(hi.x, min(hi.y, hi.z)));
}

float density(vec3 p) { return texture(map, p).r; }
float shade(vec3 p) { return density(p + vec3(-0.01)) - density(p + vec3(0.01)); }

vec4 toSRGB(vec4 c) {
  return vec4(mix(pow(c.rgb, vec3(0.41666)) * 1.055 - vec3(0.055), c.rgb * 12.92, vec3(lessThanEqual(c.rgb, vec3(0.0031308)))), c.a);
}

void main() {
  #include <logdepthbuf_fragment>
  vec3 dir = normalize(vDirection);
  vec2 bounds = hitBox(vOrigin, dir);
  if (bounds.x > bounds.y) discard;
  bounds.x = max(bounds.x, 0.0);
  vec3 p = vOrigin + bounds.x * dir;
  vec3 inc = 1.0 / abs(dir);
  float delta = min(inc.x, min(inc.y, inc.z)) / steps;
  uint seed = uint(gl_FragCoord.x) * 1973u + uint(gl_FragCoord.y) * 9277u + uint(frame) * 26699u;
  float jitter = float(hash(seed)) / 4294967296.0 * 2.0 - 1.0;
  p += dir * jitter * (1.0 / vec3(textureSize(map, 0)));
  vec4 ac = vec4(base, 0.0);
  for (float t = bounds.x; t < bounds.y; t += delta) {
    float d = smoothstep(threshold - range, threshold + range, density(p + 0.5)) * opacity;
    float col = shade(p + 0.5) * 3.0 + (p.x + p.y) * 0.25 + 0.2;
    ac.rgb += (1.0 - ac.a) * d * col;
    ac.a += (1.0 - ac.a) * d;
    if (ac.a >= 0.95) break;
    p += dir * delta;
  }
  gl_FragColor = toSRGB(ac);
  if (gl_FragColor.a == 0.0) discard;
}`;

function cloud(map: THREE.Data3DTexture, o: { position: readonly number[]; scale: readonly number[]; opacity?: number; steps: number }) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      base: { value: new THREE.Color(0x7e7e7e) },
      map: { value: map },
      cameraPos: { value: new THREE.Vector3() },
      threshold: { value: 0.25 },
      opacity: { value: o.opacity ?? 0.28 },
      range: { value: 0.1 },
      steps: { value: o.steps },
      frame: { value: 0 },
    },
    vertexShader: CLOUD_VERTEX,
    fragmentShader: CLOUD_FRAGMENT,
    side: THREE.BackSide,
    transparent: true,
  });
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  mesh.name = "clouds";
  mesh.scale.fromArray(o.scale as number[]);
  mesh.position.fromArray(o.position as number[]);
  return mesh;
}

// ---------------------------------------------------------------- pins

class Pin {
  active = false;
  visible: boolean;
  private timer = 0;
  private off: () => void = () => {};
  constructor(readonly el: HTMLElement, readonly point: THREE.Vector3, readonly stagger: number, onActive: (pin: Pin, active: boolean) => void) {
    this.visible = !el.classList.contains("location-pin--hidden");
    const href = el.getAttribute("href");
    const target = href?.startsWith("#") ? document.getElementById(href.slice(1)) : null;
    if (target?.classList.contains("modal")) {
      const open = () => { this.setActive(true); onActive(this, true); };
      const close = () => { this.setActive(false); onActive(this, false); };
      target.addEventListener("modal:open", open);
      target.addEventListener("modal:close", close);
      this.off = () => { target.removeEventListener("modal:open", open); target.removeEventListener("modal:close", close); };
    }
  }
  setActive(on: boolean) {
    if (this.active === on) return;
    this.active = on;
    this.el.classList.toggle("is-active", on);
  }
  setVisible(on: boolean, delay = 0) {
    if (this.visible === on) return;
    this.visible = on;
    clearTimeout(this.timer);
    const apply = () => this.el.classList.toggle("location-pin--hidden", !on);
    if (delay) this.timer = window.setTimeout(apply, delay); else apply();
  }
  /** places the pin over its landmark */
  place(camera: THREE.Camera, width: number, height: number, v = new THREE.Vector3()) {
    v.copy(this.point).project(camera);
    const x = ((v.x + 1) / 2) * width;
    const y = ((1 - v.y) / 2) * height;
    this.el.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
  }
  dispose() { clearTimeout(this.timer); this.off(); }
}

// ---------------------------------------------------------------- scene

export function initLocation(container: HTMLElement) {
  const sticky = container.closest<HTMLElement>(".sticky");
  if (!sticky) return () => {};
  const phone = matches("sm-down");
  const app = createApp(container, { fov: 11.42, far: 1000, alpha: false, logarithmicDepthBuffer: true });

  // light: a neutral room environment, plus the model's own point lights
  const pmrem = new THREE.PMREMGenerator(app.renderer);
  pmrem.compileEquirectangularShader();
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room).texture;
  app.scene.environment = env;
  app.scene.environmentIntensity = 1;
  app.disposables.push(env, pmrem, { dispose: () => room.dispose() });

  const mouse = pointer(0.05);
  const run = createRun(sticky, { clamp: true, enableMq: null, mobileSmooth: true, frames: { "parallax-0-0": { progress: 0 }, "parallax-100-100": { progress: 1 } } });
  let progress = 0;

  const pins: Pin[] = [];
  let activePin: Pin | null = null;
  let pinsVisible = false;
  const clouds: THREE.Mesh<THREE.BoxGeometry, THREE.ShaderMaterial>[] = [];
  let cloudsVisible = true;
  let path: { position: Keyframes[]; lookAt: Keyframes[] } | null = null;
  const eye = new THREE.Vector3();
  const target = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  let disposed = false;
  new GLTFLoader().load(MODEL, (gltf) => {
    if (disposed) return;
    const model = gltf.scene;
    const views: View[] = [];
    model.traverse((node) => {
      if (node.name === "Ground" && node instanceof THREE.Mesh) {
        node.position.y = -0.01;
        const m = node.material as THREE.MeshStandardMaterial;
        m.bumpMap = m.map;
        m.bumpScale = -0.5;
      }
      const cfg = PINS.find((p) => p.mesh === node.name);
      const el = cfg ? container.querySelector<HTMLElement>(cfg.element) : null;
      if (cfg && el) {
        pins.push(new Pin(el, node.position.clone(), cfg.stagger ?? 0, (pin, on) => {
          if (on) activePin = pin;
          else if (activePin === pin) activePin = null;
        }));
      }
      const m = /^(Camera|Target)_Position_(\d+)$/.exec(node.name);
      if (m) {
        const n = parseInt(m[2], 10);
        views[n] = views[n] ?? { position: [0, 0, 0], lookAt: [0, 0, 0] };
        views[n][m[1] === "Camera" ? "position" : "lookAt"] = node.position.toArray() as [number, number, number];
      }
      // every surface one-sided, as on the original
      if (node instanceof THREE.Mesh) {
        const list = Array.isArray(node.material) ? node.material : [node.material];
        list.forEach((mat: THREE.Material) => { mat.side = THREE.FrontSide; });
      }
    });
    const route = phone ? PHONE_PATH : views;
    path = {
      position: [0, 1, 2].map((a) => new Keyframes(route.map((v) => v.position[a]))),
      lookAt: [0, 1, 2].map((a) => new Keyframes(route.map((v) => v.lookAt[a]))),
    };
    app.camera.position.fromArray(route[0].position);
    app.camera.lookAt(...route[0].lookAt);
    app.scene.add(model);

    const density = cloudTexture();
    app.disposables.push(density);
    for (const c of CLOUDS) {
      const mesh = cloud(density, { ...c, steps: c.steps * (phone ? 0.5 : 1) });
      clouds.push(mesh);
      app.scene.add(mesh);
      app.disposables.push(mesh.geometry, mesh.material);
    }
    app.disposables.push({
      dispose: () => model.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        node.geometry.dispose();
        (Array.isArray(node.material) ? node.material : [node.material]).forEach((mat: THREE.Material) => {
          for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
          mat.dispose();
        });
      }),
    });
  });

  app.onFrame((dt) => {
    mouse.update(dt);
    const p = run.group.ctx.position;
    progress = approach(progress, p, 0.15, dt, 1e-5);
    const t = progress;

    // pins: from 20 % of the flight they come in one after another; while one is active, the others step back
    const show = t > 0.2;
    if (show !== pinsVisible) {
      pinsVisible = show;
      pins.forEach((pin) => pin.setVisible(show, show ? 75 * pin.stagger : 0));
    } else if (show) {
      pins.forEach((pin) => pin.setVisible(!(activePin && activePin !== pin)));
    }
    const cloudy = t <= 0.4;
    if (cloudy !== cloudsVisible) {
      cloudsVisible = cloudy;
      clouds.forEach((c) => { c.visible = cloudy; });
    }

    if (path) {
      eye.set(path.position[0].at(t), path.position[1].at(t), path.position[2].at(t));
      target.set(path.lookAt[0].at(t), path.lookAt[1].at(t), path.lookAt[2].at(t));
      const swing = 5 * (2 * mouse.state.x - 1);
      eye.sub(target).applyAxisAngle(up, (swing / 180) * -Math.PI).add(target);
      app.camera.position.copy(eye);
      app.camera.lookAt(target);
    }
    for (const c of clouds) {
      c.material.uniforms.cameraPos.value.copy(app.camera.position);
      c.material.uniforms.frame.value += 10;
    }
  });
  const v = new THREE.Vector3();
  app.afterFrame(() => {
    app.camera.updateMatrixWorld();
    for (const pin of pins) pin.place(app.camera, app.size.width, app.size.height, v);
  });

  // a read-only handle for inspection (as the original keeps its plugin instance in the element's jQuery data)
  Object.defineProperty(container, "webgl", {
    configurable: true,
    value: { camera: app.camera, scene: app.scene, renderer: app.renderer, get progress() { return { target: run.group.ctx.position, animated: progress }; }, get pointer() { return { ...mouse.state }; } },
  });

  return () => {
    delete (container as unknown as { webgl?: unknown }).webgl;
    disposed = true;
    run.destroy();
    mouse.dispose();
    pins.forEach((p) => p.dispose());
    app.dispose();
  };
}
