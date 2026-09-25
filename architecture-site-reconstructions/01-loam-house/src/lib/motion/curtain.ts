"use client";

import { gsap, isMobile, ScrollTrigger } from "./gsap";

type Unit = (done: () => void) => void;

const MAX_BLUR = 22;

/**
 * Holds the stripe curtain until the first-view media can play, the fonts are ready and
 * the hero poster has decoded. The wordmark sharpens and the counter climbs as each unit
 * lands; then the lockup fades, the stripes lift, and `onLift` releases the hero.
 */
export function runCurtain(onLift: () => void): () => void {
  const root = document.documentElement;
  const curtain = document.querySelector<HTMLElement>("[data-curtain]");
  if (!curtain) {
    onLift();
    return () => {};
  }
  root.dataset.preloader = "active";

  const logo = curtain.querySelector<HTMLImageElement>("[data-curtain='logo']");
  const counter = curtain.querySelector<HTMLElement>("[data-curtain='pct']");
  const lockup = curtain.querySelector<HTMLElement>("[data-curtain='lockup']");
  const shown = { v: 0 };
  const started = performance.now();
  let revealed = false;
  let cancelled = false;

  const paint = () => {
    if (logo) logo.style.filter = `invert(1) blur(${((1 - shown.v) * MAX_BLUR).toFixed(2)}px)`;
    if (counter) counter.textContent = String(Math.round(shown.v * 100));
  };
  paint();

  const heroMedia = isMobile()
    ? document.querySelector<HTMLImageElement>("[data-hero-still]")
    : document.querySelector<HTMLVideoElement>("[data-hero-intro]");

  const units: Unit[] = [
    (done) => {
      if (!heroMedia) return done();
      if (heroMedia instanceof HTMLVideoElement) {
        if (heroMedia.readyState >= 3) return done();
        const settle = () => {
          heroMedia.removeEventListener("canplay", settle);
          heroMedia.removeEventListener("loadeddata", settle);
          heroMedia.removeEventListener("error", settle);
          done();
        };
        heroMedia.addEventListener("canplay", settle);
        heroMedia.addEventListener("loadeddata", settle);
        heroMedia.addEventListener("error", settle);
      } else if (heroMedia.complete) {
        done();
      } else {
        heroMedia.addEventListener("load", () => done(), { once: true });
        heroMedia.addEventListener("error", () => done(), { once: true });
      }
    },
    (done) => void document.fonts.ready.then(done),
    (done) => {
      const poster = heroMedia instanceof HTMLVideoElement ? heroMedia.getAttribute("poster") : null;
      if (!poster) return done();
      const img = new Image();
      img.onload = img.onerror = () => done();
      img.src = poster;
    },
  ];

  let landed = 0;
  const bump = () => {
    if (cancelled) return;
    landed += 1;
    gsap.to(shown, {
      v: landed / units.length,
      duration: 0.8,
      ease: "power2.out",
      overwrite: "auto",
      onUpdate: paint,
      onComplete: () => {
        if (landed >= units.length) maybeReveal();
      },
    });
  };

  const maybeReveal = () => {
    if (revealed || cancelled) return;
    revealed = true;
    // A fast load still gets a felt "sharpen", then a held beat.
    const wait = Math.max(0, 550 - (performance.now() - started)) / 1000 + 0.35;
    gsap.delayedCall(wait, lift);
  };

  const lift = () => {
    gsap
      .timeline({
        onComplete: () => {
          root.dataset.preloader = "done";
          ScrollTrigger.refresh();
        },
      })
      .to(lockup, { opacity: 0, duration: 0.5, ease: "power2.in" }, 0)
      .add(() => curtain.classList.add("curtain--lift"), 0.15)
      .add(onLift, 1.15)
      .to({}, { duration: 0.5 });
  };

  units.forEach((unit) => unit(bump));
  // Safety cap: a stalled asset must never trap the visitor behind the curtain.
  const cap = gsap.delayedCall(5, () => {
    if (!revealed) gsap.to(shown, { v: 1, duration: 0.4, onUpdate: paint, onComplete: maybeReveal });
  });

  return () => {
    cancelled = true;
    cap.kill();
  };
}
