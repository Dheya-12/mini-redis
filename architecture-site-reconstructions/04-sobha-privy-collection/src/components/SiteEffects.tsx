"use client";

import { useEffect } from "react";
import { initSmoothScroll } from "@/behaviours/smooth";
import { initLayoutEvents } from "@/lib/layout";

/** Behaviour that lives for the whole visit (smooth scroll, layout passes on resize). */
export default function SiteEffects() {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("not-ready");
    html.classList.add("is-ready");
    const offScroll = initSmoothScroll();
    const offLayout = initLayoutEvents();
    console.log("%cReconstruction of sobha-privy-collection.com (website by Vide Infra)", "padding: 8px;");
    return () => { offLayout(); offScroll(); };
  }, []);
  return null;
}
