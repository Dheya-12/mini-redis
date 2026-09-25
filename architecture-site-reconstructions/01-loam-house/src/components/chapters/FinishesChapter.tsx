"use client";

import { useEffect, useRef } from "react";
import { FINISHES } from "@/content/site";
import { ChapterPlate, Headline } from "./ChapterPlate";

/* eslint-disable @next/next/no-img-element -- the two image layers are swapped imperatively */

/**
 * Finishes: the mirrored frame. Each spec tag cross-dissolves the background through a
 * two-layer ping-pong, so successive clicks never flash. Layers are swapped imperatively
 * (no re-render) because the headline above is split into animated lines.
 */
export function FinishesChapter() {
  const base = useRef<HTMLImageElement>(null);
  const swap = useRef<HTMLImageElement>(null);
  const current = useRef<string>("");

  // Phones get the optimised crop for the base frame too.
  useEffect(() => {
    if (base.current && window.matchMedia("(max-width: 800px)").matches) base.current.src = FINISHES.image.mobile;
  }, []);

  const show = (desktop: string, mobile: string) => {
    const src = window.matchMedia("(max-width: 800px)").matches ? mobile : desktop;
    const baseEl = base.current;
    const swapEl = swap.current;
    if (!baseEl || !swapEl) return;
    if (!current.current) current.current = baseEl.currentSrc || baseEl.src;
    if (current.current.endsWith(src)) return;
    const preload = new Image();
    preload.onload = () => {
      if (swapEl.classList.contains("frame__swap--on")) {
        baseEl.src = src;
        swapEl.classList.remove("frame__swap--on");
      } else {
        swapEl.src = src;
        swapEl.classList.add("frame__swap--on");
      }
      current.current = src;
    };
    preload.src = src;
  };

  const { image } = FINISHES;
  return (
    <section className="frame frame--mirrored chapter" id="finishes" data-chapter="frame">
      <ChapterPlate num={FINISHES.plate.num} title={FINISHES.plate.title} />
      {/* No <picture>/srcset here: the swap sets `src`, which a matching <source> would override. */}
      <img
        ref={base}
        className="frame__image"
        src={image.src}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        style={{ ["--mobile-position" as string]: image.mobilePosition }}
      />
      <img ref={swap} className="frame__image frame__swap" alt="" aria-hidden loading="lazy" decoding="async" />
      <div className="frame__shade" />
      <div className="frame__copy">
        <div className="frame__inner">
          <p className="eyebrow frame__eyebrow" data-reveal="eyebrow">
            {FINISHES.eyebrow}
          </p>
          <Headline lines={FINISHES.headline} className="frame__title" />
          <p className="frame__lede" data-reveal="body">
            {FINISHES.lede}
          </p>
          <div className="frame__tags" data-reveal="list">
            {FINISHES.tags.map((tag) => (
              <button key={tag.label} type="button" className="frame__tag" onClick={() => show(tag.src, tag.mobile)}>
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <span className="impression">Artist’s impression</span>
    </section>
  );
}
