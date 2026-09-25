import { gsap, ScrollTrigger, SplitText, state } from "@/lib/runtime";

/**
 * The page markup uses four custom elements. Their behaviour, as measured on the original:
 *  c-title      lines rise from 100 % (1.2 s, power4.out, stagger 0.75 s total) when ready and in view (top 85 %)
 *  c-paragraph  lines rise from 100 % (1 s, expo.out, 0.075 s stagger) at top 85 %
 *  c-shuffle    characters scramble into place (1 s each, spread over 0.8 s)
 *  c-media      parallax (speed 0.3) or a 0.7 s fade-in (data-opacity)
 * "Ready" means after the home intro (intro_complete) or, elsewhere, after the preloader (preloader_complete).
 */

type Split = SplitText & { lines: HTMLElement[]; chars: HTMLElement[] };

const onceEvent = (name: string, fn: () => void) => {
  window.addEventListener(name, fn, { once: true });
  return () => window.removeEventListener(name, fn);
};

/** runs `fn` once the element may animate: immediately after the first visit, else after the intro / preloader */
function whenReady(el: HTMLElement, fn: () => void) {
  if (state.firstLoaded && !state.replayIntro) return fn(), () => {};
  const home = !!document.querySelector(".gallery");
  return onceEvent(home ? "intro_complete" : "preloader_complete", fn);
}

// the module is also evaluated during server rendering, where HTMLElement does not exist
const Base = (typeof HTMLElement === "undefined" ? class {} : HTMLElement) as typeof HTMLElement;

const fontsReady = () => (document.fonts.status === "loaded" ? Promise.resolve() : document.fonts.ready.then(() => undefined));

class CTitle extends Base {
  private split: Split | null = null;
  private trigger: ScrollTrigger | null = null;
  private offs: (() => void)[] = [];
  private tween: gsap.core.Tween | null = null;

  private get offset() { return this.getAttribute("data-direction") === "bottom" ? -100 : 100; }
  private get isHeader() { return this.hasAttribute("data-header-title") || this.hasAttribute("data-persistent"); }

  connectedCallback() {
    const add = (name: string, fn: () => void) => { window.addEventListener(name, fn); this.offs.push(() => window.removeEventListener(name, fn)); };
    if (this.hasAttribute("data-header-collection")) {
      add("header_collection_leave", () => this.out());
      add("header_collection_change", () => this.backIn());
    }
    if (this.isHeader) {
      add("header_title_leave", () => this.hide());
      add("header_title_change", () => this.replay());
      if (this.hasAttribute("data-persistent")) add("home_intro_start", () => { this.out(); this.offs.push(onceEvent("intro_complete", () => this.backIn())); });
    } else if (this.hasAttribute("data-trigger")) {
      add("stack", () => this.in(true));
      add("unstacked", () => this.out());
    } else {
      add("media_focus", () => this.out());
      add("media_unfocus", () => this.backIn());
    }
    const start = () => fontsReady().then(() => this.isConnected && !this.hasAttribute("data-trigger") && this.in(this.isHeader));
    // header titles outside the home page wait a beat after the preloader
    const delayed = () => { gsap.delayedCall(this.isHeader && !document.querySelector(".gallery") ? 0.25 : 0, start); };
    this.offs.push(whenReady(this, state.firstLoaded && !state.replayIntro ? start : delayed));
  }

  disconnectedCallback() {
    this.offs.forEach((f) => f());
    this.offs = [];
    this.trigger?.kill();
    this.tween?.kill();
    this.split?.revert();
    this.split = null;
  }

  private ensureSplit() {
    if (this.split) return this.split;
    this.split = SplitText.create(this, {
      type: "lines, words, chars",
      ignore: "[data-title-ignore]",
      aria: "none",
      mask: "lines",
      linesClass: "line",
      wordsClass: "word",
      charsClass: "char",
    }) as Split;
    gsap.set(this.split.lines, { willChange: "transform", transformOrigin: "0 0", force3D: true });
    return this.split;
  }

  /** reveal; header titles and stack titles play at once, the rest when scrolled into view */
  in(now = false) {
    const split = this.ensureSplit();
    if (!split.lines.length) return;
    gsap.set(this, { visibility: "visible" });
    const stagger = parseFloat(this.getAttribute("data-stagger") || "0.75");
    const delay = parseFloat(this.getAttribute("data-delay") || "0");
    this.tween?.kill();
    this.tween = gsap.fromTo(split.lines, { yPercent: this.offset }, { yPercent: 0, duration: 1.2, delay, ease: "power4.out", paused: true, stagger: { amount: stagger, from: "start" } });
    this.trigger?.kill();
    if (now) this.tween.play();
    else this.trigger = ScrollTrigger.create({ trigger: this, start: this.getAttribute("data-start") || "top 85%", once: true, onEnter: () => this.tween?.play() });
  }

  out() {
    if (!this.split) return;
    gsap.to(this.split.lines, { yPercent: this.offset, duration: 1, ease: "power4.out", stagger: { amount: 0.1, from: "end" }, overwrite: true });
  }

  backIn() {
    if (!this.split) return;
    gsap.set(this, { visibility: "visible" });
    gsap.to(this.split.lines, { yPercent: 0, duration: 1, ease: "power4.out", stagger: { amount: 0.2, from: "start" }, overwrite: true });
  }

  hide() {
    if (!this.split || !this.getClientRects().length) { gsap.set(this, { visibility: "hidden" }); return; }
    gsap.to(this.split.lines, {
      yPercent: this.offset, duration: 0.8, ease: "power2.inOut", stagger: { amount: 0.1, from: "end" }, overwrite: true,
      onComplete: () => { gsap.set(this, { visibility: "hidden" }); },
    });
  }

  replay() {
    if (!this.getClientRects().length) return;
    this.split?.revert();
    this.split = null;
    gsap.set(this, { visibility: "hidden" });
    this.in(true);
  }
}

class CParagraph extends Base {
  private split: Split | null = null;
  private tween: gsap.core.Tween | null = null;
  private offs: (() => void)[] = [];
  private left = false;

  connectedCallback() {
    if (this.hasAttribute("data-immediate")) {
      // the "Click to enable sound" prompt: first visit to the home page on desktop only
      if (state.firstLoaded || window.innerWidth < 640 || !document.querySelector(".gallery")) return;
      this.offs.push(onceEvent("preloader_hide", () => { if (!this.left) { document.documentElement.classList.add("sound-prompt"); this.start(true); } }));
      this.offs.push(onceEvent("intro_zoom", () => this.leave()));
      this.offs.push(onceEvent("sound_enabled", () => this.leave()));
      return;
    }
    if (state.firstLoaded) this.start(false);
    else this.offs.push(onceEvent("preloader_complete", () => this.start(false)));
  }

  disconnectedCallback() {
    this.offs.forEach((f) => f());
    document.documentElement.classList.remove("sound-prompt");
    this.tween?.kill();
    this.split?.revert();
  }

  private start(immediate: boolean) {
    if (this.split) return;
    this.split = SplitText.create(this, { type: "lines, words", mask: "lines", aria: "none", linesClass: "line", wordsClass: "word" }) as Split;
    gsap.set(this, { visibility: "visible" });
    this.tween = gsap.from(this.split.lines, {
      yPercent: this.getAttribute("data-direction") === "bottom" ? -100 : 100, duration: 1, stagger: 0.075, ease: "expo.out",
      ...(immediate ? {} : { scrollTrigger: { trigger: this, start: "top 85%", once: true } }),
    });
  }

  private leave() {
    if (this.left) return;
    this.left = true;
    const done = () => {
      this.style.visibility = "hidden";
      document.documentElement.classList.remove("sound-prompt");
      window.dispatchEvent(new CustomEvent("preloader_prompt_out"));
    };
    if (this.tween) { this.tween.eventCallback("onReverseComplete", done); this.tween.timeScale(1.6).reverse(); }
    else done();
  }
}

const SCRAMBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

class CShuffle extends Base {
  private split: Split | null = null;
  private tl: gsap.core.Timeline | null = null;
  private offs: (() => void)[] = [];
  private trigger: ScrollTrigger | null = null;
  private active = false;
  private pending: gsap.core.Tween | null = null;

  private get triggered() { return this.hasAttribute("data-trigger"); }

  connectedCallback() {
    const add = (name: string, fn: () => void) => { window.addEventListener(name, fn); this.offs.push(() => window.removeEventListener(name, fn)); };
    if (this.triggered) {
      add("stack", () => { this.active = true; this.play(Number(this.getAttribute("data-delay")) || 0); });
      add("unstacked", () => { this.active = false; this.reverse(); });
    }
    add("media_focus", () => this.reverse(!this.triggered));
    add("media_unfocus", () => { if (!this.triggered || this.active) this.play(0.4); });
    this.offs.push(whenReady(this, () => fontsReady().then(() => this.isConnected && this.start())));
  }

  disconnectedCallback() {
    this.offs.forEach((f) => f());
    this.pending?.kill();
    this.trigger?.kill();
    this.tl?.kill();
    this.split?.revert();
  }

  private build() {
    if (this.tl) return this.tl;
    this.split = SplitText.create(this, { type: "words, chars", aria: "none", wordsClass: "word", charsClass: "char" }) as Split;
    const chars = this.split.chars;
    // fix each character's width so the scramble does not shift the line
    const widths = chars.map((c) => `${c.getBoundingClientRect().width / parseFloat(getComputedStyle(c).fontSize)}em`);
    gsap.set(chars, { opacity: 0, textAlign: "center", width: (i: number) => widths[i] });
    const step = 0.8 / Math.max(1, chars.length - 1);
    const tl = gsap.timeline({ paused: true, delay: this.triggered ? 0 : Number(this.getAttribute("data-delay")) || 0 });
    tl.set(this, { visibility: "visible" });
    chars.forEach((c, i) => {
      const text = c.textContent || "";
      c.textContent = SCRAMBLE[Math.floor(Math.random() * SCRAMBLE.length)];
      tl.set(c, { opacity: 1 }, i * step);
      tl.to(c, { duration: 1, scrambleText: { text, chars: "upperAndLowerCase", speed: 0.55 }, ease: "none" }, i * step);
    });
    this.tl = tl;
    return tl;
  }

  private start() {
    const tl = this.build();
    if (this.triggered) { if (this.active) tl.restart(); return; }
    if (this.closest(".gallery") && state.productOrigin) { tl.progress(1).pause(); return; }
    this.trigger = ScrollTrigger.create({ trigger: this, start: "top 85%", once: true, onEnter: () => tl.play() });
  }

  private play(delay: number) {
    this.pending?.kill();
    this.pending = gsap.delayedCall(delay, () => this.build().timeScale(1).restart(true));
  }

  private reverse(notify = true) {
    this.pending?.kill();
    if (!this.tl) { if (notify) requestAnimationFrame(() => window.dispatchEvent(new CustomEvent("shuffle_out_complete"))); return; }
    this.tl.eventCallback("onReverseComplete", notify ? () => { this.tl?.eventCallback("onReverseComplete", null); window.dispatchEvent(new CustomEvent("shuffle_out_complete")); } : null);
    this.tl.timeScale(3.5).reverse();
  }
}

class CMedia extends Base {
  private tween: gsap.core.Tween | null = null;
  private off: (() => void) | null = null;

  connectedCallback() {
    if (state.firstLoaded) this.start();
    else this.off = onceEvent("preloader_complete", () => this.start());
  }

  disconnectedCallback() {
    this.off?.();
    this.tween?.scrollTrigger?.kill();
    this.tween?.kill();
  }

  private start() {
    const el = this.firstElementChild as HTMLElement | null;
    if (!el) return;
    if (this.hasAttribute("data-opacity")) {
      const delay = parseFloat(this.dataset.delay || "0") + (state.productFocusTransition ? parseFloat(this.dataset.focusDelay || "0.8") : 0);
      gsap.set(this, { autoAlpha: 0 });
      this.tween = gsap.to(this, { autoAlpha: 1, duration: 0.7, delay, ease: "power4.out", scrollTrigger: { trigger: this, start: this.dataset.start || "top 90%", once: true } });
      return;
    }
    const speed = this.dataset.speed ? parseFloat(this.dataset.speed) : 0.3;
    const travel = this.offsetHeight * Math.abs(speed);
    gsap.set(el, { height: `calc(100% + ${travel}px)`, marginTop: -travel / 2, force3D: true });
    const from = speed > 0 ? -travel / 2 : travel / 2;
    this.tween = gsap.fromTo(el, { y: from }, { y: -from, ease: "none", scrollTrigger: { trigger: this, start: "top bottom", end: "bottom top", scrub: true } });
  }
}

export function defineTextElements() {
  const define = (name: string, ctor: CustomElementConstructor) => { if (!customElements.get(name)) customElements.define(name, ctor); };
  define("c-title", CTitle);
  define("c-paragraph", CParagraph);
  define("c-shuffle", CShuffle);
  define("c-media", CMedia);
}
