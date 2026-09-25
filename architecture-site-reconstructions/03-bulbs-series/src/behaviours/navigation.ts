import { gsap, emit, state, type Cleanup } from "@/lib/runtime";
import { currentScene, placeGl } from "./page";

/**
 * Page transitions (the original uses taxi.js; here the Next.js router does the navigation):
 *  - default: the page fades out (0.5 s, power3.out), the new one fades in;
 *  - home → product: clicking a stack title flies its image to the product page's first slot, then the route
 *    changes underneath without a fade;
 *  - product → home: back to the stacked view with the same selection, at the same scroll position;
 *  - to About: the page dims (50 % black, 0.7 s) before the fade.
 * Header titles hide when the section changes and reveal again on the new page; the home intro replays when
 * the home page is reached from another section (not when coming back from a product).
 */
type Push = (href: string) => void;
const section = (p: string) => (p.startsWith("/about") ? "about" : p.startsWith("/products/") ? "product" : "home");

let busy = false;
let navToken = 0;

function waitForPage(route: string) {
  return new Promise<void>((resolve) => {
    const check = (e: Event) => {
      if ((e as CustomEvent).detail?.route !== route) return;
      window.removeEventListener("page_mounted", check);
      resolve();
    };
    window.addEventListener("page_mounted", check);
  });
}

function beforeLeave(from: string, to: string) {
  const a = section(from), b = section(to);
  const returning = a === "product" && b === "home" && !!state.productOrigin;
  state.replayIntro = b === "home" && !returning;
  if (b !== "product") state.productFocusTransition = false;
  if (a === "product" && b !== "home") state.productOrigin = null;
  const changed = !(a === "home" && b === "product") && a !== b;
  if (changed || state.replayIntro) emit("header_title_leave");
  if (state.replayIntro) emit("home_intro_start");
  return { changed, returning };
}

export async function navigate(push: Push, href: string, opts: { instant?: boolean } = {}) {
  const url = new URL(href, location.href);
  const to = url.pathname;
  const from = location.pathname;
  if (to === from || busy) return;
  busy = true;
  const token = ++navToken;
  const { changed, returning } = beforeLeave(from, to);
  const lenis = state.lenis;
  lenis?.stop();
  const toAbout = section(to) === "about";
  let dim: HTMLDivElement | null = null;
  if (!opts.instant) {
    if (toAbout) {
      dim = document.createElement("div");
      dim.className = "about-transition-dim";
      document.body.appendChild(dim);
      gsap.to(dim, { opacity: 0.5, duration: 0.7, ease: "power2.in" });
    }
    await new Promise<void>((r) => gsap.to("body", { opacity: 0, duration: 0.5, ease: "power3.out", overwrite: true, onComplete: r }));
  }
  const mounted = waitForPage(to);
  push(url.pathname + url.search + url.hash);
  await mounted;
  if (token !== navToken) return;
  if (!returning) lenis?.scrollTo(0, { immediate: true, force: true });
  if (returning && state.productOrigin) {
    lenis?.resize();
    lenis?.scrollTo(state.productOrigin.scroll, { immediate: true, force: true });
  }
  dim?.remove();
  if (!opts.instant) await new Promise<void>((r) => gsap.to("body", { opacity: 1, duration: returning ? 0.4 : 0.5, ease: "power3.out", overwrite: true, onComplete: r }));
  if (!state.replayIntro) lenis?.start();
  if (changed && !state.replayIntro) emit("header_title_change");
  if (returning) state.productOrigin = null;
  busy = false;
}

/** internal links go through the transitions; titles of the stack (data-taxi-ignore) are handled by the scene */
export function initNavigation(push: Push): Cleanup {
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest?.("a");
    if (!a || a.hasAttribute("data-taxi-ignore") || a.target === "_blank" || a.hasAttribute("download")) return;
    const href = a.getAttribute("href");
    if (!href || !href.startsWith("/")) return;
    e.preventDefault();
    navigate(push, href);
  };
  document.addEventListener("click", onClick);

  // home → product: the scene flies the image; the route changes when the flight is far enough along
  const onFocus = (e: Event) => {
    const d = (e as CustomEvent).detail as { url: string | null; index: number; scroll: number; preserveStack: boolean };
    if (!d?.url || section(location.pathname) !== "home") return;
    state.productOrigin = { scroll: d.scroll, index: d.index, preserveStack: d.preserveStack };
    state.productFocusTransition = true;
    emit("header_collection_leave");
    let cancelled = false;
    const cancel = () => { cancelled = true; };
    window.addEventListener("media_unfocus", cancel, { once: true });
    window.addEventListener("media_focus_transition_ready", async () => {
      window.removeEventListener("media_unfocus", cancel);
      if (cancelled) return;
      // keep the current frame where it is on screen while the page underneath changes
      const gl = document.querySelector<HTMLElement>(".gl");
      const r = gl?.getBoundingClientRect();
      currentScene()?.freeze();
      placeGl(true);
      if (gl && r) gl.style.transform = `translate3d(${r.left}px, ${r.top}px, 0)`;
      await navigate(push, d.url!, { instant: true });
      emit("header_collection_change");
    }, { once: true });
  };
  window.addEventListener("media_focus", onFocus);

  // browser back / forward: plain fade
  const onPop = () => { gsap.set("body", { opacity: 1 }); };
  window.addEventListener("popstate", onPop);
  return () => {
    document.removeEventListener("click", onClick);
    window.removeEventListener("media_focus", onFocus);
    window.removeEventListener("popstate", onPop);
  };
}
