/**
 * Preloader (desktop and tablets; phones open straight away).
 *
 * On the first visit to a page that has it, the intro preloader draws the monogram in four strokes as the media of
 * the first two screens load (progress = average of a timer that has no minimum and the share of media loaded,
 * eased 15 % per frame; stroke n follows 4 × progress − n). When everything has arrived it fades out ("fade-out block",
 * 1.6 s) and, one second later, the page's own content is revealed — the header and the opening titles.
 * Later visits and pages without the intro skip the drawing and reveal their content once their media are in.
 */
import { state, type Cleanup } from "@/lib/runtime";
import { matches } from "@/lib/mq";
import { load, HIDDEN_NOW } from "./appear";
import { revealContent } from "./reveal";
import { transition } from "./transition";
import { ensureSplitting } from "./split";

/** a value that follows its target by a fixed share per frame */
class Follower {
  value = 0;
  target = 0;
  private raf = 0;
  constructor(private strength: number, private onUpdate: (v: number) => void) {}
  set(t: number) {
    this.target = t;
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  }
  private tick = () => {
    this.raf = 0;
    this.value += (this.target - this.value) * this.strength;
    if (Math.abs(this.target - this.value) < 1e-4) this.value = this.target;
    this.onUpdate(this.value);
    if (this.value !== this.target) this.raf = requestAnimationFrame(this.tick);
  };
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; }
}

/** media within the first two screens, visible at this breakpoint and not inside a modal */
function introMedia(root: HTMLElement): Element[] {
  const hidden = HIDDEN_NOW();
  const lazy = Array.from(root.querySelectorAll('iframe[data-plugin~="appear"], img[data-plugin~="appear"], picture[data-plugin~="appear"]'));
  const plain = Array.from(root.querySelectorAll("img")).filter((i) => !i.matches('[data-plugin~="appear"]') && !i.closest('picture[data-plugin~="appear"]'));
  const videos = Array.from(root.querySelectorAll("video")).filter((v) => v.getBoundingClientRect().height);
  return [...lazy, ...plain, ...videos].filter((el) => {
    if (el.closest(hidden) || el.closest(".modal")) return false;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height && !(el as HTMLElement).offsetParent) return false;
    return r.top < 2 * window.innerHeight;
  });
}

/** resolves when an element's media has loaded (or failed, or after 10 s) */
function whenLoaded(el: Element): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, 10000);
    const done = () => { clearTimeout(timer); resolve(); };
    if (el.matches("video")) {
      const v = el as HTMLVideoElement;
      if (v.readyState >= 4) { done(); return; }
      v.addEventListener("canplay", done, { once: true });
      v.addEventListener("error", done, { once: true });
      if (v.preload === "none") { v.preload = "auto"; v.load(); }
      return;
    }
    if (el.matches('[data-plugin~="appear"]')) load(el);
    const img = el.matches("img") ? (el as HTMLImageElement) : el.querySelector("img");
    if (!img || img.complete) { done(); return; }
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  });
}

export function initPreloader(root: HTMLElement, hasIntro: boolean): Cleanup {
  const first = !state.firstLoaded;
  state.firstLoaded = true;
  const intro = document.querySelector<HTMLElement>(".preloader--intro");
  const playIntro = first && hasIntro && !!intro;
  if (intro && !playIntro) { intro.classList.add("is-hidden"); intro.setAttribute("aria-hidden", "true"); }
  const timers: number[] = [];
  let offReveal: Cleanup = () => {};
  let alive = true;

  const followers = playIntro
    ? Array.from(intro!.querySelectorAll<SVGElement>(".js-preloader-item")).map((item) => new Follower(0.15, (v) => item.style.setProperty("--progress-svg", String(v))))
    : [];
  const overall = new Follower(0.15, (v) => {
    intro?.style.setProperty("--progress", String(v));
    intro?.style.setProperty("--progress-percent", String(Math.round(v * 100)));
  });
  const progress = (share: number) => {
    const p = (1 + share) / 2;
    overall.set(p);
    followers.forEach((f, i) => f.set(Math.max(0, Math.min(1, 4 * p - i))));
  };

  const complete = () => {
    if (!alive) return;
    progress(1);
    if (playIntro) {
      timers.push(window.setTimeout(() => {
        transition(intro!, intro!.getAttribute("data-preloader-intro-animation-name-out") ?? "fade-out").then(() => intro!.setAttribute("aria-hidden", "true"));
      }, 150));
      timers.push(window.setTimeout(() => { ensureSplitting().then(() => { if (alive) offReveal = revealContent(root); }); }, 1000));
    } else ensureSplitting().then(() => { if (alive) offReveal = revealContent(root); });
  };

  if (!first || !matches("md-up")) complete();
  else {
    const media = introMedia(root);
    let n = 0;
    progress(0);
    Promise.all(media.map((m) => whenLoaded(m).then(() => { n++; progress(n / media.length); }))).then(complete);
  }

  return () => {
    alive = false;
    timers.forEach(clearTimeout);
    followers.forEach((f) => f.stop());
    overall.stop();
    offReveal();
  };
}
