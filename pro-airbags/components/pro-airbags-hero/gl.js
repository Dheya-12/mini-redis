import * as THREE from 'three';
import gsap from 'gsap';

export const W = 1536, H = 1024;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const f2 = v => Number(v).toFixed(2);

export const LOGO = {x: 765, y: 150, r: 108};
export const CTA_NEON = {x: 1411, y: 248, hx: 83, hy: 38, r: 16};
/* airbags that inflate: 0-3 dashboard, 4-9 car */
export const BAGS = [[72, 103, 44], [190, 42, 46], [222, 132, 58], [485, 76, 48], [955, 598, 54], [1100, 553, 72], [1262, 548, 48], [1255, 650, 54], [1015, 528, 42], [877, 545, 36]];
const SCAN_RECTS = [[440, 128, 560, 192], [720, 236, 810, 278], [748, 600, 824, 642], [1190, 60, 1420, 192]];
const WIRE = [[640, 700], [700, 660], [780, 625], [860, 670], [960, 690], [1080, 700], [1200, 690], [1330, 680], [1440, 690]];

export function createGL(canvas, A, reduced) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas, antialias: false, alpha: false, powerPreference: 'high-performance'}); }
  catch (e) { return null; }
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, W, 0, -H, -10, 10);

  const U = {
    tPlate: {value: null}, tMaskA: {value: null}, tMaskB: {value: null}, tMaskC: {value: null},
    uSize: {value: new THREE.Vector2(W, H)}, uMouse: {value: new THREE.Vector2(-9999, -9999)}, uMouseI: {value: 0},
    uExposure: {value: 1}, uGain: {value: 1}, uIgnite: {value: 1}, uTime: {value: 0}, uFlow: {value: reduced ? 0 : 1},
    uSpots: {value: Array.from({length: 14}, () => new THREE.Vector4(-999, -999, 80, 0))},
    uBags: {value: BAGS.map(b => new THREE.Vector4(b[0], b[1], b[2], 0))},
    uRing: {value: new THREE.Vector2(0, 0)}, uScan: {value: new THREE.Vector2(0, 0)},
    uScreen: {value: new THREE.Vector3(-1, 0, 0)}, uSweep: {value: new THREE.Vector3(-3000, 150, 0)},
  };
  const VS = `varying vec2 vUv; varying vec2 vP;
void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.0); vP = vec2(wp.x, -wp.y); gl_Position = projectionMatrix * viewMatrix * wp; }`;
  const FS_PLATE = `
uniform sampler2D tPlate; uniform sampler2D tMaskA; uniform sampler2D tMaskB; uniform sampler2D tMaskC;
uniform vec2 uSize; uniform vec2 uMouse; uniform float uMouseI; uniform float uExposure; uniform float uGain; uniform float uIgnite; uniform float uTime; uniform float uFlow;
uniform vec4 uSpots[14]; uniform vec4 uBags[10]; uniform vec2 uRing; uniform vec2 uScan; uniform vec3 uScreen; uniform vec3 uSweep;
varying vec2 vUv; varying vec2 vP;
const vec2 LOGO = vec2(${f2(LOGO.x)}, ${f2(LOGO.y)}); const vec3 RED = vec3(1.0, 0.16, 0.12);
const vec4 R0 = vec4(${SCAN_RECTS[0].join('.0, ')}.0); const vec4 R1 = vec4(${SCAN_RECTS[1].join('.0, ')}.0);
const vec4 R2 = vec4(${SCAN_RECTS[2].join('.0, ')}.0); const vec4 R3 = vec4(${SCAN_RECTS[3].join('.0, ')}.0);
float sq(float x){ return x * x; }
vec2 toUV(vec2 p){ return vec2(p.x / uSize.x, 1.0 - p.y / uSize.y); }
float angDiff(float a, float b){ return mod(a - b + 3.14159265, 6.2831853) - 3.14159265; }
float lightGain(vec2 p){
  float front = uIgnite * 1700.0;
  float lit = max(1.0 - smoothstep(front - 90.0, front + 5.0, length((p - LOGO) * vec2(1.0, 1.35))), step(0.999, uIgnite));
  float g = uGain * lit;
  vec2 dr = p - LOGO; float r = length(dr);
  g += uRing.y * exp(-sq(angDiff(atan(dr.x, -dr.y), uRing.x) / 0.55)) * (1.0 - smoothstep(12.0, 26.0, abs(r - ${f2(LOGO.r)})));
  g *= 1.0 + uFlow * 0.1 * sin(p.x * 0.035 - uTime * 3.6 + p.y * 0.02);
  for (int i = 0; i < 14; i++) { vec4 s = uSpots[i]; vec2 d = p - s.xy; g += s.w * exp(-dot(d, d) / (s.z * s.z)); }
  return max(g, 0.0);
}
float inRect(vec2 p, vec4 r){ return step(r.x, p.x) * step(p.x, r.z) * step(r.y, p.y) * step(p.y, r.w); }
float scanBand(vec2 p, vec4 r){ float y = mix(r.y, r.w, uScan.x); return inRect(p, r) * exp(-sq((p.y - y) / 3.0)); }
void main(){
  vec2 p = vP, q = p;
  for (int i = 0; i < 10; i++) { vec4 b = uBags[i]; if (b.w > 0.0001) { vec2 d = p - b.xy; q -= d * b.w * (1.0 - smoothstep(0.0, b.z, length(d))); } }
  float fl = texture2D(tMaskC, toUV(q)).g;
  if (fl > 0.01) q += fl * vec2(sin(uTime * 1.4 + p.y * 0.13 + p.x * 0.012) * 1.3, sin(uTime * 0.9 + p.x * 0.03) * 0.5);
  vec2 uv = toUV(q);
  vec3 c = texture2D(tPlate, uv).rgb;
  vec3 mA = texture2D(tMaskA, uv).rgb, mB = texture2D(tMaskB, uv).rgb;
  float g = lightGain(p);
  vec3 lp = c * mA.g;
  vec3 col = (c - lp) * uExposure + lp * g;
  col += max(g - 1.0, 0.0) * mA.b * RED * 0.35;
  if (mB.b > 0.01) {
    float row = uScreen.x, yc = 70.0 + row * 17.6 - (p.x - 1330.0) * 0.075;
    float band = step(0.0, row) * step(1325.0, p.x) * step(p.x, 1408.0) * exp(-sq((p.y - yc) / 6.5)) * uScreen.y;
    col = col * (1.0 + mB.b * 0.05 * sin(p.y * 1.7 - uTime * 7.0)) + mB.b * (band * RED * 0.55 + uScreen.z * 0.08);
  }
  if (uScan.y > 0.001) {
    float sb = scanBand(p, R0) + scanBand(p, R1) + scanBand(p, R2) + scanBand(p, R3) * 0.6;
    col += sb * uScan.y * vec3(1.0, 0.25, 0.2) * 0.9;
  }
  if (uMouseI + uSweep.z > 0.001) {
    vec2 px = 1.0 / uSize;
    float hL = texture2D(tMaskB, uv - vec2(px.x, 0.0)).g, hR = texture2D(tMaskB, uv + vec2(px.x, 0.0)).g;
    float hU = texture2D(tMaskB, uv + vec2(0.0, px.y)).g, hD = texture2D(tMaskB, uv - vec2(0.0, px.y)).g;
    vec3 N = normalize(vec3(-vec2(hR - hL, hD - hU) * 5.0, 1.0));
    vec2 dm = uMouse - p;
    vec3 Hh = normalize(normalize(vec3(dm, 220.0)) + vec3(0.0, 0.0, 1.0));
    float spec = pow(max(dot(N, Hh), 0.0), 34.0), fall = exp(-dot(dm, dm) / 36000.0);
    float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
    col += mA.r * uMouseI * fall * (spec * 0.5 + lum * lum * 0.45) * vec3(1.0, 0.95, 0.95);
    col += mB.r * uMouseI * exp(-dot(dm, dm) / 14000.0) * vec3(0.12, 0.06, 0.06);
    float s = dot(p, vec2(0.94, 0.34)) - uSweep.x;
    col += mA.r * exp(-s * s / (uSweep.y * uSweep.y)) * uSweep.z * (0.12 + lum);
  }
  gl_FragColor = vec4(col, 1.0);
}`;
  const VS_RIB = `attribute float aS; attribute float aV; varying float vS; varying float vV;
void main(){ vS = aS; vV = aV; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
  const FS_RIB = `uniform float uHead; uniform float uTail; uniform float uI; uniform float uDir; varying float vS; varying float vV;
void main(){
  float d = (uHead - vS) * uDir;
  float along = d < 0.0 ? exp(-d * d / 30.0) : exp(-d / uTail);
  float core = exp(-vV * vV / 0.03), glow = exp(-vV * vV / 0.32) * 0.5, hot = exp(-max(d, 0.0) / 45.0);
  gl_FragColor = vec4((vec3(1.0, 0.86, 0.82) * core * (0.45 + 0.55 * hot) + vec3(1.0, 0.1, 0.06) * glow) * along * uI, 1.0);
}`;
  const FS_FLARE = `uniform float uI; varying vec2 vUv; varying vec2 vP;
void main(){ vec2 d = (vUv - 0.5) * vec2(240.0, 90.0); float r2 = dot(d, d);
  float glow = exp(-r2 / 300.0) * 1.2 + exp(-r2 / 2600.0) * 0.3, streak = exp(-d.y * d.y / 2.2) * exp(-abs(d.x) / 60.0) * 0.7;
  gl_FragColor = vec4((vec3(1.0, 0.18, 0.12) * glow + vec3(1.0, 0.8, 0.75) * streak) * uI, 1.0); }`;
  const FS_CTA = `uniform float uHover; uniform float uPress; uniform float uRot; uniform float uShock; uniform float uShockI; uniform float uOrbit; uniform float uOrbitI;
varying vec2 vUv; varying vec2 vP;
const vec2 C = vec2(${f2(CTA_NEON.x)}, ${f2(CTA_NEON.y)}); const vec2 HS = vec2(${f2(CTA_NEON.hx)}, ${f2(CTA_NEON.hy)}); const float RR = ${f2(CTA_NEON.r)};
float sq(float x){ return x * x; }
float sdRR(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main(){
  vec2 d = vP - C; float sd = sdRR(d, HS, RR);
  float ring = exp(-sq(sd / 2.2)), halo = exp(-sq(sd / 12.0)), a = atan(d.x / HS.x, -d.y / HS.y);
  vec3 col = (ring * 0.6 + halo * 0.24) * uHover * vec3(1.0, 0.18, 0.12);
  col += exp(-sq((sd - 10.0) / 1.4)) * pow(0.5 + 0.5 * sin(a * 16.0 - uRot * 5.0), 6.0) * uHover * vec3(1.0, 0.45, 0.4) * 0.8;
  col += (1.0 - smoothstep(-40.0, 0.0, sd)) * (uHover * 0.04 + uPress * 0.12) * vec3(1.0, 0.15, 0.1);
  float comet = exp(-mod(uOrbit - a, 6.2831853) / 0.8) * uOrbitI;
  col += (ring * 1.8 * vec3(1.0, 0.85, 0.8) + halo * 0.5 * vec3(1.0, 0.2, 0.15)) * comet;
  float sd2 = sdRR(d, HS + uShock * 150.0, RR + uShock * 50.0);
  col += exp(-sq(sd2 / (2.5 + uShock * 16.0))) * pow(1.0 - uShock, 1.6) * uShockI * vec3(1.0, 0.2, 0.14);
  gl_FragColor = vec4(col, 1.0);
}`;
  const VS_PT = `attribute float aLife; attribute float aSize; attribute vec3 aCol; uniform float uPx; varying float vLife; varying vec3 vCol;
void main(){ vLife = aLife; vCol = aCol; gl_PointSize = aSize * uPx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
  const FS_PT = `varying float vLife; varying vec3 vCol;
void main(){ vec2 d = gl_PointCoord - 0.5; float a = exp(-dot(d, d) * 20.0) * vLife; gl_FragColor = vec4(vCol * a, 1.0); }`;

  const mat = (u, vs, fs, add = true, extra = {}) => new THREE.ShaderMaterial(Object.assign({uniforms: u, vertexShader: vs, fragmentShader: fs,
    depthTest: false, depthWrite: false, transparent: add, blending: add ? THREE.AdditiveBlending : THREE.NoBlending}, extra));
  function addPlane(w, h, material, x, y, order) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    m.position.set(x, -y, 0); m.renderOrder = order; m.frustumCulled = false; scene.add(m); return m;
  }
  addPlane(W, H, mat(U, VS, FS_PLATE, false), W / 2, H / 2, 0);

  /* energy path along the lower neon strips of the nav buttons, dipping under the logo */
  const pathPts = [[100, 281], [205, 281], [318, 282], [345, 282], [476, 281], [606, 282], [650, 290], [700, 300], [765, 304], [830, 300], [880, 290],
    [897, 282], [1000, 281], [1102, 282], [1112, 282], [1212, 281], [1312, 282], [1335, 286], [CTA_NEON.x, CTA_NEON.y + CTA_NEON.hy]];
  const curve = new THREE.CatmullRomCurve3(pathPts.map(p => new THREE.Vector3(p[0], p[1], 0)), false, 'centripetal');
  const N = 1200, PTS = curve.getSpacedPoints(N), LEN = curve.getLength();
  const ribGeo = (() => {
    const n = N + 1, half = 8, pos = new Float32Array(n * 6), aS = new Float32Array(n * 2), aV = new Float32Array(n * 2), idx = [];
    for (let i = 0; i < n; i++) {
      const p = PTS[i], a = PTS[Math.max(i - 1, 0)], b = PTS[Math.min(i + 1, n - 1)];
      let tx = b.x - a.x, ty = b.y - a.y; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
      for (let k = 0; k < 2; k++) { const sg = k ? 1 : -1, j = i * 2 + k; pos[j * 3] = p.x - ty * half * sg; pos[j * 3 + 1] = -(p.y + tx * half * sg); aS[j] = i / N * LEN; aV[j] = sg; }
      if (i < n - 1) { const j = i * 2; idx.push(j, j + 1, j + 2, j + 1, j + 3, j + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(aS, 1)); g.setAttribute('aV', new THREE.BufferAttribute(aV, 1));
    g.setIndex(idx); return g;
  })();
  const pathAt = s => { const f = clamp(s / LEN, 0, 1) * N, i = Math.min(Math.floor(f), N - 1), t = f - i, a = PTS[i], b = PTS[i + 1]; return {x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t}; };
  const pathS = (x, y) => { let best = 0, bd = Infinity; PTS.forEach((p, i) => { const d = (p.x - x) ** 2 + (p.y - y) ** 2; if (d < bd) { bd = d; best = i; } }); return best / N * LEN; };
  const S_LOGO = pathS(LOGO.x, 304);

  const spots = Array.from({length: 14}, () => ({x: -999, y: -999, r: 80, a: 0}));
  const pulses = [0, 1, 2].map(k => {
    const u = {uHead: {value: 0}, uTail: {value: 140}, uI: {value: 0}, uDir: {value: 1}};
    const rib = new THREE.Mesh(ribGeo, mat(u, VS_RIB, FS_RIB, true, {side: THREE.DoubleSide})); rib.renderOrder = 3; rib.frustumCulled = false; scene.add(rib);
    const fu = {uI: {value: 0}};
    return {u, fu, flare: addPlane(240, 90, mat(fu, VS, FS_FLARE), -500, -500, 4), st: {head: 0, i: 0}, spot: 2 + k, prev: null, tl: null};
  });
  let pIdx = 0, onLogoCross = null;
  function pulse(from, to, o = {}) {
    if (reduced) { if (o.onArrive) o.onArrive(); return; }
    const P = pulses[pIdx++ % pulses.length]; if (P.tl) P.tl.kill();
    const dur = o.dur ?? (0.4 + Math.abs(to - from) / 2000);
    P.u.uDir.value = to >= from ? 1 : -1; P.u.uTail.value = o.tail ?? 140; P.st.head = from; P.st.i = 0; P.prev = from;
    P.tl = gsap.timeline()
      .to(P.st, {i: 1, duration: 0.12, ease: 'power2.out'}, 0)
      .to(P.st, {head: to, duration: dur, ease: o.ease || 'power2.inOut'}, 0)
      .add(() => { if (o.onArrive) o.onArrive(); }, dur)
      .to(P.st, {i: 0, duration: 0.5, ease: 'power2.in'}, dur)
      .to(P.u.uTail, {value: 16, duration: 0.5, ease: 'power2.in'}, dur);
  }

  /* particles: sparks (bursts) and embers (ambient) */
  function pool(n, order) {
    const P = {n, pos: new Float32Array(n * 3), lifeA: new Float32Array(n), size: new Float32Array(n), col: new Float32Array(n * 3),
      vel: new Float32Array(n * 2), life: new Float32Array(n), max: new Float32Array(n).fill(1), grav: new Float32Array(n), next: 0, dirty: false, u: {uPx: {value: 1}}};
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P.pos, 3)); g.setAttribute('aLife', new THREE.BufferAttribute(P.lifeA, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(P.size, 1)); g.setAttribute('aCol', new THREE.BufferAttribute(P.col, 3));
    const pts = new THREE.Points(g, mat(P.u, VS_PT, FS_PT)); pts.renderOrder = order; pts.frustumCulled = false; scene.add(pts); P.geo = g; return P;
  }
  const sparks = pool(260, 7), embers = pool(150, 1);
  function emit(P, x, y, vx, vy, life, size, col, grav) {
    const i = P.next = (P.next + 1) % P.n;
    P.pos[i * 3] = x; P.pos[i * 3 + 1] = -y; P.vel[i * 2] = vx; P.vel[i * 2 + 1] = vy; P.life[i] = P.max[i] = life; P.size[i] = size; P.grav[i] = grav;
    P.col[i * 3] = col[0]; P.col[i * 3 + 1] = col[1]; P.col[i * 3 + 2] = col[2];
  }
  function stepPool(P, dt, flick) {
    let alive = false;
    for (let i = 0; i < P.n; i++) {
      if (P.life[i] <= 0) { if (P.lifeA[i] !== 0) { P.lifeA[i] = 0; P.dirty = true; } continue; }
      alive = true; P.life[i] -= dt; P.vel[i * 2 + 1] += P.grav[i] * dt; P.vel[i * 2] *= 0.99;
      P.pos[i * 3] += P.vel[i * 2] * dt; P.pos[i * 3 + 1] -= P.vel[i * 2 + 1] * dt;
      const t = P.life[i] / P.max[i];
      P.lifeA[i] = flick ? Math.sin(Math.PI * t) * (0.6 + 0.4 * Math.sin(i * 1.7 + P.life[i] * 9)) : Math.max(t, 0);
    }
    if (alive || P.dirty) { for (const k of ['position', 'aLife', 'aSize', 'aCol']) P.geo.attributes[k].needsUpdate = true; P.dirty = false; }
  }
  const RED = [1, 0.22, 0.14], HOT = [1, 0.75, 0.6];
  function burst(x, y, n, o = {}) {
    if (reduced) return;
    const spd = o.spd || [60, 240], life = o.life || [0.35, 0.9], size = o.size || [2.5, 6], cone = o.cone ?? TAU, dir = o.dir ?? -Math.PI / 2;
    for (let k = 0; k < n; k++) { const a = dir + (Math.random() - 0.5) * cone, v = rnd(spd[0], spd[1]); emit(sparks, x, y, Math.cos(a) * v, Math.sin(a) * v, rnd(life[0], life[1]), rnd(size[0], size[1]), Math.random() < 0.35 ? HOT : RED, o.grav ?? 380); }
  }
  function burstRect(x0, y0, x1, y1, n) {
    if (reduced) return;
    for (let k = 0; k < n; k++) {
      const side = Math.floor(Math.random() * 4), t = Math.random();
      const x = side < 2 ? x0 + (x1 - x0) * t : (side === 2 ? x0 : x1), y = side < 2 ? (side === 0 ? y0 : y1) : y0 + (y1 - y0) * t;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, a = Math.atan2(y - cy, x - cx), v = rnd(60, 200);
      emit(sparks, x, y, Math.cos(a) * v, Math.sin(a) * v - 20, rnd(0.35, 0.8), rnd(2, 4.5), Math.random() < 0.3 ? HOT : RED, 200);
    }
  }
  let emberT = 0;

  const ctaU = {uHover: {value: 0}, uPress: {value: 0}, uRot: {value: 0}, uShock: {value: 1}, uShockI: {value: 0}, uOrbit: {value: 0}, uOrbitI: {value: 0}};
  addPlane(620, 420, mat(ctaU, VS, FS_CTA), CTA_NEON.x, CTA_NEON.y, 5);

  /* car wiring surge: a light spot travelling along the harness */
  const wire = {t: 0, i: 0};
  const wireAt = t => { const f = clamp(t, 0, 1) * (WIRE.length - 1), i = Math.min(Math.floor(f), WIRE.length - 2), u = f - i; return [WIRE[i][0] + (WIRE[i + 1][0] - WIRE[i][0]) * u, WIRE[i][1] + (WIRE[i + 1][1] - WIRE[i][1]) * u]; };

  const light = {x: -9999, y: -9999};
  let running = true, pr = 1;
  const clock = {last: performance.now()};
  function frame() {
    const now = performance.now(), dt = Math.min((now - clock.last) / 1000, 0.05); clock.last = now;
    if (!running || !U.tPlate.value) return;
    if (!reduced) {
      U.uTime.value += dt; emberT -= dt;
      while (emberT <= 0) { emberT += 0.07; emit(embers, rnd(40, 1500), rnd(560, 1000), rnd(-8, 8), rnd(-38, -14), rnd(3.5, 7), rnd(1.4, 3.4), Math.random() < 0.25 ? HOT : RED, -2); }
    }
    U.uMouse.value.set(light.x, light.y);
    for (const P of pulses) {
      const h = P.st.head, i = P.st.i, sp = spots[P.spot];
      P.u.uHead.value = h; P.u.uI.value = i;
      if (i < 0.002) { sp.a = 0; P.fu.uI.value = 0; continue; }
      const pt = pathAt(h); P.flare.position.set(pt.x, -pt.y, 0); P.fu.uI.value = i;
      sp.x = pt.x; sp.y = pt.y; sp.r = 60; sp.a = i * 1.5;
      if (P.prev !== null && (P.prev - S_LOGO) * (h - S_LOGO) < 0 && onLogoCross) onLogoCross();
      P.prev = h;
    }
    const ws = spots[9];
    if (wire.i > 0.002) { const [x, y] = wireAt(wire.t); ws.x = x; ws.y = y; ws.r = 90; ws.a = wire.i * 1.6; } else ws.a = 0;
    ctaU.uRot.value += dt * (0.2 + ctaU.uHover.value);
    stepPool(sparks, dt, false); stepPool(embers, dt, true);
    for (let i = 0; i < 14; i++) { const s = spots[i]; U.uSpots.value[i].set(s.x, s.y, Math.max(s.r, 1), s.a); }
    renderer.render(scene, camera);
  }
  gsap.ticker.add(frame);

  function loadTex(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => { const t = new THREE.Texture(img); t.colorSpace = THREE.NoColorSpace; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.needsUpdate = true; res(t); };
      img.onerror = rej; img.src = src;
    });
  }
  const ready = Promise.all([loadTex(A.plate), loadTex(A.maskA), loadTex(A.maskB), loadTex(A.maskC)]).then(tx => {
    U.tPlate.value = tx[0]; U.tMaskA.value = tx[1]; U.tMaskB.value = tx[2]; U.tMaskC.value = tx[3];
  });

  /* ---------------- public effects API ---------------- */
  const fx = {
    U, ctaU, ready, LEN, S_LOGO, pathS, spots, light,
    setSize(scale) {
      pr = Math.min(Math.min(window.devicePixelRatio || 1, 2) * scale, Math.sqrt(3.6e6 / (W * H)));
      renderer.setPixelRatio(pr); renderer.setSize(W, H, false); sparks.u.uPx.value = pr; embers.u.uPx.value = pr;
    },
    setRunning(v) { running = v; },
    flash(slot, x, y, a, r, d = 0.9) { const s = spots[slot]; s.x = x; s.y = y; s.r = r; gsap.fromTo(s, {a}, {a: 0, duration: d, ease: 'power2.out', overwrite: true}); },
    hold(slot, x, y, a, r, d = 0.45) { const s = spots[slot]; if (s.a < 0.05) { s.x = x; s.y = y; } s.r = r; gsap.to(s, {a, x, y, duration: d, ease: 'power3.out', overwrite: 'auto'}); },
    release(slot, d = 0.6) { gsap.to(spots[slot], {a: 0, duration: d, overwrite: 'auto'}); },
    pulse, burst, burstRect,
    onLogoCross(fn) { onLogoCross = fn; },
    inflate(group, amount = 0.07, dur = 1.1) {
      if (reduced) return;
      const ids = group === 'dash' ? [0, 1, 2, 3] : group === 'car' ? [4, 5, 6, 7, 8, 9] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      ids.forEach((i, k) => { const v = U.uBags.value[i]; gsap.fromTo(v, {w: 0}, {keyframes: [{w: amount, duration: 0.22, ease: 'power2.out'}, {w: amount * 0.35, duration: 0.25, ease: 'sine.inOut'}, {w: 0, duration: dur, ease: 'elastic.out(1, 0.35)'}], delay: k * 0.04, overwrite: true}); });
    },
    breathe(group, on) {
      if (reduced) return;
      const ids = group === 'dash' ? [0, 1, 2, 3] : [4, 5, 6, 7, 8, 9];
      ids.forEach((i, k) => gsap.to(U.uBags.value[i], {w: on ? 0.045 : 0, duration: on ? 0.5 : 0.9, delay: on ? k * 0.03 : 0, ease: on ? 'back.out(2)' : 'elastic.out(1, 0.4)', overwrite: true}));
    },
    ring(turns = 1, dur = 1.4, i = 1.2) {
      if (reduced) return;
      const v = U.uRing.value; gsap.killTweensOf(v);
      gsap.timeline().fromTo(v, {x: -Math.PI, y: 0}, {x: -Math.PI + TAU * turns, duration: dur, ease: 'power2.inOut'}, 0).to(v, {y: i, duration: 0.25}, 0).to(v, {y: 0, duration: 0.4}, dur - 0.35);
    },
    scan(dur = 1.1) {
      if (reduced) return;
      const v = U.uScan.value; gsap.killTweensOf(v);
      gsap.timeline().fromTo(v, {x: 0, y: 1}, {x: 1, duration: dur, ease: 'power1.inOut'}).to(v, {y: 0, duration: 0.2}).fromTo(v, {x: 0, y: 0}, {x: 1, y: 0.7, duration: dur * 0.8, ease: 'power1.inOut'}).to(v, {y: 0, duration: 0.25});
    },
    screenRow(row, on = true) { const v = U.uScreen.value; if (on) { v.x = row; gsap.to(v, {y: 1, duration: 0.3, overwrite: 'auto'}); } else gsap.to(v, {y: 0, duration: 0.4, overwrite: 'auto'}); },
    screenFlicker() { if (reduced) return; gsap.fromTo(U.uScreen.value, {z: 1.4}, {keyframes: [{z: 0.2, duration: 0.05}, {z: 1.1, duration: 0.05}, {z: 0, duration: 0.5}], overwrite: 'auto'}); },
    sweep(dir = 1, i = 0.5, dur = 1.1) {
      if (reduced) return;
      const v = U.uSweep.value; gsap.killTweensOf(v);
      gsap.timeline().set(v, {x: dir > 0 ? -250 : 1900, y: 150, z: 0}).to(v, {x: dir > 0 ? 1900 : -250, duration: dur, ease: 'power2.inOut'}, 0)
        .to(v, {z: i, duration: dur * 0.3}, 0).to(v, {z: 0, duration: dur * 0.35}, dur * 0.65);
    },
    wireSurge(dur = 1.4) { if (reduced) return; gsap.killTweensOf(wire); gsap.timeline().set(wire, {t: 0, i: 0}).to(wire, {i: 1, duration: 0.15}).to(wire, {t: 1, duration: dur, ease: 'power1.inOut'}, 0).to(wire, {i: 0, duration: 0.4}, dur - 0.3); },
    ctaBurst(strength = 1) {
      gsap.fromTo(ctaU.uOrbit, {value: Math.PI}, {value: Math.PI + TAU, duration: 0.95, ease: 'power2.inOut'});
      gsap.fromTo(ctaU.uOrbitI, {value: strength}, {value: 0, duration: 1.2, ease: 'power2.in'});
      ctaU.uShockI.value = strength; gsap.fromTo(ctaU.uShock, {value: 0}, {value: 1, duration: 1.3, ease: 'expo.out'});
      fx.flash(13, CTA_NEON.x, CTA_NEON.y, 1.6 * strength, 120, 1.0);
      burstRect(CTA_NEON.x - CTA_NEON.hx, CTA_NEON.y - CTA_NEON.hy, CTA_NEON.x + CTA_NEON.hx, CTA_NEON.y + CTA_NEON.hy, Math.round(30 * strength));
    },
    destroy() { gsap.ticker.remove(frame); renderer.dispose(); },
  };
  return fx;
}
