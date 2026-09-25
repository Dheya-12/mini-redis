"use client";

import { SplitText } from "./gsap";

type Splittable = HTMLElement & { __split?: SplitText; __lines?: HTMLElement[] };

/**
 * Splits a headline into measured lines (each wrapped in `.split-line`), caching the
 * result on the element so rebuilding a timeline never re-splits already-split lines.
 */
export function splitLines(el: HTMLElement | null): HTMLElement[] {
  if (!el) return [];
  const node = el as Splittable;
  if (node.__lines) return node.__lines;
  try {
    node.__split = new SplitText(node, { type: "lines", linesClass: "split-line" });
    node.__lines = node.__split.lines as HTMLElement[];
  } catch {
    node.__lines = [node];
  }
  return node.__lines;
}

/** Restores the original markup so lines can be re-measured (e.g. after a width change). */
export function unsplitLines(el: HTMLElement) {
  const node = el as Splittable;
  node.__split?.revert();
  node.__split = undefined;
  node.__lines = undefined;
}
