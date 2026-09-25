"use client";

import { gsap, isMobile } from "./gsap";

/**
 * One entrance, declared once. `from` is the hidden state; the shown state is derived.
 * Times are in "beats" on the chapter timeline.
 */
export type Move = {
  targets: Element[];
  from: gsap.TweenVars;
  duration: number;
  ease?: string;
  at?: number;
  stagger?: number;
  /** Overrides the mirrored exit position (beats after the hold). */
  exitAt?: number;
};

export type RevealOptions = {
  start?: string;
  end?: string;
  scrub?: number;
  /** Tickers: start and length of the count-up (beats). */
  tickAt?: number;
  tickDuration?: number;
};

/** The scroll band is symmetric about a chapter's rest point, so up == down. */
export const REVEAL_DEFAULTS = { start: "top 50%", end: "top -50%", scrub: 2.5 } as const;

const SHOWN: Record<string, number | string> = {
  opacity: 1, x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0, filter: "blur(0px)",
};

function shownStateOf(from: gsap.TweenVars): gsap.TweenVars {
  const shown: gsap.TweenVars = {};
  for (const key of Object.keys(from)) {
    if (key !== "transformOrigin") shown[key] = SHOWN[key] ?? 0;
  }
  return shown;
}

/** power2.out ↔ power2.in; inOut eases are their own mirror. */
export function mirrorEase(ease = "power2.out") {
  if (ease.includes(".inOut")) return ease;
  if (ease.includes(".out")) return ease.replace(".out", ".in");
  if (ease.includes(".in")) return ease.replace(".in", ".out");
  return ease;
}

/** Latest finishing beat of a set of moves = the length of the entrance. */
export function entranceLength(moves: Move[]) {
  return moves.reduce((max, m) => {
    const end = (m.at ?? 0) + m.duration + (m.stagger ?? 0) * (m.targets.length - 1);
    return Math.max(max, end);
  }, 0);
}

/**
 * Builds one scroll-tied timeline for a chapter: the entrance plays over the first half
 * of the band, and the exit — generated as the exact mirror of the entrance (reversed
 * ease, mirrored time, reversed stagger) — over the second half. Scrolling back up
 * therefore replays the entrance precisely.
 */
export function mirroredReveal(
  trigger: Element,
  inputMoves: Move[],
  tickers: HTMLElement[] = [],
  options: RevealOptions = {},
): gsap.core.Timeline | null {
  let moves = inputMoves.filter((m) => m.targets.length);

  // Phones drop the animated blur (iOS repaints scroll-driven filters visibly);
  // slide and fade still scrub.
  if (isMobile()) {
    moves = moves
      .map((m) => {
        if (m.from.filter == null) return m;
        const rest = { ...m.from };
        delete rest.filter;
        return { ...m, from: rest };
      })
      .filter((m) => Object.keys(m.from).length > 0);
  }
  if (!moves.length && !tickers.length) return null;

  for (const m of moves) {
    if (m.from.transformOrigin) gsap.set(m.targets, { transformOrigin: m.from.transformOrigin });
  }

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger,
      start: options.start ?? REVEAL_DEFAULTS.start,
      end: options.end ?? REVEAL_DEFAULTS.end,
      scrub: options.scrub ?? REVEAL_DEFAULTS.scrub,
    },
  });

  const inEnd = entranceLength(moves);
  const total = inEnd * 2;

  for (const m of moves) {
    const from = { ...m.from };
    delete from.transformOrigin;
    const shown = shownStateOf(m.from);
    const at = m.at ?? 0;
    const stagger = m.stagger ?? 0;
    const ease = m.ease ?? "power2.out";

    timeline.fromTo(m.targets, from, { ...shown, duration: m.duration, ease, stagger }, at);

    const exitAt =
      m.exitAt != null ? inEnd + m.exitAt : inEnd + (inEnd - (at + m.duration)) - stagger * (m.targets.length - 1);
    timeline.fromTo(
      m.targets,
      shown,
      {
        ...from,
        duration: m.duration,
        ease: mirrorEase(ease),
        stagger: stagger ? { each: stagger, from: "end" } : 0,
        immediateRender: false,
      },
      exitAt,
    );
  }
  // Pin the length so timeline time maps exactly onto the band.
  timeline.to({}, { duration: total }, 0);

  if (tickers.length) addTickers(timeline, tickers, inEnd, total, options);
  return timeline;
}

type TickPart = { text: string } | { value: number; decimals: number; start: number };
type TickerEl = HTMLElement & { __tickSource?: string; __tickParts?: TickPart[] };

/**
 * Figures count up as their stat block lands and back down as it leaves.
 * Big numbers start near their target (no digit-count jumps); small ones from zero.
 */
function addTickers(timeline: gsap.core.Timeline, tickers: HTMLElement[], inEnd: number, total: number, options: RevealOptions) {
  for (const node of tickers as TickerEl[]) {
    if (node.__tickSource == null) node.__tickSource = node.textContent ?? "";
    node.textContent = node.__tickSource;
    const pieces = node.__tickSource.match(/(\d[\d,]*(?:\.\d+)?)|(\D+)/g) ?? [];
    node.__tickParts = pieces.map((piece) => {
      if (!/\d/.test(piece)) return { text: piece };
      const decimals = /\.(\d+)/.exec(piece)?.[1].length ?? 0;
      const value = parseFloat(piece.replace(/,/g, ""));
      let start = 0;
      if (value > 20) {
        start = Math.max(Math.ceil(value * 0.55), Math.pow(10, String(Math.round(value)).length - 1));
        if (start >= value) start = value - 1;
      }
      return { value, decimals, start };
    });
  }

  const state = { p: 0 };
  const render = () => {
    for (const node of tickers as TickerEl[]) {
      node.textContent = (node.__tickParts ?? [])
        .map((part) => {
          if ("text" in part) return part.text;
          const v = part.start + (part.value - part.start) * state.p;
          return part.decimals ? v.toFixed(part.decimals) : Math.round(v).toLocaleString("en-AU");
        })
        .join("");
    }
  };
  render();

  const tickAt = options.tickAt ?? Math.min(1.5, inEnd * 0.35);
  const tickDuration = Math.max(1, Math.min(options.tickDuration ?? 3.2, inEnd - tickAt));
  timeline.to(state, { p: 1, ease: "power2.out", onUpdate: render, duration: tickDuration }, tickAt);
  timeline.to(
    state,
    { p: 0, ease: "power2.in", onUpdate: render, duration: tickDuration, immediateRender: false },
    total - tickAt - tickDuration,
  );
}
