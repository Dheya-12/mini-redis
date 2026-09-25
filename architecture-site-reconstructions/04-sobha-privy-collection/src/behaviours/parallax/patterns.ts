/**
 * The named scroll patterns the markup refers to (`data-parallax-pattern`).
 *
 * Keys are `parallax-<viewport %>[unit]-<element %>` (see engine.ts). The values — distances, scales, clip insets,
 * breakpoints, eases — are the original's, read from its public site; the format and code here are ours.
 */
export type Frame = { easing?: string; [prop: string]: string | number | undefined };
export type Frames = Record<string, Frame | boolean>;

export type PatternContext = {
  el: HTMLElement;
  /** the element whose position drives the run */
  measure: HTMLElement;
  /** the section the element belongs to (outside its range the element is hidden) */
  viewBox: Element | null;
  /** inside a horizontal sticky slider the run is across the element */
  axis: "x" | "y";
  /** size of the measured element along the run, and of the viewport */
  elementSize: number;
  viewportSize: number;
  /** size some patterns give their element so it can travel within a smaller frame */
  targetSize: number | null;
  /** eased position along the run, 0..1 */
  position: number;
  group: unknown;
};

export type Pattern = {
  clamp?: boolean;
  enableMq?: string | null;
  measureSelector?: string | ((el: HTMLElement) => HTMLElement | null);
  easing?: string;
  mobileSmooth?: boolean | number;
  frames?: Frames | ((ctx: PatternContext) => Frames);
  enter?: (ctx: PatternContext, direction: number) => void;
  leave?: (ctx: PatternContext, direction: number) => void;
  update?: (ctx: PatternContext) => void;
  reset?: (ctx: PatternContext) => void;
  apply?: (ctx: PatternContext) => void;
};

const size = (el: Element, axis: "x" | "y") => (axis === "x" ? (el as HTMLElement).offsetWidth : (el as HTMLElement).offsetHeight);
const move = (axis: "x" | "y") => (axis === "x" ? "translateX" : "translateY");

/** an image larger than its frame slides so it is aligned to the frame's end when entering and its start when leaving */
function slideWithin(ctx: PatternContext, sizeEl: Element): Frames {
  const outer = size(ctx.el, ctx.axis);
  const inner = size(sizeEl, ctx.axis);
  return {
    "parallax-100-0": { transform: `${move(ctx.axis)}(${-(outer ? ((outer - inner) / outer) * 100 : 0)}%)` },
    "parallax-0-100": { transform: `${move(ctx.axis)}(0%)` },
  };
}

/**
 * Background drift inside a (possibly overlapping) sticky section. `near` is the travel when the section overlaps a
 * neighbour, `far` when it scrolls freely. A background smaller than the viewport is first enlarged to half-way
 * between its size and the viewport's, then travels that difference.
 */
function drift(near: number, far: number) {
  return (ctx: PatternContext): Frames => {
    const underPrevious = !!ctx.el.closest(".sticky--under-previous");
    const underNext = !!ctx.el.closest(".sticky--under-next");
    const m = move(ctx.axis);
    const a = ctx.elementSize;
    if (a < ctx.viewportSize) {
      const target = Math.floor((a + ctx.viewportSize) / 2);
      const e = ((target - a) / target) * 100;
      ctx.targetSize = target;
      return { clamp: false, "parallax-100-100": { transform: `${m}(${-e}%)` }, "parallax-0-0": { transform: `${m}(0%)` } };
    }
    ctx.targetSize = null;
    if (underPrevious && underNext) return { "parallax-0-0": { transform: `${m}(${near}%)` }, "parallax-100-100": { transform: `${m}(${-near}%)` } };
    if (underPrevious) return { "parallax-0-0": { transform: `${m}(${near}%)` }, "parallax--100-0": { transform: `${m}(0%)` }, "parallax-0-100": { transform: `${m}(${far}%)` } };
    if (underNext) return { "parallax-100-0": { transform: `${m}(${-far}%)` }, "parallax-0-0": { transform: `${m}(0%)` }, "parallax-100-100": { transform: `${m}(${-near}%)` } };
    return { "parallax-100-0": { transform: `${m}(${-far}%)` }, "parallax-0-100": { transform: `${m}(${far}%)` } };
  };
}
const driftSize = {
  reset(ctx: PatternContext) { if (ctx.targetSize) { ctx.el.style.width = ""; ctx.el.style.height = ""; } },
  apply(ctx: PatternContext) { if (ctx.targetSize) ctx.el.style[ctx.axis === "x" ? "width" : "height"] = ctx.targetSize + "px"; },
};

/** the map pin that follows the scroll through the locations section */
const activePin = (ctx: PatternContext) => ctx.el.closest(".section")?.querySelector<HTMLElement>(".js-map-active-pin") ?? null;

export const patterns: Record<string, Pattern> = {
  // ---- generic
  imageMove: {
    clamp: true, enableMq: "md-up", measureSelector: "picture",
    frames: (ctx) => slideWithin(ctx, ctx.measure),
  },
  videoMove: {
    clamp: true, enableMq: "md-up", measureSelector: ".js-video-move",
    frames: (ctx) => slideWithin(ctx, ctx.measure),
  },
  imageMoveStickyLast: {
    clamp: true, enableMq: "md-up", measureSelector: "picture",
    frames: (ctx) => {
      const n = ctx.el.offsetWidth;
      const i = ctx.measure.offsetWidth;
      return {
        "parallax-100-0": { transform: `translate(${-(n ? ((n - i) / n) * 100 : 0)}%, 0%)` },
        "parallax-100-100": { transform: "translate(0%, 0%)" },
        "parallax-0-100": { transform: "translate(0%, 30%)" },
      };
    },
  },
  backgroundMove: {
    clamp: true,
    measureSelector: (el) => (el.closest(".sticky") as HTMLElement | null) ?? (el.closest("picture") as HTMLElement | null) ?? el.parentElement,
    frames: drift(10, 20),
    ...driftSize,
  },
  sectionOutTiny: {
    clamp: true, enableMq: null,
    frames: (ctx): Frames => {
      const next = ctx.el.classList.contains("sticky--under-next");
      const prev = ctx.el.classList.contains("sticky--under-previous");
      if (next && prev) return { "parallax-300-100": { transform: "translateY(10svh)" }, "parallax-200-100": { transform: "translateY(0svh)" }, "parallax-100-100": { transform: "translateY(-10svh)" } };
      if (next) return { "parallax-200-100": { transform: "translateY(0svh)" }, "parallax-100-100": { transform: "translateY(-10svh)" } };
      return { "parallax-100-100": { transform: "translateY(0svh)" }, "parallax-0-100": { transform: "translateY(10svh)" } };
    },
  },

  // ---- "Some creations merit a place": title and the three images that part around it
  landingLuxuryTitle: {
    clamp: true, enableMq: "md-up", measureSelector: ".section", easing: "easeOutQuad",
    frames: { "parallax-100-0": { transform: "translateY(calc(var(--spacing) * -5))" }, "parallax-0-0": { transform: "translateY(calc(var(--spacing) * 0))" } },
  },
  landingLuxuryMoveSideDesktop: {
    clamp: true, enableMq: "md-up", measureSelector: ".section",
    frames: {
      "parallax-100-0": { transform: "translateY(calc(var(--spacing) * -10))" },
      "parallax-25-0": { transform: "translateY(calc(var(--spacing) * -2.5))", easing: "easeOutQuad" },
      "parallax-0-0": { transform: "translateY(calc(var(--spacing) * 0))" },
    },
  },
  landingLuxuryScaleCenterDesktop: {
    clamp: true, enableMq: "md-up", measureSelector: ".js-luxury-parallax-wrapper", easing: "easeInOutQuad",
    frames: {
      "parallax-65-0": { transform: "scale(1)", clipPath: "inset(0% 0% 0% 0%)" },
      "parallax-0-100": { transform: "scale(1.4)", clipPath: "inset(10% 0% 10% 0%)" },
    },
  },
  landingLuxuryScaleSideLeftDesktop: {
    clamp: true, enableMq: "md-up", measureSelector: ".js-luxury-parallax-wrapper", easing: "easeInOutQuad",
    frames: { "parallax-65-0": { transform: "translateX(0vw)" }, "parallax-0-100": { transform: "translateX(-8.333333333333334vw)" } },
  },
  landingLuxuryScaleSideRightDesktop: {
    clamp: true, enableMq: "md-up", measureSelector: ".js-luxury-parallax-wrapper", easing: "easeInOutQuad",
    frames: { "parallax-65-0": { transform: "translateX(0vw)" }, "parallax-0-100": { transform: "translateX(8.333333333333334vw)" } },
  },
  landingLuxuryScaleCenterMobile: {
    clamp: true, enableMq: "sm-down", measureSelector: ".sticky", easing: "easeInOutQuad",
    frames: { "parallax-38.8889-0": { transform: "scale(1)" }, "parallax-0-0": { transform: `scale(${360 / 220})` } },
  },
  landingLuxuryScaleSideLeftMobile: {
    clamp: true, enableMq: "sm-down", measureSelector: ".sticky", easing: "easeInOutQuad",
    frames: { "parallax-38.8889-0": { transform: "translateX(0vw)" }, "parallax-0-0": { transform: "translateX(-19.444444444444443vw)" } },
  },
  landingLuxuryScaleSideRightMobile: {
    clamp: true, enableMq: "sm-down", measureSelector: ".sticky", easing: "easeInOutQuad",
    frames: { "parallax-38.8889-0": { transform: "translateX(0vw)" }, "parallax-0-0": { transform: "translateX(19.444444444444443vw)" } },
  },

  // ---- "Evoking a sensation" / "Sublime" backgrounds
  landingSensationBackgroundDesktop: {
    clamp: false, enableMq: "md-up", measureSelector: ".section",
    frames: { "parallax-100-0": { transform: "translateY(-10svh)" }, "parallax-0-0": { transform: "translateY(0svh)" } },
  },
  landingSensationBackgroundMobile: {
    clamp: false, enableMq: "sm-down", measureSelector: ".section",
    frames: { "parallax-100-0": { transform: "translate(-50%, -10svh)" }, "parallax-0-0": { transform: "translate(-50%, 0svh)" } },
  },
  landingSublimeBackgroundMobile: {
    clamp: false, enableMq: "sm-down", measureSelector: ".section",
    frames: { "parallax-100-0": { transform: "translateY(-10svh)" }, "parallax-0-0": { transform: "translateY(0svh)" } },
  },

  // ---- "The three worlds"
  landingThreeWorldsBackgroundDesktop: {
    clamp: false, enableMq: "md-up", measureSelector: ".section",
    frames: { "parallax-100-0": { transform: "translateY(-40svh)" }, "parallax--200-0": { transform: "translateY(80svh)" } },
  },
  landingThreeWorldsBackgroundMobile: {
    clamp: false, enableMq: "sm-down", measureSelector: ".section",
    frames: { "parallax-100-0": { transform: "translateY(-40svh)" }, "parallax--200-0": { transform: "translateY(80svh)" } },
  },
  landingThreeWorldsWebGl: {
    clamp: true, enableMq: "md-up", measureSelector: ".sticky", easing: "easeSectionInverse",
    frames: { "parallax-50-0": { transform: "translateY(-25svh)" }, "parallax-0-0": { transform: "translateY(0svh)" } },
  },
  landingThreeWorldsWebGlClip: {
    clamp: true, measureSelector: ".sticky", easing: "easeInOutQuad",
    frames: { "parallax--100-0": { clipPath: "inset(0% 0% 0% 0%)" }, "parallax--200-0": { clipPath: "inset(0% 0% 50% 0%)" } },
  },
  landingThreeWorldsTitle: {
    clamp: true, enableMq: "md-up", measureSelector: ".sticky",
    frames: {
      "parallax-50-0": { easing: "easeSectionInverse", transform: "translateY(-25svh) translateY(0px)" },
      "parallax-0-0": { transform: "translateY(0svh) translateY(0px)" },
      "parallax--100-0": { transform: "translateY(0svh) translateY(0px)", easing: "easeInOutQuad" },
      "parallax--200-0": { transform: "translateY(-61.4svh) translateY(0px)" },
    },
  },
  landingThreeWorldsTitleMobile: {
    clamp: true, enableMq: "sm-down", measureSelector: ".sticky",
    frames: {
      "parallax--100-0": { transform: "translateY(0svh) translateY(0px)", easing: "easeInOutQuad" },
      "parallax--200-0": { transform: "translateY(-61.4svh) translateY(0px)" },
    },
  },

  // ---- Tenets and the "Expansive spaces" slider
  landingTenetsBackground: {
    clamp: true, enableMq: "md-up", measureSelector: ".sticky",
    frames: (ctx) => {
      const t = ctx.el.offsetHeight;
      return { "parallax-0-0": { transform: "translateY(0%)" }, "parallax-100-100": { transform: `translateY(${-(t ? ((t - window.innerHeight) / t) * 100 : 0)}%)` } };
    },
  },
  landingExpansiveCard: {
    clamp: true, enableMq: "md-up", measureSelector: ".section",
    frames: { "parallax-0-0": { transform: "translateY(-100svh) translateY(-50%)" }, "parallax--100-0": { transform: "translateY(0svh) translateY(-50%)" } },
  },
  landingExpansiveCardScale: {
    clamp: true, enableMq: "md-up", measureSelector: ".section", easing: "easeInOutQuad",
    frames: { "parallax-0-0": { transform: `scale(${480 / 1440})` }, "parallax--100-0": { transform: "scale(1)" } },
  },
  landingExpansiveCardText: {
    clamp: true, enableMq: "md-up", measureSelector: ".section", easing: "easeInOutQuad",
    frames: { "parallax-0-0": { transform: "scale(1)" }, "parallax--100-0": { transform: `scale(${480 / 1440})` } },
  },
  landingExpansiveCardVideo: {
    clamp: true, enableMq: "md-up", measureSelector: ".section", easing: "easeInOutQuad",
    frames: {
      "parallax-0-0": { clipPath: "inset(0% 26.66% 0% 26.66%)", transform: "scale(1.25)" },
      "parallax--100-0": { clipPath: "inset(0% 0% 0% 0%)", transform: "scale(1)" },
    },
  },
  landingExpansiveCardContent: {
    clamp: true, enableMq: "md-up", measureSelector: ".section",
    frames: { "parallax--50-0": { opacity: 0 }, "parallax--100-0": { opacity: 1 } },
  },
  landingExpansiveCarousel: {
    clamp: true, enableMq: "md-up",
    frames: (ctx) => ({ "parallax-100-0": { transform: "translateY(0px)" }, "parallax-0-100": { transform: `translateY(${window.innerHeight - ctx.el.offsetHeight}px)` } }),
  },

  // ---- "Handpicked" gallery title
  landingHandpickedTitle: {
    clamp: true, measureSelector: ".sticky",
    frames: {
      "parallax--35-0": { opacity: 0, transform: "translateY(20svh)", easing: "easeSection" },
      "parallax--75-0": { opacity: 1, transform: "translateY(0svh)" },
      "parallax--130-0": { opacity: 1, transform: "translateY(0svh)", easing: "easeSectionInverse" },
      "parallax--170-0": { opacity: 0, transform: "translateY(-20svh)" },
    },
  },

  // ---- Project locations map
  landingLocationMapTitleDesktop: {
    clamp: true, enableMq: "md-up", measureSelector: ".section", easing: "easeOutQuad",
    frames: { "parallax-0-0": { opacity: 1 }, "parallax--100-0": { opacity: 0 } },
  },
  landingLocationMapTitleMobile: {
    clamp: true, enableMq: "sm-down", measureSelector: ".section", easing: "easeOutQuad",
    frames: { "parallax-0-0": { opacity: 1 }, "parallax-125-100": { opacity: 0 } },
  },
  landingLocationMapDesktop: {
    clamp: true, enableMq: "md-up", measureSelector: ".sticky",
    frames: {
      "parallax-100-0": { transform: "translate(-33%, -92%) scale(3.05)" },
      "parallax-0-0": { transform: "translate(-33%, -62%) scale(3.05)" },
      "parallax--100-0": { transform: "translate(-31%, -67%) scale(2.3)" },
      "parallax--450-0": { transform: "translate(-31%, -67%) scale(2.3)", easing: "easeSection" },
      "parallax--500-0": { transform: "translate(-58%, -27%) scale(2.0)" },
    },
    // the pin marked "to hide" fades out over the last part of the run
    update(ctx) {
      const t = ctx.position;
      const o = t <= 0.88 ? 1 : t >= 0.99 ? 0 : 1 - (t - 0.88) / 0.11;
      ctx.el.closest(".section")?.querySelectorAll<HTMLElement>(".js-pin-to-hide").forEach((p) => { p.style.opacity = String(o); });
    },
  },
  landingLocationMapMobile: {
    clamp: true, enableMq: "sm-down", measureSelector: ".section",
    frames: { "parallax-0-0": { transform: "translate(-22%, -28%) scale(1.6)" }, "parallax-125-100": { transform: "translate(-22%, -22%) scale(1.7)" } },
    leave(ctx, direction) {
      if (direction !== 1) return;
      const section = ctx.el.closest(".section");
      if (!section) return;
      const pins = section.querySelectorAll(".js-map-active-pin");
      const card = section.querySelector(".js-location-mobile-card.is-active");
      if (!card) { pins[0]?.classList.add("is-active"); return; }
      pins[Array.from(card.parentElement?.children ?? []).indexOf(card)]?.classList.add("is-active");
    },
    enter(ctx, direction) {
      if (direction === -1) ctx.el.closest(".section")?.querySelectorAll(".js-map-active-pin.is-active").forEach((p) => p.classList.remove("is-active"));
    },
  },
  landingLocationMapPinDesktop: {
    clamp: true, enableMq: "md-up", measureSelector: ".section",
    frames: { "parallax-0-0": { opacity: 0 }, "parallax--80-0": { opacity: 0 }, "parallax--100-0": { opacity: 1 } },
    leave(ctx, direction) { if (direction === -1) ctx.el.classList.remove("is-seen"); },
    enter(ctx, direction) { if (direction === 1) ctx.el.classList.add("is-seen"); },
  },
  landingLocationMapPinMobile: {
    clamp: true, enableMq: "sm-down", measureSelector: ".section", easing: "easeInQuad",
    frames: { "parallax-0-0": { opacity: 0 }, "parallax-125-100": { opacity: 1 } },
  },
  landingLocationMapProgress: {
    clamp: true, enableMq: "md-up", measureSelector: ".sticky",
    frames: {
      "parallax-0-0": { progress: 0, transform: "scaleX(0)" },
      "parallax--100-0": { progress: 0.25, transform: "scaleX(0.25)" },
      "parallax--200-0": { progress: 0.5, transform: "scaleX(0.5)" },
      "parallax--300-0": { progress: 0.75, transform: "scaleX(0.75)" },
      "parallax-100-100": { progress: 1, transform: "scaleX(1)" },
    },
    enter(ctx, direction) { if (direction === 1) activePin(ctx)?.classList.add("is-active"); },
    leave(ctx, direction) { if (direction === -1) activePin(ctx)?.classList.remove("is-active"); },
  },

  // ---- "The idea" / register
  landingJourneyBackgroundDesktop: {
    clamp: false, enableMq: "md-up", measureSelector: ".section",
    frames: { "parallax-0-0": { transform: "translateY(0svh)" }, "parallax-100-100": { transform: "translateY(250svh)" } },
  },
  landingJourneyBackgroundMobile: {
    clamp: false, enableMq: "sm-down", measureSelector: ".section",
    frames: { "parallax-0-0": { transform: "translateY(0svh)" }, "parallax-100-100": { transform: "translateY(-30svh)" } },
  },
  registerScreen: {
    clamp: false, enableMq: "md-up", measureSelector: ".section",
    frames: { "parallax-100-0": { transform: "translateY(35svh)" }, "parallax-100-100": { transform: "translateY(0svh)" } },
  },
  registerBgScale: {
    enableMq: "md-up", mobileSmooth: true, clamp: true, measureSelector: ".section",
    frames: { "parallax-100-0": { transform: "scale(1)" }, "parallax-0-100": { transform: "scale(1)" } },
  },
  registerBgMove: {
    enableMq: "md-up", mobileSmooth: true, measureSelector: ".section",
    frames: (ctx) => ({ "parallax-100-0": { transform: "translateY(0px)" }, "parallax-0-100": { transform: `translateY(${-Math.max(0, ctx.el.offsetHeight - window.innerHeight)}px)` } }),
  },
};
