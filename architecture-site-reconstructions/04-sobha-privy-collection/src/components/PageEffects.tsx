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
import { initHeader } from "@/behaviours/header";
import { initContentAnimations } from "@/behaviours/contentAnimation";
import { initThreeWorlds } from "@/gl/threeWorlds";
import { initHandpicked } from "@/gl/handpicked";
import { initLocation } from "@/gl/location";
import { initIframeSize } from "@/behaviours/iframeSize";
import { initModals } from "@/behaviours/modal";
import { initMenuLinks } from "@/behaviours/menu";
import { initPointerFollowers } from "@/behaviours/pointer";
import { initMap } from "@/behaviours/map";
import { saveUtm } from "@/behaviours/cookies";
import { scrollToHash } from "@/behaviours/smooth";
import { transition } from "@/behaviours/transition";
import { initTabs } from "@/behaviours/navigation";

/** Behaviour bound to one page's markup; everything it sets up is torn down when the page changes. */
export default function PageEffects({ route, sheet, intro }: { route: string; sheet: string; intro: boolean }) {
  useEffect(() => {
    document.documentElement.setAttribute("data-page", sheet);
    const root = document.querySelector<HTMLElement>(`[data-route="${route}"]`);
    if (!root) return;
    const scrollY = () => state.lenis?.scroll ?? window.scrollY;
    // arriving from another page: a covered change starts at the top; a tab change fades in where the page was
    const nav = state.navigation;
    if (nav?.kind === "loader") { state.lenis?.scrollTo(0, { immediate: true, force: true }); window.scrollTo(0, 0); }
    let keepScroll = 0;
    if (nav?.kind === "tabs") {
      root.classList.add("is-invisible");
      transition(root, "fade-in");
      const y = nav.scroll;
      keepScroll = window.setTimeout(() => { state.lenis?.scrollTo(y, { immediate: true, force: true }); if (!state.lenis) window.scrollTo(0, y); }, 16);
    }
    const offSize = initIframeSize(root);
    const offAppear = initAppear(root);
    const sliders = initStickySliders(root, scrollY);
    const parallax = initParallax(root, scrollY);
    let offReveal = () => {};
    let alive = true;
    ensureSplitting().then(() => { if (alive) offReveal = initReveal(root); });
    const offWells = initGravityWells(root);
    const offFilms = initFilms(root);
    const offPreloader = initPreloader(root, intro);
    const header = initHeader(root, scrollY);
    const offContent = initContentAnimations(root);
    const offModals = initModals(root);
    const offMenu = initMenuLinks(root);
    const offPointer = initPointerFollowers(root);
    const offMap = initMap(root);
    const offTabs = initTabs(root);
    if (root.querySelector('[data-plugin~="utmSave"]') || root.matches('[data-plugin~="utmSave"]')) saveUtm();
    const offWorlds = [
      ...Array.from(root.querySelectorAll<HTMLElement>('[data-plugin~="threeWorldsWebGl"]')).map((el) => initThreeWorlds(el)),
      ...Array.from(root.querySelectorAll<HTMLElement>('[data-plugin~="carouselWebGl"]')).map((el) => initHandpicked(el)),
      ...Array.from(root.querySelectorAll<HTMLElement>('[data-plugin~="locationWebGl"]')).map((el) => initLocation(el)),
    ];
    const onScroll = () => { sliders.update(); parallax.update(); header.update(); };
    const offLenis = state.lenis?.on("scroll", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    // the layout settles as fonts and images arrive: measure again at those moments
    runLayout();
    const onLoad = () => { runLayout(); scrollToHash(); };
    if (document.readyState === "complete") scrollToHash();
    window.addEventListener("load", onLoad);
    document.fonts?.ready.then(() => runLayout());
    const late = window.setTimeout(runLayout, 1000);
    return () => {
      alive = false;
      clearTimeout(late);
      clearTimeout(keepScroll);
      window.removeEventListener("load", onLoad);
      window.removeEventListener("scroll", onScroll);
      offLenis?.();
      offWorlds.forEach((f) => f());
      offTabs();
      offMap();
      offPointer();
      offMenu();
      offModals();
      offContent();
      header.destroy();
      offPreloader();
      offFilms();
      offWells();
      offReveal();
      parallax.destroy();
      sliders.destroy();
      offAppear();
      offSize();
    };
  }, [route, sheet, intro]);
  return null;
}
