/**
 * Small keyframe animations on the Web Animations API, with the original's timing vocabulary:
 * durations in seconds, eases as cubic-bézier control points, keyframes as `{ prop: [from, to] }`.
 */
export const DURATION = { fast: 0.2, normal: 0.4, slow: 1, block: 1.4, title: 1.4, titleStagger: 0.02, titleSlide: 1, titleSlideStagger: 0.01, text: 0.7, textStagger: 0.04 };
export const EASE = {
  easeOut: [0.5, 0, 0.5, 1],
  easeIn: [0.47, 0.04, 0.5, -0.06],
  easeInOut: [0.55, 0, 0.1, 1],
  easeInOutSubtle: [0.25, 0.1, 0.25, 1],
  easeTitle: [0.29, 0.52, 0.5, 1],
} as const;

export type Ease = readonly number[];
export type Options = { duration?: number; delay?: number; ease?: Ease };
export type Handle = { finished: Promise<void>; cancel: () => void; finish: () => void; duration: number; delay: number };

const bezier = (e: Ease) => `cubic-bezier(${e.join(", ")})`;

/** `{ opacity: [0, 1], transform: ["translateY(110%)", "translateY(0%)"] }` → from / to keyframes */
export function animate(el: Element, props: Record<string, [string | number, string | number]>, opts: Options = {}): Handle {
  const from: Keyframe = {};
  const to: Keyframe = {};
  for (const [k, [a, b]] of Object.entries(props)) { from[k] = a; to[k] = b; }
  const duration = opts.duration ?? DURATION.normal;
  const delay = opts.delay ?? 0;
  const anim = el.animate([from, to], { duration: duration * 1000, delay: delay * 1000, easing: bezier(opts.ease ?? EASE.easeInOut), fill: "both" });
  const finished = anim.finished.then(() => undefined, () => undefined);
  return { finished, cancel: () => anim.cancel(), finish: () => anim.finish(), duration, delay };
}

/** runs several animations as one */
export function group(list: Handle[]): Handle {
  return {
    finished: Promise.all(list.map((h) => h.finished)).then(() => undefined),
    cancel: () => list.forEach((h) => h.cancel()),
    finish: () => list.forEach((h) => h.finish()),
    duration: Math.max(0, ...list.map((h) => h.duration)),
    delay: Math.min(...list.map((h) => h.delay), 0),
  };
}

/** an already finished animation */
export const none = (): Handle => ({ finished: Promise.resolve(), cancel: () => {}, finish: () => {}, duration: 0, delay: 0 });

/** keeps the end state as plain styles and drops the animation (so later style changes are not overridden) */
export function commit(el: Element) {
  for (const a of el.getAnimations()) {
    try { a.commitStyles(); } catch { /* element not rendered */ }
    a.cancel();
  }
}
