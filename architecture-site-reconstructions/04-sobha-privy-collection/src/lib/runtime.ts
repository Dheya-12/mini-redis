import { gsap } from "gsap";
import type Lenis from "lenis";

gsap.defaults({ ease: "none" });

export { gsap };

/** Site-wide state shared by the behaviours. */
export const state = {
  /** the preloader (and, on the first visit, the intro) has run */
  firstLoaded: false,
  lenis: null as Lenis | null,
  /** the page change in progress, set by a link and read by the arriving page (see behaviours/navigation.ts) */
  navigation: null as null | { kind: "loader" | "tabs"; route: string },
};

export type Cleanup = () => void;

export const emit = (name: string, detail?: unknown): void => { window.dispatchEvent(new CustomEvent(name, { detail })); };

export function on(name: string, fn: (e: Event) => void, opts?: AddEventListenerOptions): Cleanup {
  window.addEventListener(name, fn, opts);
  return () => window.removeEventListener(name, fn, opts);
}

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
