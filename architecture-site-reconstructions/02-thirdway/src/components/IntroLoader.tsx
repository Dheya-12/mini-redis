"use client";

import { useEffect, useRef } from "react";
import { gsap, markIntroDone, reducedMotion } from "@/lib/motion";

/**
 * First-visit intro on the home page: the TW monogram animation (Lottie) plays on a warm-white
 * sheet, then four panels pull away from the centre — first to a portrait "window" onto the hero
 * film, then fully open — while the film scales up behind them.
 */
const REVEAL_AT = 4.7; // seconds after the monogram starts, measured on the live site

export default function IntroLoader() {
  const root = useRef<HTMLDivElement>(null);
  const logo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current!;
    // decided before first paint by the inline script in the layout (home page, first load only)
    const active = document.documentElement.dataset.intro === "1" && !reducedMotion();
    if (active) el.classList.add("is-playing");
    delete document.documentElement.dataset.intro;
    if (!active) {
      el.remove();
      markIntroDone();
      return;
    }
    const [top, bottom, left, right] = [...el.querySelectorAll<HTMLElement>("[data-panel]")];
    const media = document.querySelector<HTMLElement>("[data-hero-media] > div > div");
    let anim: { destroy(): void } | null = null;
    let cancelled = false;

    import("lottie-web/build/player/lottie_light").then(async ({ default: lottie }) => {
      if (cancelled) return;
      const data = (await import("@/content/intro-lottie.json")).default;
      anim = lottie.loadAnimation({
        container: logo.current!,
        renderer: "svg",
        loop: false,
        autoplay: true,
        animationData: structuredClone(data),
        rendererSettings: { preserveAspectRatio: "xMidYMid slice" },
      });
    });

    if (media) gsap.set(media, { scale: 0.6422, transformOrigin: "50% 50%" });
    const tl = gsap.timeline({ delay: REVEAL_AT });
    tl.set([top, bottom], { scaleY: 0.96 })
      .set([left, right], { scaleX: 0.712 })
      .to([top, bottom], { scaleY: 0.42, duration: 0.45, ease: "power3.out" })
      .to(logo.current, { opacity: 0, duration: 1.3, ease: "power1.in" }, 0)
      .to([top, bottom], { scaleY: 0, duration: 0.6, ease: "power3.inOut" }, 1.1)
      .to([left, right], { scaleX: 0, duration: 0.6, ease: "power3.inOut" }, 1.1)
      .add(() => markIntroDone(), 1.45)
      .set(el, { autoAlpha: 0 });
    if (media) tl.to(media, { scale: 1, duration: 1.7, ease: "power2.inOut" }, 0);

    return () => {
      cancelled = true;
      tl.kill();
      anim?.destroy();
      markIntroDone();
    };
  }, []);

  return (
    <div ref={root} aria-hidden="true" className="intro-overlay pointer-events-none fixed inset-0 z-[1050]">
      <div ref={logo} className="absolute inset-0 m-auto flex items-center justify-center" />
      <div data-panel className="absolute inset-x-0 top-0 h-1/2 origin-top bg-warm-white" />
      <div data-panel className="absolute inset-x-0 bottom-0 h-1/2 origin-bottom bg-warm-white" />
      <div data-panel className="absolute inset-y-0 left-0 w-1/2 origin-left bg-warm-white" />
      <div data-panel className="absolute inset-y-0 right-0 w-1/2 origin-right bg-warm-white" />
    </div>
  );
}
