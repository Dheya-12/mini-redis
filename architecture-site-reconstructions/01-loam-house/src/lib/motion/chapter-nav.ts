"use client";

import { gsap, ScrollSmoother, ScrollTrigger } from "./gsap";

/**
 * Every chapter rests top-aligned; navigation only ever *glides* between those rests so
 * the scrubbed reveals have time to play. One primitive (`glideTo`), several inputs:
 *  - desktop: wheel / keys step one chapter, in-page links jump, a released scrollbar
 *    carries its momentum into the nearest chapter;
 *  - touch: the finger scrolls 1:1, and a release coasts into the chapter nearest the
 *    projected landing point with its speed matched to the flick.
 */
const NAV_DURATION = 1.3;
const NAV_EASE = "sine.out";
const SETTLE_EASE = "power3.out";
const SETTLE_V0 = 4; // initial-speed factor of power3.out; must match SETTLE_EASE
const SETTLE_COAST = 0.4;
const SETTLE_MIN = 0.7;
const TOUCH_COAST = 0.25;
const TOUCH_THROW = 250; // px/s of clear directional intent

type ChapterEl = HTMLElement & { __stop?: number };

function scrollY() {
  const smoother = ScrollSmoother.get();
  return smoother ? smoother.scrollTop() : window.scrollY;
}
function setScrollY(y: number) {
  const smoother = ScrollSmoother.get();
  if (smoother) smoother.scrollTop(y);
  else window.scrollTo(0, y);
}
function pageTop(el: HTMLElement) {
  let top = 0;
  let node: HTMLElement | null = el;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
}

/** Rest points: every chapter top (chapters sharing a position share a stop). */
export function chapterStops(chapters: ChapterEl[]) {
  const max = ScrollTrigger.maxScroll(window);
  const stops: number[] = [];
  for (const ch of chapters) {
    const top = Math.min(pageTop(ch), max);
    if (stops.length && Math.abs(top - stops[stops.length - 1]) < 2) {
      ch.__stop = stops.length - 1;
      continue;
    }
    ch.__stop = stops.length;
    stops.push(top);
  }
  return stops;
}

function nearestStop(stops: number[], y: number) {
  let best = 0;
  let distance = Infinity;
  stops.forEach((top, i) => {
    const d = Math.abs(top - y);
    if (d < distance) {
      distance = d;
      best = i;
    }
  });
  return best;
}

function createGlider(chapters: ChapterEl[]) {
  let tween: gsap.core.Tween | null = null;
  let locked = false;
  let unlockTimer = 0;
  return {
    get locked() {
      return locked;
    },
    kill() {
      tween?.kill();
      locked = false;
    },
    to(index: number, duration = NAV_DURATION, ease = NAV_EASE) {
      const stops = chapterStops(chapters);
      const i = Math.max(0, Math.min(stops.length - 1, index));
      const pos = { v: scrollY() };
      locked = true;
      tween?.kill();
      tween = gsap.to(pos, {
        v: stops[i],
        duration,
        ease,
        overwrite: true,
        onUpdate: () => setScrollY(pos.v),
        onComplete: () => {
          locked = false;
        },
      });
      window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(() => (locked = false), duration * 1000 + 250);
    },
    dispose() {
      tween?.kill();
      window.clearTimeout(unlockTimer);
    },
  };
}

/** Resolves an in-page href to the stop index of the chapter that holds its target. */
function stopForHref(chapters: ChapterEl[], href: string): number | null {
  chapterStops(chapters);
  if (href === "#top") return 0;
  const target = document.getElementById(href.slice(1));
  if (!target) return null;
  const chapter = chapters.find((ch) => ch === target || ch.contains(target));
  return chapter?.__stop ?? null;
}

function inPageLinks() {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')).filter((a) => {
    const href = a.getAttribute("href") ?? "";
    return href.length > 1 && (href === "#top" || document.getElementById(href.slice(1)));
  });
}

/** Desktop (≥801px) chapter navigation. Returns a disposer. */
export function desktopChapterNav(chapters: ChapterEl[]) {
  const glide = createGlider(chapters);
  const step = (dir: number) => {
    if (glide.locked) return;
    glide.to(nearestStop(chapterStops(chapters), scrollY()) + dir);
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (!glide.locked) step(e.deltaY > 0 ? 1 : -1);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.matches("input,textarea,select") || t.isContentEditable)) return;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      glide.to(0);
    } else if (e.key === "End") {
      e.preventDefault();
      glide.to(1e9);
    }
  };
  // Longer jumps glide a little longer so far links don't blur past everything.
  const onLink = (e: MouseEvent) => {
    const href = (e.currentTarget as HTMLAnchorElement).getAttribute("href") ?? "";
    const stop = stopForHref(chapters, href);
    if (stop == null) return;
    e.preventDefault();
    const jump = Math.abs(stop - nearestStop(chapterStops(chapters), scrollY()));
    glide.to(stop, Math.min(NAV_DURATION + (jump - 1) * 0.18, 2.2));
  };

  // Scrollbar: free while held; on release, project the momentum and settle.
  let holding = false;
  const isBarGrab = (e: MouseEvent) =>
    e.clientX >= document.documentElement.clientWidth ||
    e.target === document.documentElement ||
    e.target === document.body;
  const onDown = (e: MouseEvent) => {
    if (!isBarGrab(e)) return;
    holding = true;
    glide.kill();
  };
  const onUp = () => {
    if (!holding) return;
    holding = false;
    const velocity = ScrollSmoother.get()?.getVelocity() ?? 0;
    const stops = chapterStops(chapters);
    const i = nearestStop(stops, scrollY() + velocity * SETTLE_COAST);
    const distance = stops[i] - scrollY();
    if (Math.abs(distance) < 6) return;
    const speed = Math.abs(velocity);
    const duration = speed > 60 ? (Math.abs(distance) * SETTLE_V0) / speed : NAV_DURATION;
    glide.to(i, Math.max(SETTLE_MIN, Math.min(duration, 1.6)), SETTLE_EASE);
  };

  const links = inPageLinks();
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);
  window.addEventListener("pointerdown", onDown, true);
  window.addEventListener("pointerup", onUp, true);
  links.forEach((a) => a.addEventListener("click", onLink));
  return () => {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("pointerdown", onDown, true);
    window.removeEventListener("pointerup", onUp, true);
    links.forEach((a) => a.removeEventListener("click", onLink));
    glide.dispose();
  };
}

/** Touch (≤800px) chapter navigation. Returns a disposer. */
export function touchChapterNav(chapters: ChapterEl[]) {
  const glide = createGlider(chapters);
  const menuStripe = document.querySelector<HTMLElement>("[data-menu-sheet] [data-menu-stripe]");
  const menu = document.querySelector<HTMLElement>("[data-menu-sheet]");

  const onLink = (e: MouseEvent) => {
    const a = e.currentTarget as HTMLAnchorElement;
    const stop = stopForHref(chapters, a.getAttribute("href") ?? "");
    if (stop == null) return;
    e.preventDefault();
    const go = () => {
      const jump = Math.abs(stop - nearestStop(chapterStops(chapters), scrollY()));
      glide.to(stop, Math.min(NAV_DURATION + (jump - 1) * 0.18, 2.2));
    };
    // Links inside the menu wait for the sheet to finish closing before travelling.
    if (menu?.contains(a) && menuStripe) {
      let fired = false;
      const fire = () => {
        if (fired) return;
        fired = true;
        go();
      };
      const onEnd = (ev: TransitionEvent) => {
        if (ev.propertyName !== "transform") return;
        menuStripe.removeEventListener("transitionend", onEnd);
        fire();
      };
      menuStripe.addEventListener("transitionend", onEnd);
      window.setTimeout(fire, 950);
    } else go();
  };

  const observer = ScrollTrigger.observe({
    target: document.documentElement,
    type: "touch",
    preventDefault: true,
    tolerance: 4,
    onPress: () => glide.kill(),
    // Observer deltas follow the finger; scroll intent is the inverse.
    onChangeY: (self) => setScrollY(scrollY() - self.deltaY),
    onRelease: (self) => {
      const velocity = -self.velocityY;
      const stops = chapterStops(chapters);
      const here = nearestStop(stops, scrollY());
      let i = nearestStop(stops, scrollY() + velocity * TOUCH_COAST);
      // A definite flick always advances at least one beat.
      if (Math.abs(velocity) > TOUCH_THROW && i === here) i = here + (velocity > 0 ? 1 : -1);
      i = Math.max(0, Math.min(stops.length - 1, i));
      const distance = stops[i] - scrollY();
      if (Math.abs(distance) < 6) return;
      const speed = Math.abs(velocity);
      const matched = speed > 60 ? (Math.abs(distance) * SETTLE_V0) / speed : NAV_DURATION;
      const maxDuration = 1.6 * Math.max(1, Math.abs(distance) / window.innerHeight);
      if (matched > maxDuration) {
        // A lazy flick can't honestly be speed-matched over a whole beat: use the wheel glide.
        glide.to(i, NAV_DURATION * Math.max(1, Math.abs(distance) / window.innerHeight), NAV_EASE);
      } else {
        glide.to(i, Math.max(SETTLE_MIN, matched), SETTLE_EASE);
      }
    },
  });

  const links = inPageLinks();
  links.forEach((a) => a.addEventListener("click", onLink));
  return () => {
    observer.kill();
    links.forEach((a) => a.removeEventListener("click", onLink));
    glide.dispose();
  };
}
