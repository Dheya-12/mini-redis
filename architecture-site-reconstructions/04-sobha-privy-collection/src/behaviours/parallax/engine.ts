import { matches, onChange } from "@/lib/mq";
import { addLayout } from "@/lib/layout";
import { patterns, type Frame, type Frames, type Pattern, type PatternContext } from "./patterns";

/**
 * Scroll-linked keyframes, declared in the markup.
 *
 * An element lists one or more named patterns: `data-plugin="parallax" data-parallax-pattern="imageMove"`. Each
 * pattern is a set of keyframes keyed `parallax-<V>[unit]-<E>`: the frame applies when the point E % down the
 * measured element reaches V % of the viewport (default unit: small viewport height; inside a horizontal sticky slider
 * the "viewport" is the window width and E runs across the element). Values are CSS strings; the numbers inside them
 * are interpolated. A pattern can clamp, ease the whole run, ease each segment, and react when the run is entered or
 * left. Several patterns on one element combine: transforms are concatenated, opacities multiplied.
 */

// ---------------------------------------------------------------- easing (Penner's equations, t in 0..1)
export const easings: Record<string, (t: number) => number> = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (t - 1) ** 3 + 1,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  easeInExpo: (t) => (t === 0 ? 0 : 2 ** (10 * (t - 1))),
  easeOutExpo: (t) => (t === 1 ? 1 : 1 - 2 ** (-10 * t)),
  easeInOutExpo: (t) => (t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2),
  // the site's own two: a quadratic that starts slow (entering a section) and its mirror
  easeSectionInverse: (t) => t * t,
  easeSection: (t) => 2 * t - t * t,
};
const ease = (name?: string | null) => (name ? easings[name] ?? null : null);

// ---------------------------------------------------------------- values: "translateY(-50svh) translateY(50%)" → template + numbers
const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi;
type Value = { parts: string[]; numbers: number[] };
function parseValue(v: string | number): Value {
  const s = String(v);
  const parts: string[] = [];
  const numbers: number[] = [];
  let last = 0;
  for (const m of s.matchAll(NUMBER)) {
    parts.push(s.slice(last, m.index));
    numbers.push(parseFloat(m[0]));
    last = m.index! + m[0].length;
  }
  parts.push(s.slice(last));
  return { parts, numbers };
}
function mixValue(a: Value, b: Value, t: number): string {
  if (!a.numbers.length) return (t > 0.5 ? b : a).parts.join("");
  let out = a.parts[0];
  for (let i = 0; i < a.numbers.length; i++) {
    const v = (b.numbers[i] - a.numbers[i]) * t + a.numbers[i];
    const r = Math.abs(b.numbers[i] - v) < 1e-4 ? b.numbers[i] : Math.abs(a.numbers[i] - v) < 1e-4 ? a.numbers[i] : Math.round(v * 1e4) / 1e4;
    out += r + a.parts[i + 1];
  }
  return out;
}

// ---------------------------------------------------------------- geometry
/** the translation an element currently carries (from its transform) */
export function translateOf(el: Element) {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return { x: 0, y: 0 };
  const m = new DOMMatrixReadOnly(t);
  return { x: m.m41, y: m.m42 };
}

/** viewport units in px (svh can differ from vh on phones with collapsing toolbars) */
let unitProbe: HTMLDivElement | null = null;
export function viewportUnits() {
  if (!unitProbe) {
    unitProbe = document.createElement("div");
    unitProbe.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;visibility:hidden;pointer-events:none";
    unitProbe.innerHTML = '<div style="height:100svh"></div><div style="height:100dvh"></div><div style="height:100lvh"></div>';
    document.body.appendChild(unitProbe);
  }
  const [s, d, l] = Array.from(unitProbe.children).map((c) => (c as HTMLElement).getBoundingClientRect().height);
  return { svh: s || window.innerHeight, dvh: d || window.innerHeight, lvh: l || window.innerHeight };
}

export type Offset = { top: number; left: number; width: number; height: number; scrollTop: number; scrollHeight: number; viewportSize: number; natural: boolean };

/**
 * Document position of an element, without the transforms the parallax itself applies to its ancestors and without
 * the offset a native sticky layer currently adds. Inside a horizontal sticky slider the element's position across the
 * slider becomes its scroll position (the slider turns vertical scrolling into horizontal movement one to one).
 */
export function pageOffset(el: Element): Offset {
  const r = el.getBoundingClientRect();
  const o: Offset = { top: r.top, left: r.left, width: r.width, height: r.height, scrollTop: r.top, scrollHeight: r.height, viewportSize: window.innerHeight, natural: true };
  const content = el.closest("[data-sticky-slider-content-ready]");
  if (content) {
    const s = translateOf(content);
    const c = content.getBoundingClientRect();
    o.left -= s.x;
    o.top -= s.y;
    o.scrollTop = c.top - s.y + (r.left - c.left);
    o.scrollHeight = r.width;
    o.viewportSize = window.innerWidth;
    o.natural = false;
  }
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (p.matches('[data-plugin~="parallax"]')) {
      const t = translateOf(p);
      o.top -= t.y;
      o.scrollTop -= t.y;
    }
  }
  let fixed = false;
  for (let p: Element | null = el; p && !p.matches("body, .section, .js-page-content-wrapper"); p = p.parentElement) {
    if (getComputedStyle(p).position === "fixed") { fixed = true; break; }
  }
  const sy = fixed ? Math.min(0, window.scrollY) : window.scrollY;
  const sx = fixed ? Math.min(0, window.scrollX) : window.scrollX;
  o.top += sy;
  o.scrollTop += sy;
  o.left += sx;
  const layer = el.closest(".sticky__layer--sticky, [data-scroll-sticky]");
  if (layer && getComputedStyle(layer).position === "sticky" && getComputedStyle(layer).top !== "auto" && layer.parentElement) {
    const stuck = layer.getBoundingClientRect().top - layer.parentElement.getBoundingClientRect().top;
    o.top -= stuck;
    o.scrollTop -= stuck;
  }
  return o;
}

// ---------------------------------------------------------------- one pattern on one element
const KEY = /^parallax-(-?[\d.]+)(vw|vh|svh|lvh|dvh|px)?(?:-(-?[\d.]+))?$/i;
const ALIAS: Record<string, string> = { parallaxFrom: "parallax-100-0", parallaxTo: "parallax-0-100" };

type Point = { viewport: number; unit: string; element: number | null; props: Record<string, Value>; easing: ((t: number) => number) | null; scroll: number };

class Group {
  enabled = false;
  inside = false;
  clamp: boolean;
  easing: ((t: number) => number) | null;
  points: Point[] | null = null;
  constraints: { from: number; to: number; viewFrom: number | null; viewTo: number | null } | null = null;
  position = 0;
  /** last position before clamping: tells from which side the run is entered */
  private raw = 0;
  values: Record<string, string> = {};
  ctx: PatternContext;
  private offMq: () => void;

  constructor(readonly el: HTMLElement, readonly pattern: Pattern, readonly name: string, readonly options: Record<string, string>, onToggle: () => void) {
    this.clamp = pattern.clamp ?? options.clamp === "true";
    this.easing = ease(pattern.easing ?? options.easing);
    const measure = resolveMeasure(el, pattern.measureSelector ?? options.measureSelector ?? null);
    const viewBox = findViewBox(el);
    this.ctx = { el, measure, viewBox, axis: el.closest(".sticky-slider") ? "x" : "y", elementSize: 0, viewportSize: 0, targetSize: null, position: 0, group: this };
    const mq = pattern.enableMq !== undefined ? pattern.enableMq : options.enableMq ?? "md-up";
    const check = () => {
      const on = matches(mq);
      if (on !== this.enabled) { this.enabled = on; onToggle(); }
    };
    this.enabled = matches(mq);
    this.offMq = onChange(mq, check);
  }

  destroy() { this.offMq(); }

  /** keyframes for the current geometry */
  private frames(): Record<string, Frame> {
    const f = typeof this.pattern.frames === "function" ? this.pattern.frames(this.ctx) : this.pattern.frames ?? {};
    if ("clamp" in f) this.clamp = !!f.clamp;
    return f as Record<string, Frame>;
  }

  measure() {
    const m = pageOffset(this.ctx.measure);
    const vb = this.ctx.viewBox ? pageOffset(this.ctx.viewBox) : null;
    this.ctx.elementSize = m.scrollHeight;
    this.ctx.viewportSize = m.viewportSize;
    const units = viewportUnits();
    const sizes: Record<string, number> = m.natural
      ? { default: units.svh, vh: window.innerHeight, vw: window.innerWidth, svh: units.svh, dvh: units.dvh, lvh: units.lvh }
      : { default: window.innerWidth, vw: window.innerHeight, vh: window.innerWidth, svh: window.innerWidth, dvh: window.innerWidth, lvh: window.innerWidth };
    const points: Point[] = [];
    for (const [rawKey, frame] of Object.entries(this.frames())) {
      const key = ALIAS[rawKey] ?? rawKey;
      const k = key.match(KEY);
      if (!k || typeof frame !== "object") continue;
      const { easing, ...props } = frame;
      const unit = k[2] ? k[2].toLowerCase() : "default";
      const viewport = parseFloat(k[1]) / 100;
      const element = k[3] !== undefined ? parseFloat(k[3]) / 100 : null;
      const v = unit === "px" ? viewport * 100 : viewport * sizes[unit];
      const scroll = element === null ? Math.round(v) : Math.round(m.scrollHeight * element + m.scrollTop - v);
      points.push({ viewport, unit, element, easing: ease(easing as string | undefined), scroll, props: Object.fromEntries(Object.entries(props).map(([p, val]) => [p, parseValue(val as string)])) });
    }
    points.sort((a, b) => a.scroll - b.scroll);
    if (points.length < 2) { this.points = null; this.constraints = null; return; }
    this.points = points;
    const reach = vb ? Math.max(m.viewportSize, vb.scrollHeight) : 0;
    this.constraints = { from: points[0].scroll, to: points[points.length - 1].scroll, viewFrom: vb ? vb.scrollTop - reach : null, viewTo: vb ? vb.scrollTop + reach : null };
  }

  inView(scroll: number) {
    const c = this.constraints;
    return !!c && (c.viewFrom === null || (scroll >= c.viewFrom && scroll <= c.viewTo!));
  }

  private at(scroll: number) {
    const c = this.constraints!;
    return c.to === c.from ? (scroll >= c.to ? 1 : 0) : (scroll - c.from) / (c.to - c.from);
  }

  interpolate(scroll: number): Record<string, string> {
    if (!this.constraints || !this.points) return {};
    let p = this.at(scroll);
    if (p < 0 || p > 1) { if (this.inside) this.leave(p > 1 ? 1 : -1); }
    else if (!this.inside) this.enter(this.raw < 0 ? 1 : -1);
    this.raw = p;
    if (this.clamp) p = Math.min(1, Math.max(0, p));
    const eased = this.easing ? this.easing(p) : p;
    this.position = p;
    this.ctx.position = eased;
    const c = this.constraints;
    const s = eased * (c.to - c.from) + c.from;
    const pts = this.points;
    let a = pts[0];
    let b = pts[pts.length - 1];
    for (let i = 1; i < pts.length - 1; i++) {
      if (pts[i].scroll >= s) { b = pts[i]; break; }
      a = pts[i];
    }
    const pa = this.at(a.scroll);
    const pb = this.at(b.scroll);
    let t = pb === pa ? 1 : (eased - pa) / (pb - pa);
    if (a.easing) t = a.easing(t);
    const out: Record<string, string> = {};
    for (const [prop, va] of Object.entries(a.props)) {
      const vb = b.props[prop];
      out[prop] = vb ? mixValue(va, vb, t) : va.parts.join("");
    }
    this.values = out;
    return out;
  }

  private enter(direction: number) { this.inside = true; this.pattern.enter?.(this.ctx, direction); }
  leave(direction: number) { if (!this.inside) return; this.inside = false; this.pattern.leave?.(this.ctx, direction); }
  update() { this.pattern.update?.(this.ctx); }
  reset() { this.pattern.reset?.(this.ctx); }
  apply() { this.pattern.apply?.(this.ctx); }
  /** CSS properties this group writes */
  properties() { return this.points ? Object.keys(this.points[0].props).filter((p) => p !== "progress") : []; }
}

/**
 * The box whose extent decides when an element counts as on screen (the original's rule): the nearest ancestor, from
 * the grandparent up, that clips its content or is a scroll section, leaving out sticky layers. An element with no
 * such ancestor inside the page counts as always on screen. (Updates run only while an element is on screen, and a
 * run entered from below fires its `enter` hook only if the previous update saw the element before the run.)
 */
function findViewBox(el: Element): Element | null {
  const stop = (n: Element) => n === document.body || n === document.documentElement || n.matches(".page-content-wrapper");
  let n = el.parentElement;
  while (n && !stop(n)) {
    n = n.parentElement;
    if (!n || stop(n)) return null;
    const cs = getComputedStyle(n);
    const clips = cs.overflow === "hidden" || n.matches("[data-scroll-section]");
    const sticky = cs.position === "sticky" || n.matches("[data-scroll-sticky], [data-native-sticky], .js-scroll-parent-ignore");
    if (clips && !sticky) return n;
  }
  return null;
}

function resolveMeasure(el: HTMLElement, selector: Pattern["measureSelector"] | null): HTMLElement {
  if (!selector) return el;
  if (typeof selector === "function") return selector(el) ?? el;
  return (el.closest(selector) as HTMLElement | null) ?? (el.querySelector(selector) as HTMLElement | null) ?? el;
}

// ---------------------------------------------------------------- one element with its patterns
class ParallaxElement {
  groups: Group[] = [];
  private written = new Set<string>();
  private hidden = false;
  private smooth: { value: number; strength: number } | null = null;
  private toggleVisibility = true;

  constructor(readonly el: HTMLElement, private onToggle: () => void, explicit?: Pattern[]) {
    const ds = el.dataset;
    const options: Record<string, string> = {};
    if (explicit) {
      explicit.forEach((pattern, i) => this.groups.push(new Group(el, pattern, `run-${i}`, options, onToggle)));
    } else {
      // keyframes written on the element itself (`data-parallax--70-0='{"opacity": 1}'`) form a run of their own
      const inline: Frames = {};
      for (const [k, v] of Object.entries(ds)) {
        if (!k.startsWith("parallax") || k === "parallaxPattern" || v === undefined) continue;
        if (KEY.test(ALIAS[k] ?? k)) {
          try { inline[k] = JSON.parse(v) as Frame; } catch { console.warn(`parallax keyframe ${k} is not valid JSON`, el); }
        } else options[k.charAt(8).toLowerCase() + k.slice(9)] = v;
      }
      // options the original also reads without the prefix
      if (ds.measureSelector && !options.measureSelector) options.measureSelector = ds.measureSelector;
      if (Object.keys(inline).length) this.groups.push(new Group(el, { frames: inline }, "inline", options, onToggle));
      for (const name of (ds.parallaxPattern ?? "").trim().split(/\s+/).filter(Boolean)) {
        const pattern = patterns[name];
        if (!pattern) { console.warn(`parallax pattern "${name}" is not defined`, el); continue; }
        this.groups.push(new Group(el, pattern, name, options, onToggle));
      }
    }
    const mobileSmooth = this.groups.find((g) => g.pattern.mobileSmooth)?.pattern.mobileSmooth ?? (options.mobileSmooth ? Number(options.mobileSmooth) || true : false);
    this.toggleVisibility = options.toggleCssVisibility !== "false";
    if (mobileSmooth && matches("sm-down")) this.smooth = { value: window.scrollY, strength: typeof mobileSmooth === "number" ? mobileSmooth : 0.25 };
  }

  get enabled() { return this.groups.some((g) => g.enabled); }

  reset() {
    for (const p of this.written) this.el.style.removeProperty(p === "clipPath" ? "clip-path" : p);
    this.written.clear();
    if (this.hidden) { this.el.style.visibility = ""; this.hidden = false; }
    for (const g of this.groups) if (g.enabled) g.reset();
  }

  measure() { for (const g of this.groups) if (g.enabled) { g.apply(); g.measure(); } }

  /** returns true while the smoothed scroll value is still moving (phones) */
  update(scroll: number): boolean {
    let s = scroll;
    let moving = false;
    if (this.smooth) {
      this.smooth.value += (scroll - this.smooth.value) * this.smooth.strength;
      if (Math.abs(scroll - this.smooth.value) < 0.25) this.smooth.value = scroll; else moving = true;
      s = this.smooth.value;
    }
    const active = this.groups.filter((g) => g.enabled);
    if (!active.length) return moving;
    let visible = false;
    for (const g of active) { if (g.inView(s)) visible = true; else g.leave(0); }
    const toggleVisibility = this.toggleVisibility && !matches("sm-down");
    if (!visible) {
      if (toggleVisibility && !this.hidden) { this.el.style.visibility = "hidden"; this.hidden = true; }
      return moving;
    }
    const css: Record<string, string> = {};
    for (const g of active) {
      const values = g.interpolate(s);
      g.update();
      for (const [prop, v] of Object.entries(values)) {
        if (prop === "progress") continue;
        if (prop === "transform" && css.transform) css.transform += " " + v;
        else if (prop === "opacity") css.opacity = String((prop in css ? parseFloat(css.opacity) : 1) * parseFloat(v));
        else css[prop] = v;
      }
    }
    if (this.hidden) { this.el.style.visibility = ""; this.hidden = false; }
    for (const [prop, v] of Object.entries(css)) {
      const name = prop === "clipPath" ? "clip-path" : prop;
      this.el.style.setProperty(name, v);
      this.written.add(prop);
    }
    return moving;
  }

  destroy() { this.reset(); this.groups.forEach((g) => g.destroy()); }
}

// ---------------------------------------------------------------- the page's parallax elements
/** every element with scroll-linked keyframes — from the markup, and runs created by other behaviours */
const registry = new Set<ParallaxElement>();
let scrollOf: () => number = () => window.scrollY;
let raf = 0;
function tick() {
  raf = 0;
  const s = Math.max(0, scrollOf());
  let again = false;
  for (const it of registry) if (it.update(s)) again = true;
  if (again) raf = requestAnimationFrame(tick);
}
const request = () => { if (!raf) raf = requestAnimationFrame(tick); };
function relayout(it: ParallaxElement) { it.reset(); it.measure(); it.update(Math.max(0, scrollOf())); }

export function initParallax(root: HTMLElement, getScroll: () => number) {
  scrollOf = getScroll;
  const items: ParallaxElement[] = [];
  for (const el of Array.from(root.querySelectorAll<HTMLElement>('[data-plugin~="parallax"]'))) {
    const it: ParallaxElement = new ParallaxElement(el, () => relayout(it));
    if (it.groups.length) { items.push(it); registry.add(it); }
  }
  const offs = [
    addLayout("reset", () => registry.forEach((it) => it.reset())),
    addLayout("measure", () => registry.forEach((it) => it.measure())),
    addLayout("apply", () => tick()),
  ];
  items.forEach((it) => it.measure());
  tick();
  return {
    update: () => tick(),
    request,
    items,
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      offs.forEach((f) => f());
      items.forEach((it) => { it.destroy(); registry.delete(it); });
    },
  };
}

/**
 * A scroll run created by code (a WebGL scene, a sticky content switcher): the same keyframes, measured and updated
 * with the page's other runs. `group.position` / `group.values` hold the current state.
 */
export function createRun(el: HTMLElement, pattern: Pattern) {
  const it: ParallaxElement = new ParallaxElement(el, () => relayout(it), [pattern]);
  registry.add(it);
  it.measure();
  it.update(Math.max(0, scrollOf()));
  return {
    group: it.groups[0],
    destroy() { it.destroy(); registry.delete(it); },
  };
}
