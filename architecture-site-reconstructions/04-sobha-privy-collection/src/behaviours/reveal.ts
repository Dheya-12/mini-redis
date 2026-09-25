/**
 * Reveals on first view (desktop and tablets; `md-up`).
 *
 * A reveal container (`data-plugin~="reveal"`) watches its `[data-reveal]` elements, or whole `[data-reveal-group]`s.
 * When one comes into view — 100 px inside the bottom edge; half of a group — it runs the transition its
 * `data-reveal` names ("title", "text", "fade-in", "slide-in-top block" …) after `data-reveal-delay` (default 30 ms)
 * plus `data-reveal-stagger` × 180 ms. Anything scrolled past without being seen is shown at once. On phones the
 * attribute is simply dropped, which shows the content without animation.
 */
import { matches } from "@/lib/mq";
import { transition } from "./transition";
import { showImages } from "./appear";
import type { Cleanup } from "@/lib/runtime";

/** elements already watched (a page-wide reveal skips what a section already handles) */
const attached = new WeakSet<Element>();

const DEFAULTS = { groupDistance: "0px 0px -100px 0px", elementDistance: "0px 0px -100px 0px", groupThreshold: 0.5, elementThreshold: 0, staggerDelay: 180, delay: 30, enableMq: "md-up" };

function attr<T>(el: Element, name: string, fallback: T): T | string | number | boolean {
  const v = el.getAttribute(name);
  if (v === null) return fallback;
  if (v === "true" || v === "") return v === "true" ? true : fallback;
  if (v === "false") return false;
  const n = Number(v);
  return Number.isFinite(n) && v.trim() !== "" ? n : v;
}
/** "0" (a number) is a valid rootMargin too */
const margin = (v: unknown) => (typeof v === "number" ? `${v}px 0px` : String(v));

/**
 * Watches an element: `enter` once enough of it is in view, `overshoot` when it is found with its top already above
 * the viewport without qualifying (the page was jumped past it). "Enough" is the threshold ratio of the element or,
 * for an element taller than the viewport, of the viewport's height (rounded down to a tenth).
 */
function inview(el: Element, distance: string, threshold: number, enter: () => void, overshoot: () => void): Cleanup {
  attached.add(el);
  const steps = threshold === 0 ? [0] : Array.from(new Set([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, threshold])).sort();
  const io = new IntersectionObserver((entries) => {
    let hit = false;
    for (const e of entries) {
      if (e.isIntersecting && e.intersectionRatio >= threshold) { hit = true; break; }
      if (e.rootBounds && e.boundingClientRect.height > e.rootBounds.height && threshold) {
        const need = Math.floor(10 * ((e.rootBounds.height * threshold) / e.boundingClientRect.height)) / 10;
        if ((e.isIntersecting || e.intersectionRatio) && e.intersectionRatio >= need) { hit = true; break; }
      }
    }
    if (hit) { io.disconnect(); enter(); return; }
    for (const e of entries) {
      const r = e.boundingClientRect;
      if (r.width && r.height && r.y < 0) { io.disconnect(); overshoot(); return; }
    }
  }, { rootMargin: distance, threshold: steps });
  io.observe(el);
  return () => io.disconnect();
}

export function revealElement(el: HTMLElement, opts: { delay?: number } = {}, instant = false, defaults = DEFAULTS) {
  const type = el.getAttribute("data-reveal") ?? "";
  const delay = Number(attr(el, "data-reveal-delay", defaults.delay)) || 0;
  const durationAttr = el.getAttribute("data-reveal-duration");
  const stagger = (Number(attr(el, "data-reveal-stagger", 0)) || 0) * defaults.staggerDelay;
  const repeat = attr(el, "data-reveal-repeat", false) === true;
  showImages(el);
  if (repeat) el.setAttribute("data-reveal-visible", "true");
  return transition(el, type, {
    delay: instant ? 0 : (opts.delay ?? 0) + delay + stagger,
    duration: instant ? undefined : durationAttr ? Number(durationAttr) : undefined,
    before: () => {
      if (repeat) return;
      el.setAttribute("data-reveal-old", el.getAttribute("data-reveal") ?? "");
      el.removeAttribute("data-reveal");
    },
  }, instant);
}

export function initReveal(root: HTMLElement, opts: { asContainer?: boolean } = {}): Cleanup {
  const offs: Cleanup[] = [];
  const containers = opts.asContainer ? [root] : [root, ...Array.from(root.querySelectorAll<HTMLElement>('[data-plugin~="reveal"]'))].filter((c) => c.matches('[data-plugin~="reveal"]'));
  for (const c of containers) {
    const o = {
      ...DEFAULTS,
      groupDistance: margin(attr(c, "data-reveal-group-distance", DEFAULTS.groupDistance)),
      elementDistance: margin(attr(c, "data-reveal-element-distance", DEFAULTS.elementDistance)),
      delay: Number(attr(c, "data-reveal-delay", DEFAULTS.delay)) || DEFAULTS.delay,
      enableMq: (c.getAttribute("data-reveal-enable-mq") ?? DEFAULTS.enableMq) as string,
    };
    if (o.enableMq && o.enableMq !== "null" && !matches(o.enableMq)) {
      // no reveal on this device: the content is simply shown (elements of a nested reveal container are left to it)
      const own = [c, ...Array.from(c.querySelectorAll<HTMLElement>("[data-reveal]"))].filter((el) => {
        if (!el.hasAttribute("data-reveal")) return false;
        const owner = el.parentElement?.closest('[data-plugin~="reveal"]') ?? null;
        return el === c || !owner || owner === c || !c.contains(owner);
      });
      own.forEach((el) => {
        el.setAttribute("data-reveal-old", el.getAttribute("data-reveal") ?? "");
        el.removeAttribute("data-reveal");
      });
      continue;
    }
    const groups = [c, ...Array.from(c.querySelectorAll<HTMLElement>("[data-reveal-group]"))].filter((g) => g.hasAttribute("data-reveal-group") && (!g.getAttribute("data-reveal-group") || matches(g.getAttribute("data-reveal-group"))));
    for (const g of groups) {
      if (attached.has(g)) continue;
      const distance = margin(attr(g, "data-reveal-distance", o.groupDistance));
      const threshold = Number(attr(g, "data-reveal-threshold", o.groupThreshold));
      const run = (instant: boolean) => {
        const d = Number(attr(g, "data-reveal-delay", o.delay)) || 0;
        g.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => revealElement(el, { delay: d }, instant, o));
      };
      offs.push(inview(g, distance, threshold, () => run(false), () => run(true)));
    }
    const inGroup = (el: Element) => groups.some((g) => g.contains(el));
    const singles = [c, ...Array.from(c.querySelectorAll<HTMLElement>("[data-reveal]"))].filter((el) => el.hasAttribute("data-reveal") && !inGroup(el));
    for (const el of singles) {
      if (attached.has(el)) continue;
      const distance = margin(attr(el, "data-reveal-distance", o.elementDistance));
      const threshold = Number(attr(el, "data-reveal-threshold", o.elementThreshold));
      offs.push(inview(el, distance, threshold, () => revealElement(el, {}, false, o), () => revealElement(el, {}, true, o)));
    }
  }
  return () => offs.forEach((f) => f());
}

/**
 * After the preloader: everything in the page not already watched by a section — the header, the opening titles —
 * is revealed the same way, with the page container as the reveal container.
 */
export const revealContent = (wrapper: HTMLElement) => initReveal(wrapper, { asContainer: true });
