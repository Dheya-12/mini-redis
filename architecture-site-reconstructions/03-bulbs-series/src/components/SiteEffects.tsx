"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { defineTextElements } from "@/behaviours/text";
import { sound } from "@/behaviours/sound";
import { initSmoothScroll } from "@/behaviours/smooth";
import { initNavigation } from "@/behaviours/navigation";

/** Behaviour that lives for the whole visit: text elements, sound, smooth scroll, page transitions. */
export default function SiteEffects() {
  const router = useRouter();
  useEffect(() => {
    defineTextElements();
    sound.init();
    const offScroll = initSmoothScroll();
    const offNav = initNavigation((href) => router.push(href, { scroll: false }));
    console.log("%cReconstruction of bulbs.simondupety.com (designed & coded by Joffrey Spitzer)", "padding: 8px;");
    return () => { offNav(); offScroll(); };
  }, [router]);
  return null;
}
