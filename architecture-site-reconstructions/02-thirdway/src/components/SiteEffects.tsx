"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { initContact, initCookies, initFooter, initHeader, initSmooth, initTransitions } from "@/behaviours/chrome";

type Fact = { distance: number; text: string; image: string | null; href: string | null };

/** Behaviour for the persistent chrome (header, menu, cookie UI, contact modal, footer, transitions). */
export default function SiteEffects({ facts }: { facts: Fact[] }) {
  const router = useRouter();
  useEffect(() => {
    const offs = [
      initSmooth(),
      initHeader(),
      initCookies(),
      initContact(),
      initFooter(facts),
      initTransitions((href) => router.push(href, { scroll: false })),
    ];
    return () => offs.forEach((off) => off());
  }, [router, facts]);
  return null;
}
