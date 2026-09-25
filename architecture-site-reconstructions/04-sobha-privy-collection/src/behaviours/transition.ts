/**
 * Class-driven transitions (the stylesheet defines the start and end states).
 *
 * A named step X runs in three moments: before — `animation animation--X animation--X--inactive` with transitions
 * disabled (the start state applies instantly); transition — one frame and a short delay later the inactive class is
 * swapped for `animation--X--active` so the CSS transition runs; after — once the element's transition has ended the
 * classes are removed. An "in" sequence ends by showing the element (removing the is-hidden / is-invisible classes), an
 * "out" sequence (fade-out, slide-out-top …) by hiding it.
 */
import { splitLines, splitTitle } from "./split";

export type Step = { before?: (el: HTMLElement) => void; transition?: (el: HTMLElement) => void; after?: (el: HTMLElement) => void; delay?: number; duration?: number };

const show: Step = { before: (el) => el.classList.remove("is-hidden", "is-invisible", "is-invisible--js", "is-invisible--md-up-js") };
const hide: Step = { after: (el) => el.classList.add("is-hidden") };
/** "fade-out", "slide-out-top" … end hidden; everything else ends shown */
const isOut = (name: string) => /-out(-|$)/.test(name);

const named = (name: string): Step => ({
  before: (el) => el.classList.add("animation", `animation--${name}`, `animation--${name}--inactive`, "disable-transitions"),
  transition: (el) => { el.classList.remove(`animation--${name}--inactive`, "disable-transitions"); el.classList.add(`animation--${name}--active`); },
  after: (el) => el.classList.remove("animation", `animation--${name}`, `animation--${name}--active`),
});

const modifier = (cls: string): Step => ({ before: (el) => el.classList.add(cls), after: (el) => el.classList.remove(cls) });

const SEQUENCES: Record<string, Step[]> = {
  title: [named("title"), { before: (el) => splitTitle(el) }, show],
  text: [named("text"), { before: (el) => splitLines(el) }, show],
  gradient: [named("gradient"), { before: (el) => el.style.setProperty("--width", String(el.offsetWidth)) }, show],
  fast: [modifier("animation--fast")],
  slow: [modifier("animation--slow")],
  block: [modifier("animation--block")],
  show: [show],
};

/** the longest transition (duration + delay) currently set on the element, in ms */
function transitionTime(el: HTMLElement) {
  const cs = getComputedStyle(el);
  const list = (v: string) => v.split(",").map((s) => (s.trim().endsWith("ms") ? parseFloat(s) : parseFloat(s) * 1000) || 0);
  const d = list(cs.transitionDuration);
  const w = list(cs.transitionDelay);
  let max = 0;
  for (let i = 0; i < Math.max(d.length, w.length); i++) max = Math.max(max, (d[i % d.length] ?? 0) + (w[i % w.length] ?? 0));
  const a = list(cs.animationDuration);
  const ad = list(cs.animationDelay);
  if (cs.animationName !== "none") for (let i = 0; i < a.length; i++) max = Math.max(max, (a[i] ?? 0) + (ad[i % ad.length] ?? 0));
  return max;
}

const running = new WeakMap<HTMLElement, () => void>();

/** stops a running sequence, jumping to its end */
export function stopTransition(el: HTMLElement) { running.get(el)?.(); }

/**
 * Runs the named steps (`"slide-in-top block"`), plus optional extra steps, on an element.
 * Resolves when the transition has ended. With `instant` the end state is applied at once.
 */
export function transition(el: HTMLElement, names: string, extra: Step = {}, instant = false): Promise<void> {
  stopTransition(el);
  const steps: Step[] = [];
  for (const n of names.split(/\s+/).filter(Boolean)) steps.push(...(SEQUENCES[n] ?? [named(n), isOut(n) ? hide : show]));
  steps.push(extra);
  const run = (k: "before" | "transition" | "after") => steps.forEach((s) => s[k]?.(el));
  const delay = Math.max(16, ...steps.map((s) => s.delay ?? 0));
  const duration = steps.find((s) => s.duration)?.duration;
  return new Promise<void>((resolve) => {
    let done = false;
    let timer = 0;
    let raf = 0;
    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      running.delete(el);
      run("after");
      if (duration) { el.style.transitionDuration = ""; el.style.removeProperty("--transition-duration"); }
      resolve();
    };
    const jump = () => { if (done) return; run("transition"); finish(); };
    running.set(el, jump);
    run("before");
    if (instant) { jump(); return; }
    if (duration) { el.style.transitionDuration = duration + "ms"; el.style.setProperty("--transition-duration", duration + "ms"); }
    raf = requestAnimationFrame(() => {
      timer = window.setTimeout(() => {
        run("transition");
        timer = window.setTimeout(finish, transitionTime(el) + 50);
      }, delay);
    });
  });
}
