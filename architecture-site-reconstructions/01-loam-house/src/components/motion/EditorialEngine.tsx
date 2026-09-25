"use client";

import { useEffect } from "react";
import { withEntryCamera } from "@/lib/map/bridge";
import type { EntryCamera } from "@/lib/map/engine";
import { desktopChapterNav, touchChapterNav } from "@/lib/motion/chapter-nav";
import { chapterMoves, MAP_TIMING } from "@/lib/motion/choreography";
import { runCurtain } from "@/lib/motion/curtain";
import { ensureGsap, gsap, prefersReducedMotion, ScrollSmoother, ScrollTrigger } from "@/lib/motion/gsap";
import { buildHero } from "@/lib/motion/hero";
import { entranceLength, mirrorEase, mirroredReveal } from "@/lib/motion/mirrored-reveal";
import { unsplitLines } from "@/lib/motion/split-lines";

/**
 * The page's single motion system. One scroll model (ScrollSmoother), one reveal primitive
 * (mirrored, scroll-scrubbed chapter timelines), one navigation model (glide between
 * chapter rests). Built after fonts are ready so headline lines measure correctly.
 */
export function EditorialEngine() {
  useEffect(() => {
    const root = document.documentElement;
    if (prefersReducedMotion()) {
      root.dataset.preloader = "done";
      return;
    }
    ensureGsap();
    const ctx = gsap.context(() => {});
    const disposers: (() => void)[] = [];
    let disposed = false;

    // Smooth scroll. The wrapper's own scroll is pinned at 0 so a field's focus
    // scroll-into-view can never shift the whole page out of sync with the smoother.
    ctx.add(() => {
      ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 0.8,
        smoothTouch: 0.1,
        effects: false,
      });
    });
    const wrapper = document.getElementById("smooth-wrapper");
    const pinWrapper = () => {
      if (wrapper && (wrapper.scrollTop || wrapper.scrollLeft)) {
        wrapper.scrollTop = 0;
        wrapper.scrollLeft = 0;
      }
    };
    const onFocusIn = () => {
      let frames = 0;
      const loop = () => {
        pinWrapper();
        if (++frames < 20) requestAnimationFrame(loop);
      };
      loop();
    };
    wrapper?.addEventListener("scroll", pinWrapper, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    disposers.push(() => {
      wrapper?.removeEventListener("scroll", pinWrapper);
      document.removeEventListener("focusin", onFocusIn);
    });

    // Every visit starts at the top.
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    // The hero entrance is parked until the curtain lifts: one continuous intro.
    let heroPlayers: gsap.core.Animation[] = [];
    let heroReleased = false;
    const releaseHero = () => {
      heroReleased = true;
      heroPlayers.forEach((p) => p.play(0));
    };
    ctx.add(() => disposers.push(runCurtain(releaseHero)));

    const chapters = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
    let chapterTimelines = new Map<HTMLElement, gsap.core.Timeline[]>();

    const buildChapter = (chapter: HTMLElement) => {
      const kind = chapter.dataset.chapter;
      if (kind === "hero") return;
      if (kind === "precinct") {
        disposers.push(withEntryCamera((camera) => ctx.add(() => buildPrecinct(chapter, camera))));
        return;
      }
      const { moves, tickers } = chapterMoves(chapter);
      const tl = mirroredReveal(chapter, moves, tickers);
      chapterTimelines.set(chapter, tl ? [tl] : []);
    };

    const buildPrecinct = (chapter: HTMLElement, camera: EntryCamera) => {
      const T = MAP_TIMING;
      const { moves, tickers } = chapterMoves(chapter);
      const band = { start: `top ${T.band}%`, end: `top -${T.band}%`, scrub: T.scrub };
      const reveal = mirroredReveal(chapter, moves, tickers, band);

      // The camera flies in over the chapter's entrance and back out over its exit,
      // on the same band and scrub as the reveal.
      const camIn = entranceLength(moves);
      camera.configure(T.cameraDistance, T.cameraRotation);
      const total = camIn * 2;
      const cam = gsap
        .timeline({ scrollTrigger: { trigger: chapter, ...band } })
        .to(camera.state, { t: 1, duration: camIn, ease: T.cameraEase, onUpdate: camera.apply }, 0)
        .to(
          camera.state,
          { t: 0, duration: camIn, ease: mirrorEase(T.cameraEase), onUpdate: camera.apply, immediateRender: false },
          total - camIn,
        )
        .to({}, { duration: total }, 0);
      camera.apply();
      const timelines = [cam, ...(reveal ? [reveal] : [])];
      chapterTimelines.set(chapter, timelines);
      ScrollTrigger.refresh();
    };

    // A user flight on the map completes the entry: fast-forward any scrub still catching up.
    const onFlight = () => {
      const map = chapters.find((c) => c.dataset.chapter === "precinct");
      for (const tl of (map && chapterTimelines.get(map)) || []) tl.scrollTrigger?.getTween()?.progress(1);
    };
    window.addEventListener("precinct:flight", onFlight);
    disposers.push(() => window.removeEventListener("precinct:flight", onFlight));

    const build = () => {
      if (disposed) return;
      ctx.add(() => {
        heroPlayers = buildHero();
        if (heroReleased) heroPlayers.forEach((p) => p.play(0));
        chapters.forEach(buildChapter);
        const mm = gsap.matchMedia();
        mm.add("(min-width: 801px)", () => desktopChapterNav(chapters));
        mm.add("(max-width: 800px)", () => touchChapterNav(chapters));
        ScrollTrigger.refresh();
      });
      lastBuildWidth = window.innerWidth;
    };

    // Lines are measured at build; on a real width change, re-split and rebuild the chapters.
    let lastBuildWidth = 0;
    let resizeTimer = 0;
    const rebuildChapters = () => {
      lastBuildWidth = window.innerWidth;
      ctx.add(() => {
        const next = new Map<HTMLElement, gsap.core.Timeline[]>();
        for (const chapter of chapters) {
          if (chapter.dataset.chapter === "hero") continue;
          for (const tl of chapterTimelines.get(chapter) ?? []) {
            tl.scrollTrigger?.kill();
            tl.kill();
          }
          chapter.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => gsap.set(el, { clearProps: "all" }));
          chapter.querySelectorAll<HTMLElement>("h2[data-reveal]").forEach((h) => unsplitLines(h));
        }
        chapterTimelines = next;
        chapters.forEach((chapter) => {
          if (chapter.dataset.chapter === "precinct") {
            withEntryCamera((camera) => buildPrecinct(chapter, camera));
          } else buildChapter(chapter);
        });
        ScrollTrigger.refresh();
      });
    };
    const onResize = () => {
      if (!lastBuildWidth) return;
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (Math.abs(window.innerWidth - lastBuildWidth) >= 24) rebuildChapters();
      }, 350);
    };
    window.addEventListener("resize", onResize);
    disposers.push(() => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(resizeTimer);
    });

    // Build once fonts are ready: on the next frame, or by timeout in a background tab.
    let built = false;
    const buildOnce = () => {
      if (built) return;
      built = true;
      build();
    };
    void document.fonts.ready.then(() => {
      requestAnimationFrame(buildOnce);
      window.setTimeout(buildOnce, 1200);
    });
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    disposers.push(() => window.removeEventListener("load", onLoad));

    return () => {
      disposed = true;
      disposers.forEach((d) => d());
      ctx.revert();
      delete root.dataset.preloader;
    };
  }, []);

  return null;
}
