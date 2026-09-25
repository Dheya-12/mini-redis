import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type Lenis from "lenis";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText };

/** Shared runtime state for the chrome and the page behaviours. */
type Runtime = {
  lenis: Lenis | null;
  introDone: boolean;
  introWaiters: (() => void)[];
  cookieBannerVisible: boolean;
};

const rt: Runtime = { lenis: null, introDone: false, introWaiters: [], cookieBannerVisible: false };
export const runtime = rt;

/** Resolves once the first-visit intro has finished (immediately on later navigations). */
export function afterIntro(fn: () => void) {
  if (rt.introDone) fn();
  else rt.introWaiters.push(fn);
}
export function markIntroDone() {
  if (rt.introDone) return;
  rt.introDone = true;
  rt.introWaiters.splice(0).forEach((f) => f());
}

export const EASE = {
  reveal: "power4.out",
  inOutQuart: "cubic-bezier(0.75,0,0.25,1)",
};

/** Emits a DOM event other modules can listen for (keeps modules decoupled). */
export function emit(name: string, detail?: unknown) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;
export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
