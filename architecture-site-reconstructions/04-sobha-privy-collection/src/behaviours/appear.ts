/**
 * Lazy media (`data-plugin~="appear"`).
 *
 * Images and <picture>s carry their real sources in data-src / data-srcset and a sized SVG placeholder in src. They
 * load when within 600 px of the viewport, or earlier when the browser is idle (unless hidden at the current
 * breakpoint). Once loaded they drop `is-invisible--js` and become visible.
 */
import { matches } from "@/lib/mq";
import type { Cleanup } from "@/lib/runtime";

const loaded = new WeakSet<Element>();

function swapSources(el: Element) {
  const nodes = el.matches("img, source") ? [el] : Array.from(el.querySelectorAll("source, img"));
  for (const n of nodes) {
    const srcset = n.getAttribute("data-srcset");
    const src = n.getAttribute("data-src");
    if (srcset) { n.setAttribute("srcset", srcset); n.removeAttribute("data-srcset"); }
    if (src) { n.setAttribute("src", src); n.removeAttribute("data-src"); }
  }
}

/** loads an element's media, then shows it */
export function load(el: Element) {
  if (loaded.has(el)) return;
  loaded.add(el);
  swapSources(el);
  const img = el.matches("img") ? (el as HTMLImageElement) : el.querySelector("img");
  const done = () => el.classList.remove("is-invisible--js");
  if (!img || img.complete) { done(); return; }
  // decode first so the image appears whole
  img.decode().then(done, done);
}

/** loads every lazy image inside an element (a reveal or a slider coming into view) */
export function showImages(root: Element) {
  const els = root.matches('[data-plugin~="appear"]') ? [root] : [];
  els.push(...Array.from(root.querySelectorAll('[data-plugin~="appear"]')));
  els.forEach(load);
}

const HIDDEN_NOW = () => [
  ".is-hidden--js",
  document.documentElement.classList.contains("has-hover") ? ".is-hidden--hover" : ".is-hidden--no-hover",
  window.matchMedia("(orientation: landscape)").matches ? ".is-hidden--landscape" : ".is-hidden--portrait",
  matches("sm-up") ? ".is-hidden--sm-up" : ".is-hidden--xs",
  matches("md-up") ? ".is-hidden--md-up" : ".is-hidden--sm-down",
  matches("lg-up") ? ".is-hidden--lg-up" : ".is-hidden--md-down",
  matches("xl-up") ? ".is-hidden--xl-up" : ".is-hidden--lg-down",
  matches("xxl-up") ? ".is-hidden--xxl-up" : ".is-hidden--xl-down",
  matches("xxxl-up") ? ".is-hidden--xxxl-up" : ".is-hidden--xxl-down",
].join(",");

export function initAppear(root: HTMLElement): Cleanup {
  const els = Array.from(root.querySelectorAll('[data-plugin~="appear"]'));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { io.unobserve(e.target); load(e.target); }
  }, { rootMargin: "600px 0px 600px 0px", threshold: 0 });
  els.forEach((el) => io.observe(el));
  // idle-time preloading of everything visible at this breakpoint (media in closed modals waits for the modal)
  const idle: number[] = [];
  const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200));
  const cic = window.cancelIdleCallback ?? clearTimeout;
  const hidden = HIDDEN_NOW();
  for (const el of els) {
    if (el.closest('.modal[aria-hidden="true"]') || el.closest(hidden)) continue;
    idle.push(ric(() => load(el)) as number);
  }
  return () => { io.disconnect(); idle.forEach((h) => cic(h)); };
}
