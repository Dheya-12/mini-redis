import { gsap, ScrollTrigger, afterIntro, runtime, isDesktop } from "@/lib/motion";
import { revealLines, revealFade } from "./reveal";
import { toDom } from "@/lib/tree-dom";
import type { TreeNode } from "@/lib/tree";
import teams from "@/content/teams.json";

/* ------------------------------------------------------------------ hero with background film */

/** Hero headline / scroll cue shift while the cookie banner overlaps them (classes toggled, CSS transitions animate). */
const H1_SHIFT = ["-translate-y-[90px]", "lg:-translate-y-[50px]"];
const CUE_SHIFT = ["-translate-y-[29px]", "lg:translate-y-[24px]"];

export function playHeroMedia(section: HTMLElement) {
  const video = section.querySelector<HTMLVideoElement>("video[data-src]");
  if (!video) return;
  video.muted = true;
  video.src = video.dataset.src!;
  const poster = video.nextElementSibling as HTMLElement | null;
  video.addEventListener("playing", () => poster?.style.setProperty("opacity", "0"), { once: true });
  video.play().catch(() => {});
}

export function initHomeHero(section: HTMLElement) {
  const layer = section.querySelector<HTMLElement>("[data-hero-media]");
  const cover = section.querySelector<HTMLElement>(":scope > [aria-hidden='true'].bg-warm-white");
  const h1 = section.querySelector<HTMLElement>("h1");
  const cue = h1?.nextElementSibling as HTMLElement | null;
  const copy = section.querySelector<HTMLElement>(".pointer-events-auto.col-span-full");
  cover?.remove();
  playHeroMedia(section);
  if (h1) gsap.set(h1, { visibility: "hidden" });
  if (copy) gsap.set(copy, { y: 24, autoAlpha: 0 });

  const syncCookieShift = () => {
    const on = runtime.cookieBannerVisible;
    H1_SHIFT.forEach((c) => h1?.classList.toggle(c, on));
    CUE_SHIFT.forEach((c) => cue?.classList.toggle(c, on));
    if (cue) gsap.to(cue, { autoAlpha: on ? 0 : 1, duration: 0.5 });
  };
  window.addEventListener("tw:cookie-banner", syncCookieShift);

  afterIntro(() => {
    if (h1) revealLines(h1, { immediate: true });
    if (copy) revealFade(copy);
    syncCookieShift();
  });

  // the fixed film layer is switched off once the hero has scrolled away
  const st = layer
    ? ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        onToggle: (self) => layer.classList.toggle("hidden", !self.isActive),
        onRefresh: (self) => layer.classList.toggle("hidden", !self.isActive && self.progress >= 1),
      })
    : null;
  return () => {
    window.removeEventListener("tw:cookie-banner", syncCookieShift);
    st?.kill();
  };
}

/* ------------------------------------------------------------------ featured projects (pinned stack) */

type Featured = { title: string; location: string | null; type: string | null; size: string | null; slug: string; team: string | null; quote: string; name: string; position: string };
const pad = (n: number) => String(n).padStart(2, "0");

export function initFeaturedProjects(section: HTMLElement) {
  const items: Featured[] = JSON.parse(section.dataset.items || "[]");
  const stage = section.querySelector<HTMLElement>(":scope > div.relative.overflow-hidden");
  const slides = [...section.querySelectorAll<HTMLElement>(".project-item")];
  if (!stage || !slides.length || !items.length) return;
  const n = slides.length;
  const q = <T extends Element = HTMLElement>(s: string) => section.querySelector<T>(s);
  const bgs = slides.map((s) => s.querySelector<HTMLElement>(".project-item--background-image-container"));
  const fading = [".project-name", ".project-specs-container", ".project-quote-container"].map((s) => q(s)).filter(Boolean) as HTMLElement[];

  slides.forEach((s, i) => {
    s.style.zIndex = String(i + 1);
    gsap.set(s, { clipPath: i ? "inset(100% 0px 0px)" : "inset(0% 0px 0px)" });
  });
  bgs.forEach((b, i) => b && gsap.set(b, { yPercent: i ? 4 : 0 }));

  const tl = gsap.timeline({ defaults: { ease: "none" } });
  for (let i = 1; i < n; i++) tl.to(slides[i], { clipPath: "inset(0% 0px 0px)", duration: 1 }, i - 1);
  // measured: the first image drifts 0 → +4 % as the section arrives, then +4 → −4 % while the next wipes in;
  // later images arrive at +4 %, settle at 0 and leave at −4 %
  bgs.forEach((b, i) => {
    if (!b || i === 0) return;
    tl.to(b, { yPercent: 0, duration: 1 }, i - 1);
    if (i < n - 1) tl.to(b, { yPercent: -4, duration: 1 }, i);
  });
  // First image, as measured on the original: two overlapping scrubbed drifts. The entry drift runs 0 → +4 % over
  // the viewport before the pin; the exit drift runs +4 → −4 % from 14 % of a viewport before the pin to the end of
  // the first wipe. Which one shows depends on how the section was reached (all eight scroll paths we sampled):
  //  - the entry drift normally renders last, so a jump across the pin start leaves the image at +4 %;
  //  - if the section is entered in one jump from above (entry drift not started yet), the exit drift wins and keeps
  //    winning until the entry drift is back at its start.
  const first = bgs[0];
  let last = [-1, -1];
  let exitOwns = false;
  const drift = (self: ScrollTrigger) => {
    if (!first) return;
    const vh = window.innerHeight;
    const y = self.scroll();
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    const pin = self.start + vh;
    const exit = clamp((y - (pin - 0.14 * vh)) / (1.14 * vh));
    const enter = clamp((y - self.start) / vh);
    const [prevEnter, prevExit] = last;
    const enterMoved = enter !== prevEnter;
    const exitMoved = exit !== prevExit;
    if (enter === 0) exitOwns = false;
    else if (enterMoved && exitMoved && prevEnter === 0) exitOwns = true;
    let v: number | null = null;
    if (exitMoved) v = 4 - 8 * exit;
    if (enterMoved && !exitOwns) v = 4 * enter;
    last = [enter, exit];
    if (v !== null) gsap.set(first, { yPercent: v });
  };
  const entry = first
    ? ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: () => `+=${2 * window.innerHeight}`,
        onUpdate: drift,
        // after a refresh, start from the value continuous scrolling would give
        onRefresh: (self) => {
          const vh = window.innerHeight;
          const enter = Math.min(1, Math.max(0, (self.scroll() - self.start) / vh));
          last = enter < 1 ? [-1, 0] : [1, -1];
          exitOwns = false;
          drift(self);
        },
      })
    : null;
  const bar = q(".progress-amount");
  if (bar) tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: n - 1, transformOrigin: "left center" }, 0);

  let current = -1;
  let swapTimer: number | undefined;
  const render = (i: number) => {
    const d = items[i];
    const set = (sel: string, text: string | null) => { const el = q(sel); if (el) el.textContent = text ?? ""; };
    set(".project-name", d.title);
    set(".quote-contents", d.quote);
    set(".quote-name", d.name);
    set(".quote-position", d.position);
    const specs = q(".project-specs-container");
    if (specs) {
      const spans = specs.querySelectorAll(":scope > span.body-small");
      const parts = [d.location, d.size, d.type].filter(Boolean) as string[];
      spans.forEach((s, k) => (s.textContent = parts[k] ?? ""));
      const logo = specs.querySelector<HTMLElement>(".team-logo");
      const svg = d.team ? (teams as unknown as Record<string, TreeNode>)[d.team] : null;
      if (logo && svg) {
        logo.setAttribute("aria-label", d.team!);
        logo.replaceChildren(toDom(svg));
      }
    }
    const pill = q(".current-project-number > span");
    if (pill) pill.textContent = pad(i + 1);
    section.querySelectorAll<HTMLAnchorElement>("a[href^='/project/']").forEach((a) => {
      a.href = `/project/${d.slug}`;
      if (a.getAttribute("aria-label")) a.setAttribute("aria-label", `View ${d.title}`);
    });
  };
  const setIndex = (i: number) => {
    if (i === current) return;
    const first = current < 0;
    current = i;
    window.clearTimeout(swapTimer);
    if (first) return render(i);
    fading.forEach((el) => el.classList.replace("opacity-100", "opacity-0"));
    swapTimer = window.setTimeout(() => {
      render(i);
      fading.forEach((el) => el.classList.replace("opacity-0", "opacity-100"));
    }, 300);
  };
  const total = q(".number-of-projects > span");
  if (total) total.textContent = pad(n);
  setIndex(0);

  const st = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    pin: stage,
    pinSpacing: false,
    scrub: true,
    animation: tl,
    // measured: captions switch about 35 % into each image wipe (desktop and mobile)
    onUpdate: (self) => setIndex(Math.min(n - 1, Math.floor(self.progress * (n - 1) + 0.65))),
  });

  // "View project" cursor that follows the pointer on desktop
  const cursor = section.querySelector<HTMLElement>(".mix-blend-exclusion");
  const hit = cursor?.parentElement?.querySelector<HTMLElement>(".z-20");
  const link = hit?.querySelector("a");
  const move = (e: PointerEvent) => {
    if (!cursor || !isDesktop()) return;
    const r = section.querySelector(".all-text-items-inner")!.getBoundingClientRect();
    gsap.to(cursor, { x: e.clientX - r.left, y: e.clientY - r.top, duration: 0.35, ease: "power3.out", overwrite: "auto" });
  };
  const enter = () => { if (!cursor) return; gsap.to(cursor, { opacity: 1, duration: 0.15 }); hit?.classList.replace("lg:cursor-pointer", "lg:cursor-none"); link?.classList.replace("cursor-pointer", "cursor-none"); };
  const leave = () => { if (!cursor) return; gsap.to(cursor, { opacity: 0, duration: 0.15 }); hit?.classList.replace("lg:cursor-none", "lg:cursor-pointer"); link?.classList.replace("cursor-none", "cursor-pointer"); };
  if (cursor) gsap.set(cursor, { xPercent: -50, yPercent: -50, x: 0, y: 0, opacity: 0 });
  hit?.addEventListener("pointermove", move);
  hit?.addEventListener("pointerenter", enter);
  hit?.addEventListener("pointerleave", leave);
  return () => {
    st.kill();
    entry?.kill();
    window.clearTimeout(swapTimer);
    hit?.removeEventListener("pointermove", move);
    hit?.removeEventListener("pointerenter", enter);
    hit?.removeEventListener("pointerleave", leave);
  };
}

/* ------------------------------------------------------------------ client logo marquees */

const MARQUEE_SPEED = 51; // px per second, measured

export function initLogoMarquees(root: HTMLElement) {
  const tweens: gsap.core.Tween[] = [];
  root.querySelectorAll<HTMLElement>("[class*='mask-image'] > div.h-full.overflow-hidden > div.flex.h-max.flex-col").forEach((col, i) => {
    const h = (col.firstElementChild as HTMLElement).offsetHeight;
    if (!h) return;
    const dur = h / MARQUEE_SPEED;
    tweens.push(i % 2 === 0
      ? gsap.fromTo(col, { y: 0 }, { y: -h, duration: dur, ease: "none", repeat: -1 })
      : gsap.fromTo(col, { y: -h }, { y: 0, duration: dur, ease: "none", repeat: -1 }));
  });
  root.querySelectorAll<HTMLElement>("[class*='mask-image'] > div.overflow-hidden > div.flex.w-max").forEach((row, i) => {
    const w = (row.firstElementChild as HTMLElement).offsetWidth;
    if (!w) return;
    const dur = w / MARQUEE_SPEED;
    tweens.push(i % 2 === 0
      ? gsap.fromTo(row, { x: 0 }, { x: -w, duration: dur, ease: "none", repeat: -1 })
      : gsap.fromTo(row, { x: -w }, { x: 0, duration: dur, ease: "none", repeat: -1 }));
  });
  return () => tweens.forEach((t) => t.kill());
}
