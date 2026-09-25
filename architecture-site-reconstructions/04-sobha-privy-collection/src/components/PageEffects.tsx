"use client";

import { useEffect } from "react";
import { state } from "@/lib/runtime";
import { runLayout } from "@/lib/layout";
import { initAppear } from "@/behaviours/appear";
import { initStickySliders } from "@/behaviours/stickySlider";
import { initParallax } from "@/behaviours/parallax/engine";
import { initReveal } from "@/behaviours/reveal";
import { ensureSplitting } from "@/behaviours/split";
import { initGravityWells } from "@/behaviours/smooth";
import { initFilms } from "@/behaviours/films";
import { initPreloader } from "@/behaviours/preloader";

/** Behaviour bound to one page's markup; everything it sets up is torn down when the page changes. */
export default function PageEffects({ route }: { route: string }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-page", route === "/" ? "home" : route.slice(1));
    const root = document.querySelector<HTMLElement>(`[data-route="${route}"]`);
    if (!root) return;
    const scrollY = () => state.lenis?.scroll ?? window.scrollY;
    const offAppear = initAppear(root);
    const sliders = initStickySliders(root, scrollY);
    const parallax = initParallax(root, scrollY);
    let offReveal = () => {};
    let alive = true;
    ensureSplitting().then(() => { if (alive) offReveal = initReveal(root); });
    const offWells = initGravityWells(root);
    const offFilms = initFilms(root);
    const offPreloader = initPreloader(root);
    const onScroll = () => { sliders.update(); parallax.update(); };
    const offLenis = state.lenis?.on("scroll", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    // the layout settles as fonts and images arrive: measure again at those moments
    runLayout();
    const onLoad = () => runLayout();
    window.addEventListener("load", onLoad);
    document.fonts?.ready.then(() => runLayout());
    const late = window.setTimeout(runLayout, 1000);
    return () => {
      alive = false;
      clearTimeout(late);
      window.removeEventListener("load", onLoad);
      window.removeEventListener("scroll", onScroll);
      offLenis?.();
      offPreloader();
      offFilms();
      offWells();
      offReveal();
      parallax.destroy();
      sliders.destroy();
      offAppear();
    };
  }, [route]);
  return null;
}
