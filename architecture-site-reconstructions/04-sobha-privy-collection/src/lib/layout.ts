/**
 * Layout passes shared by the scroll-driven behaviours.
 *
 * When the layout changes (load, resize, an image arriving, a sticky slider taking its height), every behaviour first
 * clears the styles it set (reset), then reads the geometry it needs (measure), then writes again (apply). Running
 * the three phases across all behaviours in that order avoids measuring a layout another behaviour has already
 * transformed.
 */
type Fn = () => void;
const queues = { reset: new Set<Fn>(), measure: new Set<Fn>(), apply: new Set<Fn>() };
let frame = 0;

export function addLayout(phase: keyof typeof queues, fn: Fn) {
  queues[phase].add(fn);
  return () => { queues[phase].delete(fn); };
}

export function runLayout() {
  cancelAnimationFrame(frame);
  frame = 0;
  queues.reset.forEach((f) => f());
  queues.measure.forEach((f) => f());
  queues.apply.forEach((f) => f());
}

/** coalesces requests into one pass on the next frame */
export function scheduleLayout() {
  if (!frame) frame = requestAnimationFrame(runLayout);
}

let timer = 0;
let lastWidth = 0;
let lastHeight = 0;
export function initLayoutEvents() {
  lastWidth = window.innerWidth;
  lastHeight = window.innerHeight;
  const onResize = () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (window.innerWidth === lastWidth && window.innerHeight === lastHeight) return;
      lastWidth = window.innerWidth;
      lastHeight = window.innerHeight;
      runLayout();
    }, 100);
  };
  window.addEventListener("resize", onResize);
  // as on the original's desktop scroller: every image that arrives triggers a pass (debounced 60 ms), so elements
  // are re-measured around it and anything off screen drops the styles it was last given
  let loadTimer = 0;
  const onLoad = (e: Event) => {
    if (!(e.target instanceof HTMLImageElement) || !document.documentElement.classList.contains("has-hover")) return;
    clearTimeout(loadTimer);
    loadTimer = window.setTimeout(runLayout, 60);
  };
  document.addEventListener("load", onLoad, true);
  return () => {
    clearTimeout(loadTimer);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("load", onLoad, true);
  };
}
