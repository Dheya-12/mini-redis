/**
 * Pure timing helpers behind the reveal system (no DOM, no GSAP), unit-tested in
 * timing.test.ts.
 */

/** power2.out ↔ power2.in; inOut eases are their own mirror. */
export function mirrorEase(ease = "power2.out") {
  if (ease.includes(".inOut")) return ease;
  if (ease.includes(".out")) return ease.replace(".out", ".in");
  if (ease.includes(".in")) return ease.replace(".in", ".out");
  return ease;
}

type Timed = { at?: number; duration: number; stagger?: number; targets: ArrayLike<unknown> };

/** Latest finishing beat of a set of moves = the length of the entrance. */
export function entranceLength(moves: Timed[]) {
  return moves.reduce((max, m) => {
    const end = (m.at ?? 0) + m.duration + (m.stagger ?? 0) * (m.targets.length - 1);
    return Math.max(max, end);
  }, 0);
}

/** Where a move's mirrored exit starts: its entrance, reflected about the end of the entrance. */
export function mirroredExitAt(m: Timed & { exitAt?: number }, inEnd: number) {
  if (m.exitAt != null) return inEnd + m.exitAt;
  const at = m.at ?? 0;
  return inEnd + (inEnd - (at + m.duration)) - (m.stagger ?? 0) * (m.targets.length - 1);
}

export type TickPart = { text: string } | { value: number; decimals: number; start: number };

/**
 * Splits a figure like "86–275" or "246.5–275" into literal text and countable numbers.
 * Big numbers count from nearby (no digit-count jumps); numbers ≤ 20 count from zero.
 */
export function parseTicker(source: string): TickPart[] {
  const pieces = source.match(/(\d[\d,]*(?:\.\d+)?)|(\D+)/g) ?? [];
  return pieces.map((piece) => {
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

/** The ticker's text at progress `p` (0 = start values, 1 = the authored figure). */
export function renderTicker(parts: TickPart[], p: number) {
  return parts
    .map((part) => {
      if ("text" in part) return part.text;
      const v = part.start + (part.value - part.start) * p;
      return part.decimals ? v.toFixed(part.decimals) : Math.round(v).toLocaleString("en-AU");
    })
    .join("");
}
