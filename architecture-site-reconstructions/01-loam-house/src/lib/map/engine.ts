"use client";

import {
  AMENITIES,
  DOT_RADIUS,
  PLAN_PLACEMENT,
  ROAD_NAMES,
} from "@/content/precinct-map";
import { alternateSides, gsap, ScrollTrigger, SplitText } from "@/lib/motion/gsap";
import {
  cameraPath,
  clamp,
  easeInOutPow,
  easeInOutSine,
  MARKER_CURVES,
  markerRadius,
  ramp,
  type ViewBox,
} from "./camera";

/* ── Geometry ─────────────────────────────────────────────────────── */

const ROT = (PLAN_PLACEMENT.rotate * Math.PI) / 180;
const COS = Math.cos(ROT);
const SIN = Math.sin(ROT);

/** Plan coordinates → area-map coordinates. */
export function planToArea(x: number, y: number): [number, number] {
  const { tx, ty, scale, pivotX, pivotY } = PLAN_PLACEMENT;
  const dx = x - pivotX;
  const dy = y - pivotY;
  const rx = pivotX + dx * COS - dy * SIN;
  const ry = pivotY + dx * SIN + dy * COS;
  return [tx + scale * rx, ty + scale * ry];
}

export const PLAN_TRANSFORM = `translate(${PLAN_PLACEMENT.tx} ${PLAN_PLACEMENT.ty}) scale(${PLAN_PLACEMENT.scale}) rotate(${PLAN_PLACEMENT.rotate} ${PLAN_PLACEMENT.pivotX} ${PLAN_PLACEMENT.pivotY})`;

const DOT_AREA_R = DOT_RADIUS * PLAN_PLACEMENT.scale;
/** Camera width at which a dot's circle truly covers the viewport. */
const FILL_W = DOT_AREA_R * 1.1;
/** Below this camera width halos fade and the breath flattens. */
const HALO_FADE_W = 40;
const MAX_SPIN_DEG = 4;
const REF_VMIN = 800;
const PHOTO_FADE = { start: 22, span: 20, curve: 1.3 };
const DIVE = { durationScale: 1.6, power: 4, textLead: 600, textSpeed: 2 };
const PULSE = { period: 4.1, breath: 1.2, pingPhase: 0.35, pingScale: 4.2, pingOpacity: 0.36 };
const MOBILE_PRECINCT = { zoom: 0.8, panX: 6 };
const GECKO = typeof CSS !== "undefined" && CSS.supports("-moz-appearance", "none");
const LOAM = planToArea(730, 470);

const isPhone = () => window.matchMedia("(max-width: 800px)").matches;
const isAmenity = (id: string | null) => !!id && AMENITIES.some((a) => a.id === id);

/** Landscape shows the whole area; portrait centres on Loam House at the viewport's aspect. */
function areaViewBox(): ViewBox {
  const aspect = innerWidth > 0 && innerHeight > 0 ? innerWidth / innerHeight : 1;
  if (aspect >= 1) return [-150, -400, 1500, 1500];
  const h = 900;
  const w = h * aspect;
  const lx = PLAN_PLACEMENT.tx + PLAN_PLACEMENT.scale * PLAN_PLACEMENT.pivotX;
  const ly = PLAN_PLACEMENT.ty + PLAN_PLACEMENT.scale * PLAN_PLACEMENT.pivotY;
  return [lx - w / 2 - 70, ly - h / 2, w, h];
}

/** The chapter's home frame, a little closer on phones. */
function precinctViewBox(): ViewBox {
  const [lx, ly] = LOAM;
  const phone = isPhone();
  const z = phone ? MOBILE_PRECINCT.zoom : 1;
  return [lx - 58 * z + (phone ? MOBILE_PRECINCT.panX : 0), ly - 41 * z, 117 * z, 83 * z];
}

type Target = { vb: ViewBox; parent: string | null };

export type MapElements = {
  chapter: HTMLElement;
  svg: SVGSVGElement;
  spin: SVGGElement;
  area: SVGGElement;
  plan: SVGGElement;
  buildingLabels: SVGGElement;
  dots: SVGGElement;
  roads: SVGGElement;
  suburbs: SVGGElement;
  stations: SVGGElement;
  busStops: SVGGElement;
  lens: HTMLElement;
  lensImage: HTMLImageElement;
  note: HTMLElement;
  dotName: HTMLElement;
  panels: HTMLElement;
  journey: HTMLElement;
};

/** Finds the map's parts inside the chapter by their `data-map` names. */
export function resolveMapElements(chapter: HTMLElement): MapElements {
  const part = <T extends Element>(name: keyof MapElements) => {
    const el = chapter.querySelector<T & Element>(`[data-map="${name}"]`);
    if (!el) throw new Error(`precinct map: missing [data-map="${name}"]`);
    return el as T;
  };
  return {
    chapter,
    svg: part<SVGSVGElement>("svg"),
    spin: part<SVGGElement>("spin"),
    area: part<SVGGElement>("area"),
    plan: part<SVGGElement>("plan"),
    buildingLabels: part<SVGGElement>("buildingLabels"),
    dots: part<SVGGElement>("dots"),
    roads: part<SVGGElement>("roads"),
    suburbs: part<SVGGElement>("suburbs"),
    stations: part<SVGGElement>("stations"),
    busStops: part<SVGGElement>("busStops"),
    lens: part<HTMLElement>("lens"),
    lensImage: part<HTMLImageElement>("lensImage"),
    note: part<HTMLElement>("note"),
    dotName: part<HTMLElement>("dotName"),
    panels: part<HTMLElement>("panels"),
    journey: part<HTMLElement>("journey"),
  };
}

/** The hook the chapter's scrubbed entry drives: `state.t` 0 (far, tilted) → 1 (home). */
export type EntryCamera = {
  state: { t: number };
  configure(distance?: number, rotation?: number): void;
  apply(): void;
};

type Marker = { group: SVGGElement; cx: number; cy: number };
type Panel = HTMLElement & { __lines?: HTMLElement[] };

/**
 * The precinct map. One camera (the SVG viewBox); every place is a target frame; navigation
 * is flying the camera between targets. Level of detail is a pure function of camera width.
 */
export class PrecinctMapEngine {
  readonly camera: EntryCamera;
  private el: MapElements;
  private targets: Record<string, Target> = {};
  private areaVB = areaViewBox();
  private cam: ViewBox;
  private focus = "precinct";
  private active: string | null = null;
  private raf = 0;
  private entryOwnsCamera = true;
  private spinAngle = 0;
  private openPhoto: { x: number; y: number } | null = null;
  private photoReady = false;
  private photosRequested = false;
  private panelActive: string | null = null;
  private panelTimeline: gsap.core.Timeline | null = null;
  private panelTimer = 0;
  private markers: Record<"amenity" | "station" | "busStop", Marker[]> = { amenity: [], station: [], busStop: [] };
  private dotGroups: SVGGElement[] = [];
  private roadLabelsPlaced = false;
  private disposers: (() => void)[] = [];
  private entryDistance = 2.4;
  private entryRotation = 15;
  private entryPath: ReturnType<typeof cameraPath> | null = null;

  constructor(elements: MapElements) {
    this.el = elements;
    this.buildTargets();
    this.cam = [...this.targets.precinct.vb] as ViewBox;

    const state = { t: 0 };
    this.camera = {
      state,
      configure: (distance, rotation) => {
        if (distance && distance > 0) this.entryDistance = distance;
        if (rotation != null) this.entryRotation = rotation;
        this.entryPath = null;
      },
      apply: () => {
        if (!this.entryOwnsCamera || this.raf || this.active) return;
        this.entryPath ??= cameraPath(
          [LOAM[0] - (117 * this.entryDistance) / 2, LOAM[1] - (83 * this.entryDistance) / 2, 117 * this.entryDistance, 83 * this.entryDistance],
          [...this.targets.precinct.vb] as ViewBox,
        );
        this.cam = this.entryPath.at(state.t);
        this.setViewBox(this.cam);
        this.setSpin(GECKO ? 0 : this.entryRotation * (1 - state.t));
        this.render();
      },
    };

    this.collectMarkers();
    this.applyPulse();
    this.bindInput();
    this.observeChapter();
    this.splitPanelHeadlines();
    this.setViewBox(this.cam);
    this.render();
  }

  /** Fetches the two base drawings and pours their paths into the camera's groups. */
  async loadCartography(areaUrl: string, planUrl: string) {
    const inject = async (url: string, into: SVGGElement) => {
      const text = await (await fetch(url)).text();
      const doc = new DOMParser().parseFromString(text, "image/svg+xml").querySelector("svg");
      if (!doc) return;
      into.replaceChildren(...Array.from(doc.childNodes).map((n) => document.importNode(n, true)));
    };
    await Promise.all([inject(areaUrl, this.el.area), inject(planUrl, this.el.plan)]);
    this.placeRoadLabels();
    this.render();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.panelTimer);
    this.panelTimeline?.kill();
    this.disposers.forEach((d) => d());
    this.el.area.replaceChildren();
    this.el.plan.replaceChildren();
  }

  /* ── Targets & camera ── */

  private buildTargets() {
    this.targets.area = { vb: [...this.areaVB] as ViewBox, parent: null };
    this.targets.precinct = { vb: precinctViewBox(), parent: "area" };
    for (const a of AMENITIES) {
      const [mx, my] = planToArea(a.x, a.y);
      this.targets[a.id] = { vb: [mx - FILL_W / 2, my - FILL_W / 2, FILL_W, FILL_W], parent: "precinct" };
    }
  }

  private setViewBox(v: ViewBox) {
    this.el.svg.setAttribute("viewBox", `${v[0]} ${v[1]} ${v[2]} ${v[3]}`);
  }

  /** Rotation is applied inside the SVG's own paint pass, about the camera centre. */
  private setSpin(angle: number) {
    if (!angle || Math.abs(angle) < 0.05) {
      this.el.spin.removeAttribute("transform");
      return;
    }
    const cx = this.cam[0] + this.cam[2] / 2;
    const cy = this.cam[1] + this.cam[3] / 2;
    const s = 1 + 0.03 * Math.abs(angle);
    this.el.spin.setAttribute(
      "transform",
      `translate(${cx} ${cy}) rotate(${angle.toFixed(2)}) scale(${s.toFixed(3)}) translate(${-cx} ${-cy})`,
    );
  }

  flyTo(id: string) {
    this.entryOwnsCamera = false;
    window.dispatchEvent(new Event("precinct:flight"));
    if (this.panelActive != null && this.panelActive !== id) this.panelOut();

    const diving = isAmenity(id) || isAmenity(this.focus);
    this.focus = id;
    if (isAmenity(id)) this.active = id;
    this.syncMode();
    this.syncPhoto();

    const path = cameraPath([...this.cam] as ViewBox, this.targets[id].vb);
    const duration = clamp(path.length * 520, 750, 2200) * (diving ? DIVE.durationScale : 1);
    if (isAmenity(id)) {
      window.clearTimeout(this.panelTimer);
      this.panelTimer = window.setTimeout(() => {
        if (this.focus === id) this.panelIn(id);
      }, Math.max(0, duration - DIVE.textLead));
    }

    const sway = diving && !GECKO ? (Math.random() * 2 - 1) * MAX_SPIN_DEG : 0;
    const t0 = performance.now();
    let prevLogW: number | null = null;
    let prevT = t0;
    cancelAnimationFrame(this.raf);

    const frame = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const e = diving ? easeInOutPow(p, DIVE.power) : easeInOutSine(p);
      this.cam = path.at(e);
      this.setViewBox(this.cam);
      const w = this.cam[2];
      if (diving) {
        // Dives sway while the map is still legible, then land square on the colour field.
        this.el.svg.style.filter = "none";
        this.spinAngle = sway * Math.sin(Math.PI * p) * ramp(w, FILL_W * 4, FILL_W * 12);
        this.setSpin(this.spinAngle);
      } else {
        // Map moves: a speed-tied motion blur, no rotation.
        const logW = Math.log(w);
        if (prevLogW === null) prevLogW = logW;
        const velocity = Math.abs(logW - prevLogW) / Math.max(1, now - prevT);
        prevLogW = logW;
        prevT = now;
        const blur = Math.min(6, velocity * 1400);
        this.el.svg.style.filter = p < 1 && blur > 0.15 ? `blur(${blur.toFixed(2)}px)` : "none";
      }
      this.render();
      if (p < 1) {
        this.raf = requestAnimationFrame(frame);
      } else {
        this.raf = 0;
        this.el.svg.style.filter = "none";
        this.setSpin(0);
        this.spinAngle = 0;
        if (!isAmenity(this.focus)) this.active = null;
        this.syncPhoto();
        this.render();
      }
    };
    this.raf = requestAnimationFrame(frame);
  }

  back() {
    const parent = this.targets[this.focus]?.parent;
    if (parent) this.flyTo(parent);
  }

  /** The journey control: out to the neighbourhood and back; from inside a dive it returns first. */
  journey() {
    if (isAmenity(this.focus)) return this.back();
    this.flyTo(this.focus === "area" ? "precinct" : "area");
  }

  private syncMode() {
    this.el.chapter.dataset.mode = this.focus === "area" ? "neighbourhood" : "precinct";
  }

  /** Only the dived dot may show its photograph; it stays open through the pull-out. */
  private syncPhoto() {
    const amenity = this.active ? AMENITIES.find((a) => a.id === this.active) : null;
    if (!amenity) {
      this.openPhoto = null;
      return;
    }
    const [x, y] = planToArea(amenity.x, amenity.y);
    this.openPhoto = { x, y };
    const src = `${this.photoDir()}/${amenity.id}.jpg`;
    if (this.el.lensImage.getAttribute("src") !== src) {
      this.photoReady = false;
      this.el.lensImage.style.visibility = "hidden";
      this.el.lensImage.src = src;
    }
  }

  private photoDir() {
    return isPhone() ? "/assets/mobile/amenities" : "/assets/map/amenities";
  }

  /* ── Level of detail, every frame ── */

  render() {
    const w = this.cam[2];
    const h = this.cam[3];
    const dotPresence = 1 - ramp(w, 190, 360);

    for (const group of this.dotGroups) {
      const on = group.dataset.id === this.active;
      group.style.opacity = String(on ? 1 : dotPresence);
      group.style.pointerEvents = !this.active && dotPresence > 0.5 ? "auto" : "none";
    }

    this.el.note.classList.toggle(
      "precinct__note--dived",
      this.active != null && (isAmenity(this.focus) || w < HALO_FADE_W * 1.5),
    );
    const letteringOpacity = this.panelActive != null ? "0.15" : "1";
    this.el.roads.style.opacity = letteringOpacity;
    this.el.suburbs.style.opacity = letteringOpacity;
    const panelStrength = this.active ? 1 - ramp(w, FILL_W * 1.3, FILL_W * 2.8) : 0;
    this.el.journey.style.opacity = this.active && panelStrength > 0.5 ? "0" : "1";
    this.el.dots.classList.toggle("map-dots--diving", w < HALO_FADE_W);
    this.el.dots.style.setProperty("--num-op", String(ramp(w, 12, 45)));
    this.el.dots.style.setProperty("--breath-scale", String(1 + (PULSE.breath - 1) * ramp(w, 45, 100)));
    this.el.buildingLabels.style.opacity = String(dotPresence);
    this.el.stations.style.opacity = String(ramp(w, this.areaVB[2] * 0.5, this.areaVB[2] * 0.95));

    // One sizing system for every marker: a target on-screen radius per camera width,
    // scaled by the square root of the viewport's short side.
    const pxPerUnit = Math.max(innerWidth / w, innerHeight / h);
    const deviceScale = Math.sqrt(Math.min(innerWidth, innerHeight) / REF_VMIN);
    const baseRadius = { amenity: DOT_AREA_R, station: 4.5, busStop: 5.15 };
    for (const type of ["amenity", "station", "busStop"] as const) {
      const scale = (markerRadius(MARKER_CURVES[type], w) * deviceScale) / pxPerUnit / baseRadius[type];
      if (!Number.isFinite(scale)) continue;
      for (const m of this.markers[type]) {
        m.group.setAttribute("transform", `translate(${m.cx} ${m.cy}) scale(${scale}) translate(${-m.cx} ${-m.cy})`);
      }
    }

    // The lens: a screen-space photograph revealed through a circle seated on the dot.
    const dotScreenR = markerRadius(MARKER_CURVES.amenity, w) * deviceScale;
    const covered = innerWidth > 0 && !!this.active && dotScreenR >= Math.hypot(innerWidth, innerHeight) * 0.75;
    this.el.svg.classList.toggle("precinct__map--occluded", covered);

    let photoOpacity = 0;
    if (this.openPhoto) {
      const fadeEnd = Math.max(1, PHOTO_FADE.start - PHOTO_FADE.span);
      photoOpacity = 1 - ramp(w, fadeEnd, PHOTO_FADE.start);
      if (photoOpacity > 0 && photoOpacity < 1) photoOpacity = Math.pow(photoOpacity, PHOTO_FADE.curve);
      if (innerWidth > 0 && innerHeight > 0) {
        let { x, y } = this.openPhoto;
        let r = dotScreenR;
        if (this.spinAngle) {
          const cx = this.cam[0] + w / 2;
          const cy = this.cam[1] + h / 2;
          const th = (this.spinAngle * Math.PI) / 180;
          const s = 1 + 0.03 * Math.abs(this.spinAngle);
          const dx = x - cx;
          const dy = y - cy;
          x = cx + (dx * Math.cos(th) - dy * Math.sin(th)) * s;
          y = cy + (dx * Math.sin(th) + dy * Math.cos(th)) * s;
          r *= s;
        }
        const sx = (x - this.cam[0]) * pxPerUnit + (innerWidth - w * pxPerUnit) / 2;
        const sy = (y - this.cam[1]) * pxPerUnit + (innerHeight - h * pxPerUnit) / 2;
        this.el.lens.style.clipPath = `circle(${r.toFixed(1)}px at ${sx.toFixed(1)}px ${sy.toFixed(1)}px)`;
      }
    }
    this.el.lens.style.opacity = String(covered ? 1 : photoOpacity);
  }

  /* ── Panels: the dived amenity's copy ── */

  private panel(id: string) {
    return this.el.panels.querySelector<Panel>(`[data-panel="${id}"]`);
  }

  private splitPanelHeadlines() {
    void document.fonts.ready.then(() => {
      this.el.panels.querySelectorAll<Panel>("[data-panel]").forEach((p) => {
        const h2 = p.querySelector<HTMLElement>("h2");
        if (h2 && !p.__lines) {
          try {
            p.__lines = new SplitText(h2, { type: "lines" }).lines as HTMLElement[];
          } catch {
            p.__lines = [h2];
          }
        }
      });
    });
  }

  private panelIn(id: string) {
    const p = this.panel(id);
    if (!p) return;
    this.panelActive = id;
    this.panelTimeline?.kill();
    const eyebrow = p.querySelector("[data-panel-part='eyebrow']");
    const rest = p.querySelectorAll("[data-panel-part='body'], [data-panel-part='back']");
    const lines = p.__lines ?? [p.querySelector("h2")!];
    const fromSide = alternateSides(0.28);
    p.style.pointerEvents = "auto";
    this.panelTimeline = gsap
      .timeline({ defaults: { ease: "power3.out" } })
      .timeScale(DIVE.textSpeed)
      .fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power1.out" }, 0)
      .fromTo(lines, { x: fromSide, opacity: 0 }, { x: 0, opacity: 1, duration: 2.6, ease: "expo.out" }, 0.05)
      .fromTo(eyebrow, { y: 46, opacity: 0 }, { y: 0, opacity: 1, duration: 1.82 }, 1.6)
      .fromTo(rest, { y: 46, opacity: 0 }, { y: 0, opacity: 1, duration: 1.82, stagger: 0.15 }, 1.6)
      .fromTo(lines, { filter: "blur(16px)" }, { filter: "blur(0px)", duration: 3.06, ease: "power1.out" }, 0.05)
      .fromTo(eyebrow, { filter: "blur(9px)" }, { filter: "blur(0px)", duration: 2.9, ease: "power1.out" }, 1.6)
      .fromTo(rest, { filter: "blur(9px)" }, { filter: "blur(0px)", duration: 2.9, ease: "power1.out", stagger: 0.15 }, 1.6);
  }

  /** The exit mirrors the hero's: blur leads, lines return the way they came. */
  private panelOut() {
    if (this.panelActive == null) return;
    const p = this.panel(this.panelActive);
    this.panelActive = null;
    this.panelTimeline?.kill();
    if (!p) return;
    p.style.pointerEvents = "none";
    const eyebrow = p.querySelector("[data-panel-part='eyebrow']");
    const rest = Array.from(p.querySelectorAll("[data-panel-part='body'], [data-panel-part='back']"));
    const lines = p.__lines ?? [p.querySelector("h2")!];
    const fromSide = alternateSides(0.28);
    this.panelTimeline = gsap
      .timeline({ defaults: { ease: "power2.in" } })
      .timeScale(1.5)
      .to(lines, { x: fromSide, opacity: 0, duration: 1.0, ease: "power2.out" }, 0)
      .to(eyebrow, { y: 46, opacity: 0, duration: 0.6 }, 0)
      .to(rest, { y: -26, opacity: 0, duration: 0.7, stagger: 0.08 }, 0.1)
      .to(
        p,
        {
          opacity: 0,
          duration: 0.35,
          ease: "power1.in",
          onComplete: () => void gsap.set([p, eyebrow, ...rest, ...lines], { clearProps: "all" }),
        },
        0.9,
      )
      .to(lines, { filter: "blur(14px)", duration: 0.5, ease: "power2.out" }, 0)
      .to(eyebrow, { filter: "blur(9px)", duration: 0.6 }, 0)
      .to(rest, { filter: "blur(7px)", duration: 0.7, stagger: 0.08 }, 0.1);
  }

  /* ── Setup ── */

  private collectMarkers() {
    this.dotGroups = Array.from(this.el.dots.querySelectorAll<SVGGElement>("[data-id]"));
    this.markers.amenity = this.dotGroups.map((group) => {
      const a = AMENITIES.find((x) => x.id === group.dataset.id)!;
      return { group, cx: a.x, cy: a.y };
    });
    const read = (root: SVGGElement) =>
      Array.from(root.querySelectorAll<SVGGElement>("[data-x]")).map((group) => ({
        group,
        cx: Number(group.dataset.x),
        cy: Number(group.dataset.y),
      }));
    this.markers.station = read(this.el.stations);
    this.markers.busStop = read(this.el.busStops);
  }

  /** Each dot breathes on one shared clock at its own random phase; the ping launches on the contraction. */
  private applyPulse() {
    const dots = this.el.dots;
    dots.style.setProperty("--pulse-period", `${PULSE.period}s`);
    dots.style.setProperty("--ping-scale", String(PULSE.pingScale));
    dots.style.setProperty("--ping-op", String(PULSE.pingOpacity));
    for (const group of this.dotGroups) {
      const phase = Math.random();
      const pulse = group.querySelector<SVGGElement>("[data-part='pulse']");
      const ping = group.querySelector<SVGCircleElement>("[data-part='ping']");
      if (pulse) pulse.style.animationDelay = `${(-phase * PULSE.period).toFixed(2)}s`;
      if (ping) ping.style.animationDelay = `${((-phase + PULSE.pingPhase) * PULSE.period).toFixed(2)}s`;
    }
  }

  /** Road names follow their road: rotate each to the tangent of the nearest road path. */
  private placeRoadLabels() {
    if (this.roadLabelsPlaced) return;
    const roads = Array.from(this.el.area.querySelectorAll("path")).filter((p) => {
      const fill = p.getAttribute("fill")?.toLowerCase();
      const stroke = p.getAttribute("stroke")?.toLowerCase();
      return fill === "#ffffff" || stroke === "#ffffff" || stroke === "#f4f4f4";
    });
    const tangentAt = (x: number, y: number) => {
      let best = Infinity;
      let bestPath: SVGPathElement | null = null;
      let bestLen = 0;
      for (const p of roads) {
        const len = p.getTotalLength();
        if (!len) continue;
        const step = Math.max(2, len / 80);
        for (let l = 0; l <= len; l += step) {
          const pt = p.getPointAtLength(l);
          const d = (pt.x - x) ** 2 + (pt.y - y) ** 2;
          if (d < best) {
            best = d;
            bestPath = p;
            bestLen = l;
          }
        }
      }
      if (!bestPath) return 0;
      const len = bestPath.getTotalLength();
      const a = bestPath.getPointAtLength(Math.max(0, bestLen - 0.5));
      const b = bestPath.getPointAtLength(Math.min(len, bestLen + 0.5));
      let deg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      if (deg > 90) deg -= 180;
      if (deg < -90) deg += 180; // keep text upright
      return deg;
    };
    this.el.roads.querySelectorAll<SVGTextElement>("text").forEach((t, i) => {
      const road = ROAD_NAMES[i];
      if (road) t.setAttribute("transform", `rotate(${tangentAt(road.x, road.y).toFixed(1)} ${road.x} ${road.y})`);
    });
    this.roadLabelsPlaced = true;
  }

  private bindInput() {
    const { svg, panels, journey, dotName } = this.el;
    const listen = (target: EventTarget, type: string, fn: (e: Event) => void) => {
      target.addEventListener(type, fn);
      this.disposers.push(() => target.removeEventListener(type, fn));
    };

    for (const group of this.dotGroups) {
      const id = group.dataset.id!;
      const name = AMENITIES.find((a) => a.id === id)?.name ?? "";
      listen(group, "click", (e) => {
        e.stopPropagation();
        this.flyTo(id);
      });
      listen(group, "mouseenter", () => {
        dotName.textContent = name;
        dotName.classList.add("precinct__dot-name--on");
      });
      listen(group, "mouseleave", () => dotName.classList.remove("precinct__dot-name--on"));
    }
    listen(journey.querySelector("button") ?? journey, "click", () => this.journey());
    listen(svg, "click", () => {
      if (isAmenity(this.focus)) this.back();
    });
    listen(panels, "click", () => this.back());
    listen(window, "keydown", (e) => {
      if ((e as KeyboardEvent).key === "Escape") this.back();
    });
    listen(this.el.lensImage, "load", () => {
      this.photoReady = true;
      this.el.lensImage.style.visibility = "";
      this.render();
    });
    listen(this.el.lensImage, "error", () => {
      this.photoReady = false;
      this.el.lensImage.style.visibility = "hidden";
      this.render();
    });
    listen(window, "resize", () => {
      this.areaVB = areaViewBox();
      this.targets.area.vb = [...this.areaVB] as ViewBox;
      this.targets.precinct.vb = precinctViewBox();
      this.entryPath = null;
      if (this.focus === "area") {
        this.cam = [...this.areaVB] as ViewBox;
        this.setViewBox(this.cam);
        this.render();
      } else if (this.focus === "precinct" && !this.raf && !this.active) {
        this.cam = [...this.targets.precinct.vb] as ViewBox;
        this.setViewBox(this.cam);
        this.render();
      }
    });
  }

  /** Photos prefetch when the chapter approaches; the entry camera re-arms once it is fully off screen. */
  private observeChapter() {
    const load = () => {
      if (this.photosRequested) return;
      this.photosRequested = true;
      for (const a of AMENITIES) new Image().src = `${this.photoDir()}/${a.id}.jpg`;
    };
    const trigger = ScrollTrigger.create({
      trigger: this.el.chapter,
      start: "top bottom",
      end: "bottom top",
      onEnter: load,
      onEnterBack: load,
      onLeave: () => (this.entryOwnsCamera = true),
      onLeaveBack: () => (this.entryOwnsCamera = true),
    });
    this.disposers.push(() => trigger.kill());
    const r = this.el.chapter.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) load();
  }

  /** Whether the lens image has decoded (the clay ground shows until it has). */
  get hasPhoto() {
    return this.photoReady;
  }
}
