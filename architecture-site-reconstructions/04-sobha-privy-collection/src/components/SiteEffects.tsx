"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { initPageTransitions } from "@/behaviours/navigation";
import { initSmoothScroll, initHashLinks } from "@/behaviours/smooth";
import { initCookieConsent } from "@/behaviours/cookies";
import { initLayoutEvents } from "@/lib/layout";

/** Behaviour that lives for the whole visit (smooth scroll, layout passes on resize). */
export default function SiteEffects({ routes }: { routes: string[] }) {
  const router = useRouter();
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("not-ready");
    html.classList.add("is-ready");
    const offScroll = initSmoothScroll();
    const offLayout = initLayoutEvents();
    const offLinks = initHashLinks();
    const offCookie = initCookieConsent();
    const offPages = initPageTransitions(router, routes);
    console.log("%cReconstruction of sobha-privy-collection.com (website by Vide Infra)", "padding: 8px;");
    return () => { offPages(); offCookie(); offLinks(); offLayout(); offScroll(); };
  }, [router, routes]);
  return null;
}
