import Lenis from "lenis";
import { gsap, ScrollTrigger, state } from "@/lib/runtime";

/** Lenis smooth scrolling with the original's settings (lerp 0.075, wheel ×1.4), driven by GSAP's ticker. */
export function initSmoothScroll() {
  history.scrollRestoration = "manual";
  const lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 1.4 });
  state.lenis = lenis;
  (window as unknown as { lenis: Lenis }).lenis = lenis;
  lenis.on("scroll", () => ScrollTrigger.update());
  const tick = (t: number) => lenis.raf(t * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  const setVh = () => document.documentElement.style.setProperty("--vh-initial", `${window.innerHeight / 100}px`);
  setVh();
  document.documentElement.style.setProperty("--vw", `${document.body.offsetWidth}px`);
  let lastW = window.innerWidth;
  const onResize = () => {
    // phones keep the initial viewport height while the address bar collapses
    if (window.innerWidth !== lastW || window.innerWidth >= 640) setVh();
    lastW = window.innerWidth;
    document.documentElement.style.setProperty("--vw", `${document.body.offsetWidth}px`);
  };
  window.addEventListener("resize", onResize);
  return () => {
    window.removeEventListener("resize", onResize);
    gsap.ticker.remove(tick);
    lenis.destroy();
    state.lenis = null;
  };
}
