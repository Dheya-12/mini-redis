import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import type Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);
gsap.defaults({ ease: "none" });

export { gsap, ScrollTrigger, SplitText };

/**
 * Site-wide state shared by the behaviours. The original drives everything through window events
 * (preloader_complete, intro_complete, stack, media_focus …); the same names are used here.
 */
export const state = {
  /** the preloader and first-visit intro have run */
  firstLoaded: false,
  /** the home intro plays again when coming back to the home page from another section */
  replayIntro: false,
  lenis: null as Lenis | null,
  /** home → product focus transition in progress (product page reveals its images later) */
  productFocusTransition: false,
  /** scroll position and stack selection to restore when returning from a product page */
  productOrigin: null as null | { scroll: number; index: number; preserveStack: boolean },
};

export type Cleanup = () => void;

export const emit = (name: string, detail?: unknown): void => { window.dispatchEvent(new CustomEvent(name, { detail })); };

export function on(name: string, fn: (e: Event) => void, opts?: AddEventListenerOptions): Cleanup {
  window.addEventListener(name, fn, opts);
  return () => window.removeEventListener(name, fn, opts);
}

/** phones and small tablets use the single-column layout (max-width: 639px) */
export const isMobile = () => window.innerWidth < 640;

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
