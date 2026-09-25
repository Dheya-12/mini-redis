import * as THREE from "three";
import { gsap, emit, state } from "@/lib/runtime";
import { sound } from "@/behaviours/sound";
import { vertexShader, fragmentShader } from "./shaders";

/**
 * The page's images are drawn in WebGL over their (invisible) DOM boxes.
 *  - Home ("gallery"): intro, the scrolling ribbon, the stacked card beside the title list, title hover,
 *    and the flight to the product page when a title is clicked.
 *  - Product pages ("product"): flat images that reveal in turn; clicking one enlarges it (again to cycle).
 *  - About ("cover"): the flat cover image.
 * Timings and thresholds were measured on the original (see DECISIONS.md / FIDELITY.md).
 */
type Mode = "gallery" | "product" | "cover";
type Box = { x: number; y: number; w: number; h: number }; // centre, y up, relative to the canvas centre

const SETTINGS = {
  focal: 1040,
  stackEase: 0.008,
  focusEase: 0.01,
  easeFps: 170,
  introCount: 5,
  introDuration: () => (window.innerWidth < 640 ? 0.9 : 1.15),
  introStagger: () => (window.innerWidth < 640 ? 0.1 : 0.15),
  introGap: 0.03,
  introZoomFrom: 0.15,
  introZoomDuration: () => (window.innerWidth < 640 ? 1.6 : 2.4),
  handoffStart: 0.65,
  introCompleteAt: 0.9,
  focusTitleDuration: 1.35,
  focusRouteAt: 0.65,
  focusLayerStagger: 0.0065,
  stackLayerStagger: 0.022,
  productRevealDuration: 0.55,
  productRevealStagger: 0.06,
  productFocusDuration: 0.78,
  productFocusExit: 0.72,
  productSlideDuration: 1.25,
};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const s5 = (v: number) => { const t = clamp(v); return t * t * t * (t * (t * 6 - 15) + 10); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const sineInOut = (v: number) => (1 - Math.cos(Math.PI * clamp(v))) / 2;

type Item = {
  img: HTMLImageElement;
  figure: HTMLElement;
  index: number;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  ready: boolean;
  docRect: { left: number; top: number; w: number; h: number };
  introDelay: number;
  reveal: { v: number };
};

export class ImageScene {
  mode: Mode;
  private host: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.OrthographicCamera;
  private items: Item[] = [];
  private last = 0;
  private dt = 1 / 60;
  private destroyed = false;
  /** during the home → product flight the old scene keeps drawing without reacting to the new page */
  private frozen: { scroll: number; rect: DOMRect } | null = null;
  private offs: (() => void)[] = [];
  // gallery state
  private stack = { current: 0, target: 0, state: "unstacked" as "stack" | "unstacked", hover: null as number | null };
  private intro = { active: false, start: null as number | null, zoom: { p: 1 }, tween: null as gsap.core.Tween | null, zoomStart: 0, done: true, completeSent: true, preloaderDone: false };
  private focus = { current: 0, target: 0, index: null as number | null, preserve: false, start: 0, url: null as string | null, bounds: null as Box | null, tween: null as gsap.core.Tween | null, routeSent: false, cancelScroll: null as number | null };
  private layout = { w: 0, h: 0, stackStart: Infinity, stackRelease: Infinity, empty: null as Box | null, focusBox: null as Box | null };
  private titles: HTMLElement[] = [];
  private hoverSoundIndex: number | null = null;
  private slide = { active: false, p: 0, from: 0, to: 0 };
  ready: Promise<void>;
  private resolveReady!: () => void;

  constructor(host: HTMLElement, opts: { skipIntro: boolean; revealProduct?: boolean; preloaderDone: boolean }) {
    this.host = host;
    this.mode = document.querySelector(".gallery") ? "gallery" : document.querySelector(".product-slider") ? "product" : "cover";
    this.ready = new Promise((r) => (this.resolveReady = r));
    const mobile = window.innerWidth < 640;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? (this.mode === "cover" ? 1.25 : 1.5) : this.mode === "product" ? 1.5 : 2));
    const { w, h } = this.size();
    this.renderer.setSize(w, h);
    host.appendChild(this.renderer.domElement);
    this.camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, -1000, 1000);
    this.camera.position.z = 1;
    this.intro.preloaderDone = opts.preloaderDone;

    const imgs = [...document.querySelectorAll<HTMLElement>("[gl-media], [gl-dom]")].flatMap((f) => (f instanceof HTMLImageElement ? [f] : [...f.querySelectorAll("img")]));
    const introOn = this.mode === "gallery" && !opts.skipIntro;
    this.items = imgs.map((img, index) => this.createItem(img, index, introOn, !!opts.revealProduct));
    if (introOn) this.startIntro();
    this.titles = [...document.querySelectorAll<HTMLElement>(".content h2")];

    this.bind();
    this.resize();
    gsap.ticker.add(this.tick);
  }

  private size() {
    return { w: this.host.clientWidth || window.innerWidth, h: this.host.clientHeight || window.innerHeight };
  }

  private createItem(img: HTMLImageElement, index: number, introOn: boolean, revealProduct: boolean): Item {
    const mobile = window.innerWidth < 640;
    const seg = this.mode === "cover" ? [64, 96] : mobile ? (this.mode === "product" ? [16, 32] : [12, 32]) : this.mode === "product" ? [32, 64] : [24, 64];
    const geometry = new THREE.PlaneGeometry(1, 1, seg[0], seg[1]);
    const placeholder = new THREE.DataTexture(new Uint8Array([239, 238, 235, 255]), 1, 1);
    placeholder.needsUpdate = true;
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tMap: { value: placeholder },
        uCoverScale: { value: new THREE.Vector2(1, 1) },
        uViewport: { value: new THREE.Vector2(1, 1) },
        uCenter: { value: new THREE.Vector2() },
        uSize: { value: new THREE.Vector2(1, 1) },
        uFocal: { value: SETTINGS.focal },
        uStack: { value: 0 },
        uCornerWave: { value: 0 },
        uPhase: { value: index },
        uLift: { value: 0 },
        uFlat: { value: this.mode === "gallery" ? 0 : 1 },
        uIntro: { value: introOn && index < SETTINGS.introCount ? 0 : 1 },
        uIntroBlend: { value: introOn && index < SETTINGS.introCount ? 0 : 1 },
        uIntroCurveY: { value: 0 },
        uIntroCurveScale: { value: 1 },
        uIntroHeight: { value: 1 },
        uReveal: { value: this.mode === "product" && revealProduct ? 0 : 1 },
      },
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    this.scene.add(mesh);
    const item: Item = {
      img, figure: (img.closest("[gl-media], [gl-dom]") as HTMLElement) || img, index, mesh, ready: false,
      docRect: { left: 0, top: 0, w: 0, h: 0 },
      introDelay: Math.abs(index - (Math.min(SETTINGS.introCount, 99) - 1) / 2) * SETTINGS.introStagger(),
      reveal: { v: material.uniforms.uReveal.value as number },
    };
    const load = () => {
      if (this.destroyed) return;
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      tex.needsUpdate = true;
      material.uniforms.tMap.value = tex;
      item.ready = true;
      this.fit(item);
      if (this.mode === "product" && revealProduct) this.revealProduct(item);
    };
    img.crossOrigin = "anonymous";
    if (img.complete && img.naturalWidth) (img.decode?.() ?? Promise.resolve()).catch(() => {}).then(load);
    else img.addEventListener("load", () => (img.decode?.() ?? Promise.resolve()).catch(() => {}).then(load), { once: true });
    return item;
  }

  private revealProduct(item: Item) {
    const go = () => gsap.to(item.reveal, { v: 1, duration: SETTINGS.productRevealDuration, delay: item.index * SETTINGS.productRevealStagger, ease: "power2.out", onUpdate: () => { item.mesh.material.uniforms.uReveal.value = item.reveal.v; } });
    if (this.intro.preloaderDone) go();
    else window.addEventListener("preloader_complete", go, { once: true });
  }

  private fit(item: Item) {
    const img = item.img;
    const iw = img.naturalWidth || 1, ih = img.naturalHeight || 1;
    const pw = item.mesh.material.uniforms.uSize.value.x || 1, ph = item.mesh.material.uniforms.uSize.value.y || 1;
    const ia = iw / ih, pa = pw / ph;
    item.mesh.material.uniforms.uCoverScale.value.set(ia > pa ? ia / pa : 1, ia < pa ? pa / ia : 1);
  }

  // ---------------------------------------------------------------- layout
  private canvasRect() { return this.renderer.domElement.getBoundingClientRect(); }

  private box(el: Element | null, rect: DOMRect): Box | null {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const w = r.width || rect.width * 0.2, h = r.height || w * 1.25;
    return { x: r.left - rect.left + w / 2 - rect.width / 2, y: rect.height / 2 - (r.top - rect.top + h / 2), w, h };
  }

  resize() {
    const { w, h } = this.size();
    this.renderer.setSize(w, h);
    Object.assign(this.camera, { left: -w / 2, right: w / 2, top: h / 2, bottom: -h / 2 });
    this.camera.updateProjectionMatrix();
    this.refreshLayout();
  }

  private refreshLayout() {
    const rect = this.canvasRect();
    const scroll = this.scrollY();
    this.layout.w = rect.width;
    this.layout.h = rect.height;
    for (const it of this.items) {
      const r = it.figure.getBoundingClientRect();
      it.docRect = { left: r.left + window.scrollX, top: r.top + scroll, w: r.width || rect.width * 0.28, h: r.height || r.width * 1.25 };
    }
    const wrapper = document.querySelector(".wrapper");
    if (wrapper) {
      const wr = wrapper.getBoundingClientRect();
      const end = wr.bottom + scroll;
      this.layout.stackStart = Math.max(0, end - rect.height);
      this.layout.stackRelease = Math.max(0, this.layout.stackStart - rect.height * 0.18);
    }
    this.layout.empty = this.box(document.querySelector(".empty"), rect);
    this.layout.focusBox = this.box(document.querySelector(this.mode === "product" ? ".empty-slider" : ".empty-focus"), rect);
  }

  private scrollY() { return state.lenis?.actualScroll ?? window.scrollY; }

  // ---------------------------------------------------------------- intro
  private startIntro() {
    this.intro = { ...this.intro, active: true, start: null, zoom: { p: 0 }, done: false, completeSent: false };
    this.intro.zoomStart = Math.floor(Math.min(SETTINGS.introCount, this.items.length) / 2) * SETTINGS.introStagger() + SETTINGS.introDuration();
    this.camera.zoom = SETTINGS.introZoomFrom;
    this.camera.updateProjectionMatrix();
    state.lenis?.stop();
    this.offs.push(on("preloader_complete", () => { this.intro.preloaderDone = true; }));
  }

  private updateIntro(time: number, rect: DOMRect) {
    if (this.intro.done) return;
    const list = this.items.slice(0, SETTINGS.introCount);
    const scroll = this.scrollY();
    const gap = rect.width * SETTINGS.introGap;
    // the first images sit in a tight column (3 % of the width apart) centred on screen
    let top = list[0].docRect.top - scroll;
    const col = list.map((it) => { const r = { left: it.docRect.left - window.scrollX, top, w: it.docRect.w, h: it.docRect.h }; top += it.docRect.h + gap; return r; });
    const first = col[0].top, last = col[col.length - 1].top + col[col.length - 1].h;
    const height = Math.max(1, last - first), middle = (first + last) / 2;
    const cameraY = rect.height / 2 - (middle - rect.top);
    const allReady = list.every((it) => it.ready);
    if (this.intro.preloaderDone && allReady && this.intro.start === null) this.intro.start = time;
    const elapsed = this.intro.start === null ? 0 : Math.max(0, time - this.intro.start);
    const zoom = this.intro.zoom.p;
    const handoff = s5((zoom - SETTINGS.handoffStart) / (1 - SETTINGS.handoffStart));
    list.forEach((it, k) => {
      const c = col[k];
      const u = it.mesh.material.uniforms;
      u.uIntro.value = clamp((elapsed - it.introDelay) / SETTINGS.introDuration());
      u.uIntroBlend.value = handoff;
      u.uIntroCurveY.value = ((middle - (c.top + c.h / 2)) * 2) / height;
      u.uIntroCurveScale.value = c.h / height;
      u.uIntroHeight.value = height;
      (it as Item & { introPos?: { x: number; y: number } }).introPos = { x: c.left - rect.left + c.w / 2 - rect.width / 2, y: rect.height / 2 - (c.top - rect.top + c.h / 2) };
    });
    if (!this.intro.tween && this.intro.start !== null && elapsed >= this.intro.zoomStart) {
      emit("preloader_complete");
      emit("intro_zoom");
      this.intro.tween = gsap.to(this.intro.zoom, {
        p: 1, duration: SETTINGS.introZoomDuration(), ease: "expo.inOut",
        onComplete: () => {
          this.items.forEach((it) => { it.mesh.material.uniforms.uIntro.value = 1; it.mesh.material.uniforms.uIntroBlend.value = 1; });
          this.intro.done = true;
          requestAnimationFrame(() => { state.lenis?.start(); if (!this.intro.completeSent) { this.intro.completeSent = true; emit("intro_complete"); } });
        },
      });
    }
    if (!this.intro.completeSent && zoom >= SETTINGS.introCompleteAt) { this.intro.completeSent = true; emit("intro_complete"); }
    const z = mix(SETTINGS.introZoomFrom, 1, zoom);
    this.camera.zoom = z;
    this.camera.position.y = cameraY * (1 - zoom / z);
    this.camera.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------- stack & titles
  private damp(a: number, b: number, k: number) { return a + (b - a) * (1 - Math.pow(1 - clamp(k), this.dt * SETTINGS.easeFps)); }

  private titleInteractive() { return this.stack.state === "stack" || Math.max(this.stack.current, this.stack.target) > 0.08; }
  private activeTitle() { return this.stack.hover ?? (this.titles.length ? 0 : null); }
  private activeMedia() { const t = this.activeTitle(); return t === null ? null : Math.max(0, this.items.length - 1 - t); }

  private syncTitles(clear = false) {
    const active = !clear && this.titleInteractive() ? this.activeTitle() : null;
    this.titles.forEach((t, i) => t.classList.toggle("--is-active", i === active));
  }

  private updateStack(scroll: number) {
    if (this.mode !== "gallery") return;
    const target = (this.stack.target > 0 ? scroll >= this.layout.stackRelease : scroll >= this.layout.stackStart) ? 1 : 0;
    this.stack.target = target;
    if (target === 1 && this.stack.state !== "stack") {
      this.stack.state = "stack";
      this.syncTitles();
      document.querySelector(".gallery")?.classList.add("--is-stacked");
      document.querySelector(".gallery__credits")?.classList.remove("--is-visible");
      emit("stack");
    } else if (target === 0 && this.stack.state !== "unstacked") {
      this.stack.state = "unstacked";
      this.stack.hover = null;
      this.syncTitles(true);
      document.querySelector(".gallery")?.classList.remove("--is-stacked");
      emit("unstacked");
    }
    this.stack.current = this.damp(this.stack.current, target, SETTINGS.stackEase);
    if (Math.abs(target - this.stack.current) < 0.001) this.stack.current = target;
  }

  /** restore the stacked selection when coming back from a product page */
  restoreStack(mediaIndex: number) {
    if (this.mode !== "gallery") return;
    this.stack = { ...this.stack, current: 1, target: 1, state: "stack", hover: Math.max(0, this.items.length - 1 - mediaIndex) };
    this.syncTitles();
    emit("stack");
  }

  // ---------------------------------------------------------------- focus
  private startFocus(index: number, preserve: boolean) {
    const it = this.items[index];
    const link = it?.figure.closest<HTMLElement>("[data-product-url]");
    state.lenis?.stop();
    const start = preserve ? 0 : Math.max(this.focus.current, Math.min(this.stack.current, 0.44));
    this.focus = { ...this.focus, current: start, target: 1, index, preserve, start, url: link?.dataset.productUrl ?? null, routeSent: false, cancelScroll: null, bounds: this.box(document.querySelector(this.mode === "product" ? ".empty-slider" : ".empty-focus"), this.canvasRect()) };
    this.focus.tween?.kill();
    this.focus.tween = preserve
      ? gsap.to(this.focus, {
          current: 1,
          duration: this.mode === "product" ? SETTINGS.productFocusDuration : SETTINGS.focusTitleDuration,
          ease: this.mode === "product" ? "none" : "power1.inOut",
          onComplete: () => { this.focus.tween = null; if (this.focus.target > 0 && !this.focus.routeSent) { this.focus.routeSent = true; emit("media_focus_transition_ready"); } },
        })
      : null;
    this.setProductHeader(true);
    document.body.style.cursor = "";
    emit("media_focus", { index, url: this.focus.url, scroll: this.scrollY(), preserveStack: preserve, medias: [link?.dataset.productImage2, link?.dataset.productImage3].filter(Boolean) });
  }

  cancelFocus() {
    const was = this.focus.target > 0;
    this.focus.tween?.kill();
    this.focus.tween = null;
    this.focus.target = 0;
    if (this.slide.active) { this.focus.index = this.slide.p > 0.5 ? this.slide.to : this.slide.from; this.slide.active = false; this.slide.p = 0; }
    this.setProductHeader(false);
    if (this.mode === "product" && was) this.focus.tween = gsap.to(this.focus, { current: 0, duration: SETTINGS.productFocusExit, ease: "none", onComplete: () => { this.focus.tween = null; } });
    if (was) emit("media_unfocus", { index: this.focus.index });
  }

  private setProductHeader(on: boolean) {
    if (this.mode !== "product") return;
    const items = [...document.querySelectorAll<HTMLElement>(".header-sound, .header-catalogue, .header-about, .header-collection")];
    const back = document.querySelector<HTMLElement>(".header-back");
    document.body.classList.toggle("product-focus-active", on);
    gsap.to(items, { autoAlpha: on ? 0 : 1, y: on ? -8 : 0, duration: 0.65, ease: "power4.out", stagger: on ? 0.035 : 0.045, overwrite: true });
    if (back) gsap.fromTo(back, { autoAlpha: on ? 0 : 1, y: on ? 8 : 0 }, { autoAlpha: on ? 1 : 0, y: on ? 0 : 8, duration: 0.65, delay: on ? 0.12 : 0, ease: "power4.out", overwrite: true });
  }

  private nextSlide() {
    if (this.slide.active || this.items.length < 2 || this.focus.index === null) return;
    const from = this.focus.index, to = (from + 1) % this.items.length;
    this.slide = { active: true, p: 0, from, to };
    gsap.to(this.slide, { p: 1, duration: SETTINGS.productSlideDuration, ease: "none", onComplete: () => { this.focus.index = to; this.slide = { active: false, p: 0, from: 0, to: 0 }; } });
  }

  private updateFocus() {
    if (!this.focus.tween) {
      this.focus.current = this.damp(this.focus.current, this.focus.target, SETTINGS.focusEase);
      if (Math.abs(this.focus.target - this.focus.current) < 0.001) this.focus.current = this.focus.target;
    }
    if (this.focus.target > 0 && !this.focus.routeSent && this.focus.current >= SETTINGS.focusRouteAt && !this.focus.tween) { this.focus.routeSent = true; emit("media_focus_transition_ready"); }
    if (this.focus.current === 0 && this.focus.target === 0 && this.focus.index !== null) {
      this.focus.index = null;
      state.lenis?.start();
    }
  }

  // ---------------------------------------------------------------- events
  private bind() {
    const onMove = (e: PointerEvent) => {
      if (!this.intro.done) return;
      const target = e.target as Element;
      // title hover selects the image shown on top of the stack
      if (this.mode === "gallery" && this.titleInteractive()) {
        const h2 = target.closest?.(".content h2");
        const content = document.querySelector(".content");
        if (h2 || !content?.contains(target)) {
          const i = h2 ? this.titles.indexOf(h2 as HTMLElement) : null;
          if (i !== this.stack.hover) {
            this.stack.hover = i;
            if (i !== null && this.focus.target === 0) sound.play(this.activeMedia() ?? 0);
            this.syncTitles();
          }
        }
      }
      const hit = this.hit(e.clientX, e.clientY);
      const focusing = this.focus.target > 0;
      const blocked = !!target.closest?.(".header, .content, a, button");
      const soundIndex = !focusing && !this.stackMoving() && e.pointerType !== "touch" && !blocked ? hit?.index ?? null : null;
      if (soundIndex !== this.hoverSoundIndex) { this.hoverSoundIndex = soundIndex; if (soundIndex !== null) sound.play(soundIndex); }
      const slideCursor = this.mode === "product" && focusing && this.focus.current > 0.98 && !this.slide.active && this.inFocusBox(e.clientX, e.clientY);
      document.body.style.cursor = slideCursor ? "e-resize" : !focusing && !this.stackMoving() && hit && this.mode !== "cover" ? "pointer" : "";
    };
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = e.target as Element;
      const title = target.closest?.(".content h2 a");
      if (title && this.mode === "gallery") {
        e.preventDefault();
        e.stopPropagation();
        if (!this.intro.done || this.focus.target > 0 || !this.titleInteractive()) return;
        const i = this.titles.indexOf(title.closest("h2") as HTMLElement);
        if (i >= 0 && this.items[this.items.length - 1 - i]) this.startFocus(this.items.length - 1 - i, true);
        return;
      }
      if (this.mode === "product" && this.focus.target > 0) {
        if (target.closest?.(".header-back, .header-home, [data-sound]")) return;
        if (!this.inFocusBox(e.clientX, e.clientY)) { e.preventDefault(); e.stopPropagation(); this.cancelFocus(); return; }
        if (this.focus.current > 0.98 && !this.slide.active) this.nextSlide();
        return;
      }
      if (this.mode === "cover" || target.closest?.("a, button, input, textarea, select") || !this.intro.done || this.focus.target > 0 || this.stackMoving()) return;
      const hit = this.hit(e.clientX, e.clientY);
      if (hit) this.startFocus(hit.index, this.mode === "product");
    };
    const onIntent = (e: Event) => {
      if (!this.intro.done || this.focus.target > 0 || this.focus.current > 0.001) e.preventDefault();
    };
    const onBack = () => { if (this.mode === "product" && this.focus.target > 0) this.cancelFocus(); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("click", onClick, true);
    window.addEventListener("wheel", onIntent, { passive: false, capture: true });
    window.addEventListener("touchmove", onIntent, { passive: false, capture: true });
    const back = document.querySelector(".header-back");
    back?.addEventListener("click", onBack);
    const onResize = () => this.resize();
    window.addEventListener("resize", onResize);
    this.offs.push(() => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("wheel", onIntent, true);
      window.removeEventListener("touchmove", onIntent, true);
      back?.removeEventListener("click", onBack);
      window.removeEventListener("resize", onResize);
    });
  }

  private stackMoving() { return Math.max(this.stack.current, this.stack.target) > 0.44; }

  private inFocusBox(x: number, y: number) {
    const r = document.querySelector(this.mode === "product" ? ".empty-slider" : ".empty-focus")?.getBoundingClientRect();
    return !!r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  /** topmost image under the pointer (screen-space bounds of each plane, with a 12 px margin) */
  private hit(x: number, y: number): Item | null {
    const rect = this.canvasRect();
    const px = x - rect.left, py = y - rect.top;
    let best: Item | null = null;
    for (const it of this.items) {
      const b = (it as Item & { hitBox?: { l: number; r: number; t: number; b: number } }).hitBox;
      if (!it.mesh.visible || !b) continue;
      if (px < b.l || px > b.r || py < b.t || py > b.b) continue;
      if (!best || it.mesh.renderOrder > best.mesh.renderOrder) best = it;
    }
    return best;
  }

  // ---------------------------------------------------------------- frame
  freeze() {
    this.frozen = { scroll: this.scrollY(), rect: this.canvasRect() };
  }

  private tick = (time: number) => {
    if (this.destroyed) return;
    this.dt = this.last ? clamp(time - this.last, 0, 0.08) : 1 / 60;
    this.last = time;
    const rect = this.frozen?.rect ?? this.canvasRect();
    if (!this.frozen && (Math.abs(rect.width - this.layout.w) > 0.5 || Math.abs(rect.height - this.layout.h) > 0.5)) this.resize();
    const scroll = this.frozen?.scroll ?? this.scrollY();
    if (this.mode === "gallery" && this.intro.done && !this.frozen) this.updateStack(scroll);
    this.updateIntro(time, rect);
    this.updateFocus();
    this.place(rect, scroll);
    this.renderer.render(this.scene, this.camera);
    if (this.resolveReady && this.items.slice(0, this.mode === "gallery" ? SETTINGS.introCount : 1).every((it) => it.ready)) {
      this.resolveReady();
      this.resolveReady = null as unknown as () => void;
      emit("gl_ready");
    }
  };

  private place(rect: DOMRect, scroll: number) {
    const n = this.items.length;
    const mid = (n - 1) / 2;
    const fanX = Math.min(28, rect.width * 0.022), fanY = Math.min(16, rect.height * 0.02);
    const empty = this.layout.empty ?? { x: 0, y: 0, w: 0, h: 0 };
    const focusBox = this.focus.target > 0 && this.focus.bounds ? this.focus.bounds : this.layout.focusBox ?? empty;
    const fc = clamp(this.focus.current);
    const focusing = fc > 0.001;
    const direct = focusing && !this.focus.preserve && this.focus.target > 0;
    const fp = clamp((fc - this.focus.start) / (1 - this.focus.start));
    const fs = s5(fp);
    const orderBlend = focusing && this.focus.index !== null ? (this.focus.preserve ? 1 : this.focus.target > 0 ? fs : s5(fc)) : 0;
    const leaving = focusing && this.focus.target === 0;
    const stackAmount = Math.max(this.stack.current, this.stack.target);
    const from = this.focus.cancelScroll ?? scroll;
    const release = leaving && stackAmount > 0.08 ? s5((scroll - from) / (rect.height * 0.28)) : 0;
    const late = s5((fc - 0.52) / 0.48);
    const toFocus = focusing ? (this.focus.preserve ? s5(fc) : this.focus.target > 0 ? 1 : mix(1, late, release)) : 0;
    const card = { x: mix(empty.x, focusBox.x, toFocus), y: mix(empty.y, focusBox.y, toFocus), w: mix(empty.w, focusBox.w, toFocus), h: mix(empty.h, focusBox.h, toFocus) };
    const stackDrive = focusing && this.focus.preserve ? Math.max(this.stack.current, fc) : focusing ? mix(fc, Math.max(this.stack.current, fc), release) : this.stack.current;
    const activeMedia = this.titleInteractive() ? this.activeMedia() : null;

    for (const it of this.items) {
      const u = it.mesh.material.uniforms;
      if (!it.ready || (!this.intro.done && it.index >= SETTINGS.introCount)) { it.mesh.visible = false; continue; }
      // flat, scroll-driven position of the DOM box
      const d = it.docRect;
      const cx = d.left - window.scrollX - rect.left + d.w / 2 - rect.width / 2;
      const cy = rect.height / 2 - (d.top + d.h / 2 - scroll - rect.top);
      const progressY = cy / rect.height + 0.5;
      if (this.mode !== "gallery") {
        let box = { x: cx, y: cy, w: d.w, h: d.h };
        if (this.mode === "product" && this.focus.index !== null) {
          // product pages: the clicked image grows into the large slot
          const isFocus = it.index === this.focus.index || (this.slide.active && it.index === this.slide.to);
          const k = isFocus ? sineInOut(fc) : 0;
          const target = this.layout.focusBox ?? box;
          box = { x: mix(cx, target.x, k), y: mix(cy, target.y, k), w: mix(d.w, target.w, k), h: mix(d.h, target.h, k) };
          if (this.slide.active && it.index === this.slide.to) u.uReveal.value = s5(this.slide.p);
          it.mesh.renderOrder = this.slide.active && it.index === this.slide.to ? n + 1 : isFocus ? n : it.index;
        } else it.mesh.renderOrder = it.index;
        it.mesh.visible = true;
        this.apply(it, box, rect);
        continue;
      }
      // layer order: the focused image goes on top, otherwise the hovered title's image
      const focusOrder = this.focus.index === null ? it.index : it.index === this.focus.index ? n - 1 : it.index > this.focus.index ? it.index - 1 : it.index;
      const hoverOrder = activeMedia === null ? it.index : it.index === activeMedia ? n - 1 : it.index > activeMedia ? it.index - 1 : it.index;
      const order = mix(mix(it.index, hoverOrder, activeMedia === null ? 0 : 1), focusOrder, orderBlend);
      const fromTop = n - 1 - order;
      const delay = direct ? (n - 1 - focusOrder) * SETTINGS.focusLayerStagger : fromTop * SETTINGS.stackLayerStagger;
      const own = clamp((stackDrive - delay) / Math.max(0.2, 1 - delay));
      const stackT = s5(own);
      const move = direct ? s5((fp - delay) / Math.max(0.2, 1 - delay)) : s5((stackT - 0.32) / 0.68);
      const corner = s5((stackT - 0.03) / 0.36) * (1 - s5((stackT - 0.58) / 0.42));
      const arc = Math.sin(move * Math.PI) * (1 - s5((move - 0.86) / 0.14)) * (focusing ? release : 1);
      const lag = this.focus.preserve ? fromTop * SETTINGS.focusLayerStagger : 0;
      const toFocusOwn = this.focus.preserve ? s5((fc - lag) / (1 - lag)) : toFocus;
      const target = this.focus.preserve ? { x: mix(empty.x, focusBox.x, toFocusOwn), y: mix(empty.y, focusBox.y, toFocusOwn), w: mix(empty.w, focusBox.w, toFocusOwn), h: mix(empty.h, focusBox.h, toFocusOwn) } : card;
      const w = mix(d.w, target.w || d.w, move), h = mix(d.h, target.h || d.h, move);
      // while travelling to the card the pile fans out a little (measured offsets), then closes up
      const tx = target.x - (Math.max(0, w - target.w) / 2 + fromTop * 8.5 + Math.abs(Math.sin(it.index * 1.7)) * fanX * 0.24) * arc;
      const ty = target.y + (Math.cos(it.index * 2.1) * fanY + (mid - it.index) * 1.1) * arc;
      let x = mix(cx, tx, move), y = mix(cy, ty, move);
      const introPos = (it as Item & { introPos?: { x: number; y: number } }).introPos;
      if (!this.intro.done && introPos) {
        const hand = u.uIntroBlend.value as number;
        x = mix(introPos.x, x, hand);
        y = mix(introPos.y, y, hand);
      }
      it.mesh.renderOrder = focusing && it.index === this.focus.index ? n : order;
      it.mesh.visible = !this.intro.done || (progressY > -0.9 && progressY < 1.9) || stackDrive > 0.001;
      u.uStack.value = stackT;
      u.uCornerWave.value = corner;
      u.uLift.value = (order - mid) * 4 * corner;
      this.apply(it, { x, y, w, h }, rect);
    }
  }

  private apply(it: Item, b: Box, rect: DOMRect) {
    const u = it.mesh.material.uniforms;
    u.uViewport.value.set(rect.width, rect.height);
    u.uCenter.value.set(b.x, b.y);
    const resized = u.uSize.value.x !== b.w || u.uSize.value.y !== b.h;
    u.uSize.value.set(b.w, b.h);
    if (resized) this.fit(it);
    (it as Item & { hitBox?: object }).hitBox = { l: rect.width / 2 + b.x - b.w / 2 - 12, r: rect.width / 2 + b.x + b.w / 2 + 12, t: rect.height / 2 - b.y - b.h / 2 - 12, b: rect.height / 2 - b.y + b.h / 2 + 12 };
  }

  destroy() {
    this.destroyed = true;
    gsap.ticker.remove(this.tick);
    this.intro.tween?.kill();
    this.focus.tween?.kill();
    this.offs.forEach((f) => f());
    this.items.forEach((it) => { it.mesh.geometry.dispose(); it.mesh.material.dispose(); (it.mesh.material.uniforms.tMap.value as THREE.Texture)?.dispose?.(); });
    this.renderer.dispose();
    this.renderer.domElement.remove();
    document.body.style.cursor = "";
  }
}

function on(name: string, fn: () => void) {
  window.addEventListener(name, fn, { once: true });
  return () => window.removeEventListener(name, fn);
}
