import { gsap, emit, state, type Cleanup } from "@/lib/runtime";
import { ImageScene } from "@/gl/scene";

/**
 * Per-page wiring: WebGL layer placement, the scene, the preloader (first visit only), image credits.
 */

let host: HTMLDivElement | null = null;
/** the WebGL host lives outside React's tree so it can be moved between the body and the home page's sticky frame */
export function glHost() {
  if (!host) {
    host = document.createElement("div");
    host.className = "gl";
    document.body.insertBefore(host, document.querySelector("main"));
  }
  return host;
}

export function placeGl(fixed: boolean) {
  const el = glHost();
  if (fixed) {
    document.body.insertBefore(el, document.querySelector("main"));
    el.classList.add("--is-fixed");
    return;
  }
  el.classList.remove("--is-fixed");
  const frame = document.querySelector(".gallery-sticky-boundary > div");
  if (frame) frame.prepend(el);
  else document.body.insertBefore(el, document.querySelector("main"));
}

let scene: ImageScene | null = null;
export const currentScene = () => scene;

/** waits for the first images the scene needs (5 on the home page, 1 elsewhere) */
function imagesReady(limit: number) {
  const imgs = [...document.querySelectorAll<HTMLImageElement>("[gl-media] img, [gl-dom] img")].slice(0, limit);
  return Promise.all(imgs.map((img) => {
    img.loading = "eager";
    return img.complete ? Promise.resolve() : new Promise<void>((r) => { img.addEventListener("load", () => r(), { once: true }); img.addEventListener("error", () => r(), { once: true }); });
  }));
}

export async function mountScene(opts: { keepPrevious?: boolean } = {}) {
  const gallery = !!document.querySelector(".gallery");
  const product = !!document.querySelector(".product-slider");
  placeGl(product);
  const introNeeded = gallery && (!state.firstLoaded || state.replayIntro);
  await imagesReady(gallery ? 5 : 1);
  const previous = scene;
  const next = new ImageScene(glHost(), {
    skipIntro: !introNeeded,
    preloaderDone: state.firstLoaded && !state.replayIntro,
    revealProduct: product && state.productFocusTransition,
  });
  scene = next;
  await next.ready;
  if (previous && previous !== next) {
    if (opts.keepPrevious) gsap.delayedCall(0.1, () => previous.destroy());
    else previous.destroy();
  }
  return next;
}

export function destroyScene() {
  scene?.destroy();
  scene = null;
}

/** first visit: a white screen until the first images are drawn, then a 0.4 s fade */
export function runPreloader(): Cleanup {
  const el = document.querySelector<HTMLElement>(".preloader");
  if (!el) return () => {};
  if (state.firstLoaded) { gsap.set(el, { autoAlpha: 0 }); return () => {}; }
  let started = false;
  const hide = () => {
    if (started) return;
    started = true;
    clearTimeout(fallback);
    el.style.pointerEvents = "none";
    gsap.timeline({ delay: 0.1 })
      .call(() => emit("preloader_hide"), [], 0)
      .to(el, { autoAlpha: 0, ease: "power3.in", duration: 0.4 }, 0)
      .call(() => { state.firstLoaded = true; emit("preloader_complete"); }, [], 0.2);
  };
  const hasMedia = !!document.querySelector("[gl-media], [gl-dom]");
  const fallback = window.setTimeout(hide, hasMedia ? 2500 : 0);
  window.addEventListener("gl_ready", hide, { once: true });
  return () => { clearTimeout(fallback); window.removeEventListener("gl_ready", hide); };
}


/** hovering an image shows its photographer credit (home: bottom right; product pages: above each image) */
export function initCredits(root: HTMLElement): Cleanup {
  const find = (t: EventTarget | null) => {
    const figure = (t as Element | null)?.closest?.<HTMLElement>(".gallery__image, .product-slider [gl-media]");
    if (!figure) return null;
    const gallery = figure.closest(".gallery");
    const credits = gallery ? gallery.querySelector<HTMLElement>(".gallery__credits") : figure.closest("section")?.querySelector<HTMLElement>(`.credits[data-credit-index="${figure.dataset.creditIndex}"]`);
    return { figure, credits, name: credits?.querySelector<HTMLElement>(gallery ? ".gallery__credits__name" : ".credits__name"), disabled: gallery ? gallery.classList.contains("--is-stacked") : document.body.classList.contains("product-focus-active") };
  };
  const over = (e: PointerEvent) => {
    const hit = find(e.target);
    if (!hit || hit.figure.contains(e.relatedTarget as Node) || hit.disabled) return;
    const alt = hit.figure.querySelector("img")?.alt.trim();
    if (!hit.credits || !hit.name || !alt) return;
    hit.name.textContent = alt;
    hit.credits.classList.add("--is-visible");
  };
  const out = (e: PointerEvent) => {
    const hit = find(e.target);
    if (!hit || hit.figure.contains(e.relatedTarget as Node)) return;
    hit.credits?.classList.remove("--is-visible");
  };
  const clear = () => root.querySelectorAll(".gallery__credits, .credits").forEach((c) => c.classList.remove("--is-visible"));
  document.addEventListener("pointerover", over);
  document.addEventListener("pointerout", out);
  window.addEventListener("media_focus", clear);
  // lazy images fade in once loaded (the original's inline onload)
  root.querySelectorAll<HTMLImageElement>("img").forEach((img) => {
    const done = () => img.classList.add("--is-loaded");
    if (img.complete) done(); else img.addEventListener("load", done, { once: true });
  });
  return () => {
    document.removeEventListener("pointerover", over);
    document.removeEventListener("pointerout", out);
    window.removeEventListener("media_focus", clear);
  };
}
