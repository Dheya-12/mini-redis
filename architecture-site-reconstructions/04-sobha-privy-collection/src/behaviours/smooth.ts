/**
 * Smooth scrolling (Lenis on the window) with the original's "gravity wells".
 *
 * Sections mark points the scroll should linger at (`data-scroll-gravity-well='[{"viewport": -100, "element": 0}]'`:
 * the point E % down the element, V % of the screen above it). Within a quarter screen of a well the easing slows —
 * down to 26 % of the normal rate at its centre — and wheel movement across it counts for three quarters, so the
 * page settles there. Values measured on the original: base lerp 0.1, reach 0.25 screen, floor 0.35, damping 0.75.
 */
import Lenis from "lenis";
import { gsap, state, type Cleanup } from "@/lib/runtime";
import { addLayout } from "@/lib/layout";
import { pageOffset, viewportUnits } from "./parallax/engine";

const LERP = 0.1;
const REACH = 0.25;
const FLOOR = 0.35;
const DAMPING = 0.75;

type Well = { el: HTMLElement; viewport: number; element: number; offset: number };

let wells: Well[] = [];

function collectWells(root: ParentNode) {
  const out: Well[] = [];
  root.querySelectorAll<HTMLElement>("[data-scroll-gravity-well]").forEach((el) => {
    let v: unknown;
    try { v = JSON.parse(el.getAttribute("data-scroll-gravity-well") || "null"); } catch { v = null; }
    const list = Array.isArray(v) ? v : v && typeof v === "object" ? [v] : [];
    for (const w of list as { viewport?: unknown; element?: unknown }[]) {
      if (typeof w.viewport === "number" && typeof w.element === "number") out.push({ el, viewport: w.viewport / 100, element: w.element / 100, offset: 0 });
    }
  });
  return out;
}

function measureWells() {
  const screen = viewportUnits().svh;
  for (const w of wells) {
    const o = pageOffset(w.el);
    w.offset = o.scrollTop + o.height * w.element - screen * w.viewport;
  }
}

function lerpAt(y: number) {
  const screen = viewportUnits().svh;
  let lerp = LERP;
  for (const w of wells) {
    const from = w.offset - screen * REACH;
    const to = w.offset + screen * REACH;
    if (y > from && y < to) {
      const half = (to - from) / 2;
      lerp *= Math.max(0, Math.min(1, (Math.abs(y - (from + half)) / half + FLOOR) / (1 + FLOOR)));
    }
  }
  return lerp;
}

/** the part of a wheel movement that crosses a well counts for three quarters */
function dampDelta(current: number, delta: number) {
  const screen = viewportUnits().svh;
  const next = current + delta;
  const dir = Math.sign(delta);
  let adjusted = delta;
  for (const w of wells) {
    const from = w.offset - screen * REACH;
    const to = w.offset + screen * REACH;
    const a = Math.min(Math.max(Math.min(current, next), from), to);
    const b = Math.min(Math.max(Math.max(current, next), from), to);
    const inside = b - a;
    if (inside) adjusted -= inside * dir * (1 - DAMPING);
  }
  return adjusted;
}

export function initSmoothScroll(): Cleanup {
  const lenis = new Lenis({
    lerp: LERP,
    smoothWheel: true,
    virtualScroll: (data) => {
      if (wells.length && data.event.type === "wheel") data.deltaY = dampDelta(lenis.targetScroll, data.deltaY);
      return true;
    },
  });
  state.lenis = lenis;
  (window as unknown as { lenis: Lenis }).lenis = lenis;
  lenis.on("scroll", () => { lenis.options.lerp = lerpAt(lenis.scroll); });
  const raf = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  return () => { gsap.ticker.remove(raf); lenis.destroy(); state.lenis = null; };
}

/** the current page's wells (measured with every layout pass) */
export function initGravityWells(root: HTMLElement): Cleanup {
  wells = collectWells(root);
  measureWells();
  const off = addLayout("measure", measureWells);
  return () => { off(); wells = []; };
}
