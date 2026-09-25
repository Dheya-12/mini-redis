"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger, emit } from "@/lib/motion";
import { initReveals } from "@/behaviours/reveal";
import { initCarousels } from "@/behaviours/carousels";
import { initFeaturedProjects, initHomeHero, initLogoMarquees, playHeroMedia } from "@/behaviours/home";
import { initVimeoFilms } from "@/behaviours/media";
import { initBlocks } from "@/behaviours/blocks";

/** Wires the behaviours for whichever blocks the current page contains. */
export default function PageEffects({ route }: { route: string }) {
  useEffect(() => {
    const main = document.querySelector<HTMLElement>("#transition-frame > main");
    if (!main) return;
    const offs: (() => void)[] = [];
    const ctx = gsap.context(() => {
      const heroLayer = main.querySelector<HTMLElement>("[data-hero-media]");
      const homeHero = route === "/" ? heroLayer?.closest("section") ?? null : null;
      if (homeHero) offs.push(initHomeHero(homeHero));
      else main.querySelectorAll<HTMLElement>("[data-hero-media]").forEach((l) => playHeroMedia(l.parentElement!));
      main.querySelectorAll<HTMLElement>(".featured-projects-full-bleed").forEach((s) => {
        const off = initFeaturedProjects(s);
        if (off) offs.push(off);
      });
      offs.push(initCarousels(main));
      offs.push(initLogoMarquees(main));
      offs.push(initVimeoFilms(main));
      offs.push(initBlocks(main));
      // the home hero choreographs its own headline/copy after the intro
      initReveals(main, (el) => !!homeHero?.contains(el) && !el.classList.contains("scroll-fill-notrim"));
    }, main);
    // pins are created block by block; refresh top-to-bottom so later pins shift earlier triggers correctly
    const refresh = () => { ScrollTrigger.sort(); ScrollTrigger.refresh(); };
    const raf = requestAnimationFrame(refresh);
    window.addEventListener("load", refresh);
    emit("tw:page-ready", route);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("load", refresh);
      offs.forEach((off) => off?.());
      ctx.revert();
    };
  }, [route]);
  return null;
}
