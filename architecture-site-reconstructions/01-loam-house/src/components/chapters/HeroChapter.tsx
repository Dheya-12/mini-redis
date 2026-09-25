"use client";

import { useEffect, useRef } from "react";
import { HERO } from "@/content/site";

/* eslint-disable @next/next/no-img-element -- full-bleed art-directed still, object-fit cover */

/**
 * Hero: on desktop a skyline intro clip plays once and hard-cuts into a seamless ambient
 * loop; phones get a dedicated still. The copy's entrance is driven by the motion engine.
 */
export function HeroChapter() {
  const intro = useRef<HTMLVideoElement>(null);
  const ambient = useRef<HTMLVideoElement>(null);
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    const introEl = intro.current;
    const ambientEl = ambient.current;
    if (!introEl || !ambientEl) return;
    if (window.matchMedia("(max-width: 800px)").matches) {
      introEl.pause();
      introEl.removeAttribute("autoplay");
      return;
    }
    let swapped = false;
    const warm = () => ambientEl.load();
    // Frames match exactly: start the loop just before the intro ends, then cut.
    const onTime = () => {
      if (introEl.duration && introEl.duration - introEl.currentTime < 0.25 && !swapped) {
        ambientEl.play().catch(() => {});
      }
    };
    const onEnded = () => {
      if (swapped) return;
      swapped = true;
      ambientEl
        .play()
        // Toggled imperatively: re-rendering would touch the split headline.
        .then(() => section.current?.classList.add("hero--ambient"))
        .catch(() => {});
    };
    introEl.addEventListener("playing", warm, { once: true });
    introEl.addEventListener("timeupdate", onTime);
    introEl.addEventListener("ended", onEnded);
    return () => {
      introEl.removeEventListener("playing", warm);
      introEl.removeEventListener("timeupdate", onTime);
      introEl.removeEventListener("ended", onEnded);
    };
  }, []);

  const { media } = HERO;
  return (
    <section ref={section} className="hero chapter" data-chapter="hero" aria-labelledby="hero-title">
      <video
        ref={intro}
        className="hero__media hero__video"
        data-hero-intro
        autoPlay
        muted
        playsInline
        preload="auto"
        poster={media.poster}
        aria-hidden
      >
        <source src={media.introWebm} type="video/webm" />
        <source src={media.introMp4} type="video/mp4" />
      </video>
      <video
        ref={ambient}
        className="hero__media hero__video hero__video--ambient"
        muted
        loop
        playsInline
        preload="none"
        aria-hidden
      >
        <source src={media.ambientWebm} type="video/webm" />
        <source src={media.ambientMp4} type="video/mp4" />
      </video>
      <img
        className="hero__media hero__still"
        src={media.mobileStill}
        alt="Loam House at sunset, Sandringham"
        data-hero-still
      />
      <div className="hero__shade" />
      <div className="scanlines" />

      <div className="hero__copy" data-hero="copy">
        <p className="eyebrow hero__eyebrow" data-hero="eyebrow">
          {HERO.eyebrow}
        </p>
        <h1 id="hero-title" className="hero__title" data-hero="title">
          {HERO.headline[0]}
          <br />
          <em>{HERO.headline[1]}</em>
        </h1>
        <div className="hero__bottom">
          <p className="hero__summary" data-hero="summary">
            {HERO.summary[0]}
            <br />
            {HERO.summary[1]}
          </p>
        </div>
      </div>
      <span className="impression">Artist’s impression</span>
    </section>
  );
}
