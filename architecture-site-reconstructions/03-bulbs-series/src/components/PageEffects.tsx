"use client";

import { useEffect } from "react";
import { emit, state } from "@/lib/runtime";
import { initCredits, mountScene, runPreloader } from "@/behaviours/page";

/** Wires the WebGL scene, preloader and credits for the route that just mounted. */
export default function PageEffects({ route }: { route: string }) {
  useEffect(() => {
    const view = document.querySelector<HTMLElement>(`[data-route="${route}"]`) ?? document.body;
    const offPreloader = runPreloader();
    const offCredits = initCredits(view);
    let cancelled = false;
    const origin = state.productOrigin;
    const product = !!view.querySelector(".product-slider");
    // after the home → product flight the product images take over once the flight has settled (~0.9 s)
    const delay = product && state.productFocusTransition ? 900 : 0;
    // meanwhile the other product images show as plain images, the first slot is still the flying one
    if (delay) document.body.classList.add("product-medias-preview");
    const timer = window.setTimeout(async () => {
      const scene = await mountScene({ keepPrevious: delay > 0 });
      requestAnimationFrame(() => document.body.classList.remove("product-medias-preview"));
      if (cancelled) return;
      if (origin?.preserveStack && route === "/") scene.restoreStack(origin.index);
    }, delay);
    emit("page_mounted", { route });
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.body.classList.remove("product-medias-preview");
      offCredits();
      offPreloader();
    };
  }, [route]);
  return null;
}
