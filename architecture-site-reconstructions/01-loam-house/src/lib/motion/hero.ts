"use client";

import { alternateSides, gsap } from "./gsap";
import { splitLines } from "./split-lines";

/**
 * The hero is the one bespoke moment: a one-shot entrance (built paused, released the
 * instant the curtain lifts), then a scroll-tied exit. The enquiry card rises in beside
 * it on desktop and, between 801–1050px, swings through on a scrubbed rotation instead.
 *
 * Returns the paused players; call `.play(0)` on each to release them.
 */
export function buildHero(): gsap.core.Animation[] {
  const copy = document.querySelector<HTMLElement>("[data-hero='copy']");
  if (!copy) return [];
  const eyebrow = copy.querySelector("[data-hero='eyebrow']");
  const lines = splitLines(copy.querySelector<HTMLElement>("[data-hero='title']"));
  const small = Array.from(copy.querySelectorAll("[data-hero='summary']"));
  const brand = document.querySelector("[data-intro='brand']");
  const fromSide = alternateSides(0.28);
  const players: gsap.core.Animation[] = [];

  const entrance = gsap.timeline({ paused: true, defaults: { ease: "power3.out" }, onComplete: heroExit });
  entrance
    .timeScale(1.5)
    .from(brand, { opacity: 0, filter: "blur(10px)", y: -8, duration: 3.6, ease: "power1.out" }, 0)
    .from(eyebrow, { y: 46, opacity: 0, duration: 1.82 }, 1.6)
    .from(eyebrow, { filter: "blur(9px)", duration: 2.9, ease: "power1.out" }, 1.6)
    .from(lines, { x: fromSide, opacity: 0, duration: 2.6, ease: "expo.out" }, 0.05)
    .from(lines, { filter: "blur(16px)", duration: 3.06, ease: "power1.out" }, 0.05)
    .from(small, { y: 46, opacity: 0, duration: 1.82, stagger: 0.15 }, 1.6)
    .from(small, { filter: "blur(9px)", duration: 2.9, ease: "power1.out", stagger: 0.15 }, 1.6)
    .from("[data-intro='cta']", { opacity: 0, filter: "blur(8px)", duration: 1.7, stagger: 0.12, ease: "power2.out", clearProps: "filter,opacity" }, 1.6)
    .from("[data-intro='burger']", { opacity: 0, filter: "blur(8px)", duration: 1.6, ease: "power2.out", clearProps: "filter,opacity" }, 1.7);
  players.push(entrance);

  const card = document.querySelector<HTMLElement>("[data-hero='card']");
  if (card) {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1051px)", () => {
      // Rise with the house blur-resolve; the exit is armed only once the rise has landed,
      // so a refresh mid-rise can never stamp the exit's start values over it.
      let exit: gsap.core.Tween | null = null;
      const rise = gsap.from(card, {
        y: 90,
        opacity: 0,
        scale: 0.97,
        filter: "blur(12px)",
        duration: 2.2,
        ease: "power3.out",
        transformOrigin: "50% 100%",
        paused: true,
        onComplete() {
          exit = gsap.fromTo(
            card,
            { y: 0, opacity: 1, filter: "blur(0px)" },
            {
              y: -120,
              opacity: 0,
              filter: "blur(10px)",
              ease: "power2.out",
              immediateRender: false,
              scrollTrigger: { trigger: "[data-chapter='hero']", start: "3% top", end: "33% top", scrub: 1.2 },
            },
          );
        },
      });
      players.push(rise);
      return () => {
        exit?.scrollTrigger?.kill();
        exit?.kill();
      };
    });
    mm.add("(min-width: 801px) and (max-width: 1050px)", () => {
      const swing = gsap.timeline({ scrollTrigger: { trigger: card, start: "top 95%", end: "top -22%", scrub: 1 } });
      swing.fromTo(
        card,
        { xPercent: 120, rotation: 22, opacity: 0 },
        { xPercent: 0, rotation: 0, opacity: 1, ease: "power3.out", duration: 2, transformOrigin: "50% 50%" },
        0,
      );
      swing.to({}, { duration: 1.5 });
      swing.fromTo(
        card,
        { xPercent: 0, rotation: 0, opacity: 1 },
        { xPercent: -120, rotation: -22, opacity: 0, ease: "power3.in", duration: 2, transformOrigin: "50% 50%", immediateRender: false },
      );
    });
  }

  /** Scrubbed exit (explicit fromTo, refresh-safe). Blur leads. */
  function heroExit() {
    const tl = gsap.timeline({
      defaults: { ease: "power2.in" },
      scrollTrigger: { trigger: "[data-chapter='hero']", start: "top top", end: "40% top", scrub: 1.2 },
    });
    tl.fromTo(lines, { filter: "blur(0px)" }, { filter: "blur(14px)", duration: 0.5, ease: "power2.out" }, 0);
    tl.fromTo(lines, { x: 0, opacity: 1 }, { x: fromSide, opacity: 0, duration: 1, ease: "power2.out" }, 0);
    tl.fromTo(eyebrow, { y: 0, filter: "blur(0px)" }, { y: 46, filter: "blur(9px)", duration: 0.4, ease: "power2.out" }, 0);
    tl.fromTo(eyebrow, { opacity: 1 }, { opacity: 0, duration: 0.95, ease: "power1.out" }, 0);
    tl.fromTo(small, { y: 0, opacity: 1, filter: "blur(0px)" }, { y: -26, opacity: 0, filter: "blur(7px)", stagger: 0.08 }, 0.1);
  }

  return players;
}
