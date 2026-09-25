/**
 * Films: muted loops that play while on screen (the original's Kinescope players autoplay muted in the same way).
 */
import type { Cleanup } from "@/lib/runtime";

export function initFilms(root: HTMLElement): Cleanup {
  const videos = Array.from(root.querySelectorAll<HTMLVideoElement>("video.film"));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target as HTMLVideoElement;
      if (e.isIntersecting) {
        if (v.preload === "none") v.preload = "auto";
        v.play().catch(() => {});
      } else v.pause();
    }
  }, { rootMargin: "200px 0px" });
  for (const v of videos) {
    // React sets `muted` as a property only; autoplay policies look at it, so set it explicitly
    v.muted = true;
    v.setAttribute("muted", "");
    io.observe(v);
  }
  return () => io.disconnect();
}
