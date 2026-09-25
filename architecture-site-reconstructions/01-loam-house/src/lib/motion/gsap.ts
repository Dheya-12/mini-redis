"use client";

import gsap from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

let registered = false;

/** Registers the GSAP plugins once, in the browser only. */
export function ensureGsap() {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);
    // Mobile URL-bar resizes would refresh every trigger mid-scroll; ignore them.
    ScrollTrigger.config({ ignoreMobileResize: true });
    registered = true;
  }
  return { gsap, ScrollTrigger, ScrollSmoother, SplitText };
}

export { gsap, ScrollSmoother, ScrollTrigger, SplitText };

export const MOBILE_QUERY = "(max-width: 800px)";
export const isMobile = () => window.matchMedia(MOBILE_QUERY).matches;
export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Horizontal entry offset for alternating headline lines: odd lines from the right. */
export const alternateSides = (fraction = 0.28) => (i: number) =>
  (i % 2 ? 1 : -1) * Math.max(window.innerWidth, 1) * fraction;
