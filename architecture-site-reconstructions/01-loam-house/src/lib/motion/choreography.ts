"use client";

import { alternateSides, isMobile } from "./gsap";
import type { Move } from "./mirrored-reveal";
import { splitLines } from "./split-lines";

/**
 * Elements opt into the chapter reveal with `data-reveal="<role>"`. Each role has one
 * motion across the whole site (times in beats on the chapter clock):
 *
 *   plate-title  drops in from above          heading   lines enter from alternating sides, long blur
 *   plate-num    slides up behind the title   eyebrow   enters from the right with blur
 *   stats        descends as a unit           stats-label  drops through its mask under the rule
 *   body         rises with blur, cascaded    list      rises as a unit, after the body
 *   location     resolves in place            card      (phone enquiry chapter) rises in
 */
export const MAP_TIMING = {
  scrub: 6,
  band: 85,
  dotsAt: 3.333,
  dotsDuration: 7.333,
  dotsStagger: 0.333,
  dotsTravel: 0.4,
  dotsExitAt: 1,
  chromeAt: 9.167,
  noteAt: 8.333,
  notePace: 2,
  cameraDistance: 2.4,
  cameraRotation: 15,
  cameraEase: "sine.inOut",
} as const;

const q = (root: Element, role: string) => Array.from(root.querySelectorAll(`[data-reveal="${role}"]`));

function headingLines(root: Element, role = "heading") {
  return q(root, role).flatMap((h) => splitLines(h as HTMLElement));
}

/** The shared vocabulary for content chapters. */
export function chapterMoves(chapter: HTMLElement): { moves: Move[]; tickers: HTMLElement[] } {
  const kind = chapter.dataset.chapter;
  const moves: Move[] = [];
  const fromSide = alternateSides(0.28);

  // Enquiry chapter: only on phones is the card a scrubbed beat of its own.
  if (kind === "enquiry") {
    if (isMobile()) {
      const card = q(chapter, "card");
      moves.push({ targets: card, from: { y: 70, opacity: 0 }, duration: 2.4, ease: "power2.out", at: 0.3 });
      moves.push({ targets: card, from: { filter: "blur(8px)" }, duration: 2.8, ease: "power1.out", at: 0.3 });
    }
    return { moves, tickers: [] };
  }

  // Contact chapter: the eyebrow and the heading perform; the form never scrubs.
  if (kind === "contact") {
    const eyebrow = q(chapter, "eyebrow");
    moves.push({ targets: eyebrow, from: { x: 200, opacity: 0 }, duration: 1.8, ease: "power3.out", at: 0.2 });
    moves.push({ targets: eyebrow, from: { filter: "blur(9px)" }, duration: 2.2, ease: "power1.out", at: 0.2 });
    const lines = headingLines(chapter);
    moves.push({ targets: lines, from: { x: fromSide, opacity: 0 }, duration: 4.4, ease: "power3.out", at: 0.1 });
    moves.push({ targets: lines, from: { filter: "blur(22px)" }, duration: 4.5, ease: "power1.out", at: 0 });
    return { moves, tickers: [] };
  }

  // Chapter plate: the title drops first, then the numeral rises behind it.
  const plateTitle = q(chapter, "plate-title");
  const plateNum = q(chapter, "plate-num");
  moves.push({ targets: plateTitle, from: { yPercent: -240 }, duration: 1.4, ease: "power3.out", at: 0 });
  moves.push({ targets: plateTitle, from: { filter: "blur(6px)" }, duration: 2, ease: "power1.out", at: 0 });
  moves.push({ targets: plateNum, from: { yPercent: 110 }, duration: 2.4, ease: "power3.out", at: 0.9 });
  moves.push({ targets: plateNum, from: { filter: "blur(6px)" }, duration: 3, ease: "power1.out", at: 0.9 });

  // Heading: the signature move, and the earliest.
  const lines = headingLines(chapter);
  moves.push({ targets: lines, from: { x: fromSide, opacity: 0 }, duration: 4.4, ease: "power3.out", at: 0.1 });
  moves.push({ targets: lines, from: { filter: "blur(22px)" }, duration: 4.5, ease: "power1.out", at: 0 });

  const eyebrows = q(chapter, "eyebrow");
  moves.push({ targets: eyebrows, from: { x: 220, opacity: 0 }, duration: 1.8, ease: "power3.out", at: 1.6, stagger: 0.15 });
  moves.push({ targets: eyebrows, from: { filter: "blur(9px)" }, duration: 2.2, ease: "power1.out", at: 1.6, stagger: 0.15 });

  const statsLabel = q(chapter, "stats-label");
  moves.push({ targets: statsLabel, from: { yPercent: -130 }, duration: 1.8, ease: "power3.out", at: 3.2 });
  moves.push({ targets: statsLabel, from: { filter: "blur(6px)" }, duration: 2.4, ease: "power1.out", at: 3.2 });

  const stats = q(chapter, "stats");
  moves.push({ targets: stats, from: { y: -110, opacity: 0 }, duration: 2.6, ease: "power2.out", at: 1.5 });
  moves.push({ targets: stats, from: { filter: "blur(7px)" }, duration: 2.9, ease: "power1.out", at: 1.5 });
  const tickers = stats.length ? (Array.from(chapter.querySelectorAll("[data-ticker]")) as HTMLElement[]) : [];

  const body = q(chapter, "body");
  moves.push({ targets: body, from: { y: 46, opacity: 0 }, duration: 2.2, ease: "power2.out", at: 1.7, stagger: 0.12 });
  moves.push({ targets: body, from: { filter: "blur(7px)" }, duration: 2.6, ease: "power1.out", at: 1.7, stagger: 0.12 });

  const lists = q(chapter, "list");
  moves.push({ targets: lists, from: { y: 60, opacity: 0 }, duration: 2.3, ease: "power2.out", at: 1.9, stagger: 0.18 });
  moves.push({ targets: lists, from: { filter: "blur(7px)" }, duration: 2.7, ease: "power1.out", at: 1.9, stagger: 0.18 });

  const location = q(chapter, "location");
  moves.push({ targets: location, from: { opacity: 0, filter: "blur(6px)" }, duration: 2.2, ease: "power2.out", at: 2.1 });

  if (kind === "precinct") moves.push(...precinctMoves(chapter));

  return { moves, tickers };
}

/**
 * The precinct chapter runs on a longer clock (scrub 6 over an 85% band): thirteen dots
 * fly onto the plan from alternating sides, then the note performs at half the hero's pace,
 * and the journey control fades in last.
 */
function precinctMoves(chapter: HTMLElement): Move[] {
  const T = MAP_TIMING;
  const moves: Move[] = [];
  const dotSide = alternateSides(T.dotsTravel);

  const dots = q(chapter, "dot");
  moves.push({
    targets: dots,
    from: { x: dotSide, opacity: 0 },
    duration: T.dotsDuration,
    ease: "sine.inOut",
    at: T.dotsAt,
    stagger: T.dotsStagger,
    exitAt: T.dotsExitAt,
  });

  const k = T.notePace;
  const lines = headingLines(chapter, "note-heading");
  moves.push({ targets: lines, from: { x: alternateSides(0.28), opacity: 0 }, duration: 4.4 * k, ease: "power3.out", at: T.noteAt });
  moves.push({ targets: lines, from: { filter: "blur(22px)" }, duration: 4.5 * k, ease: "power1.out", at: T.noteAt });

  const eyebrow = q(chapter, "note-eyebrow");
  moves.push({ targets: eyebrow, from: { x: 220, opacity: 0 }, duration: 1.8 * k, ease: "power3.out", at: T.noteAt + 1.5 * k });
  moves.push({ targets: eyebrow, from: { filter: "blur(9px)" }, duration: 2.2 * k, ease: "power1.out", at: T.noteAt + 1.5 * k });

  const lede = q(chapter, "note-body");
  moves.push({ targets: lede, from: { y: 46, opacity: 0 }, duration: 2.2 * k, ease: "power2.out", at: T.noteAt + 1.7 * k });
  moves.push({ targets: lede, from: { filter: "blur(7px)" }, duration: 2.6 * k, ease: "power1.out", at: T.noteAt + 1.7 * k });

  const chrome = q(chapter, "chrome");
  moves.push({ targets: chrome, from: { opacity: 0, filter: "blur(8px)" }, duration: 3, ease: "power2.out", at: T.chromeAt });

  return moves;
}
