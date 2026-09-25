# Fidelity report — Thirdway

Reference: https://www.thirdway.com/ (live, captured 2026-09-25; home page re-captured at 12:20 UTC after the site's
own content changed)
Target: this project, `npm run build && npm start`
Harness: `tools/visual-diff/` (Playwright / Chromium, DPR 1, same machine and browser build for both sides)

## Method

This is a clean-room reconstruction. Values were **measured** on the rendered public site (computed styles, element
geometry, and timings recorded from DOM mutations and scroll sampling) and re-implemented in original TypeScript. It is
checked by numbers, not by eye:

- **Scroll frames:** each route is captured at whole-viewport scroll steps (0, 1 vh, 2 vh, …) after load and after the
  reveals at each step have settled. Every frame is pixel-diffed (`pixelmatch`, threshold 0.1).
- **Text geometry:** visible text elements are matched by their text. Their boxes, font size, line height, letter
  spacing, colour and opacity are compared (`compare.mjs --text`).
- **Determinism:** both sides mask regions driven by wall-clock time or the pointer: the London clock, the
  client-logo marquees, the drifting portraits on /people, the footer ruler, and the "View project" cursor. Films are
  compared on their poster frames at t = 0.5 s (headless Chromium has no H.264).
- **Typefaces:** both sides use the site's licensed typefaces for the comparison. They are not redistributed; see the
  README.

Gates (lift-to-source pipeline): static ≤ 1.0 %, motion frame ≤ 1.5 %. About 0.5 % is anti-aliasing noise.

## Results — scroll frames (pixel diff)

377 frames over 13 routes (every top-level template, one project and one article). Cells show the mean and the
worst frame per route.

| Route | 1440px mean / worst (frames) | 1024px mean / worst (frames) | 390px mean / worst (frames) |
|---|---|---|---|
| / | 0.06% / 0.59% (11) | 0.14% / 0.68% (11) | 1.48% / 7.40% (11) |
| /approach | 0.99% / 4.12% (10) | 1.53% / 5.70% (11) | 0.93% / 2.79% (11) |
| /services | 0.31% / 1.36% (12) | 2.25% / 16.37% (11) | 3.16% / 15.02% (13) |
| /people | 0.06% / 0.79% (17) | 0.07% / 0.48% (17) | 0.22% / 1.55% (20) |
| /projects | 0.00% / 0.00% (7) | 0.57% / 1.23% (7) | 0.32% / 1.66% (10) |
| /journal | 0.00% / 0.01% (6) | 0.10% / 0.23% (6) | 0.36% / 2.02% (12) |
| /vision-and-values | 0.08% / 0.44% (7) | 0.38% / 1.00% (7) | 0.92% / 3.35% (6) |
| /our-home | 0.39% / 0.62% (7) | 0.75% / 1.77% (7) | 1.08% / 3.21% (6) |
| /esg | 0.66% / 2.69% (11) | 0.85% / 2.79% (11) | 2.36% / 4.17% (11) |
| /careers | 0.01% / 0.04% (7) | 0.21% / 0.71% (8) | 0.31% / 1.53% (7) |
| /project/zopa | 0.00% / 0.00% (12) | 0.42% / 1.07% (11) | 0.71% / 1.45% (10) |
| /journal/behind-the-build-the-campus-in-the-sky | 0.00% / 0.00% (5) | 0.02% / 0.11% (5) | 0.04% / 0.11% (4) |
| /privacy-policy | 0.00% / 0.00% (9) | 0.00% / 0.01% (11) | 0.00% / 0.00% (12) |

| Width | Frames | ≤ 1.0 % | ≤ 1.5 % |
|---|---|---|---|
| 1440 × 900 | 121 | 115 | 116 |
| 1024 × 768 | 123 | 109 | 113 |
| 390 × 844 (touch) | 133 | 93 | 99 |
| **All** | **377** | **317 (84 %)** | **328 (87 %)** |

**Result: not every frame passes.** At 1440 and 1024 all but 20 frames are within 1.0 %. Most of the rest have a cause
that was measured and is explained below. Page heights and the positions of every block match the original to within
3 px at all three widths.

**Text geometry:** every visible text element on these routes matches the original's box, typeface, size, line height,
letter spacing and colour. The only differences reported are in the header's "Lately" ticker, which drifts with time
and sits inside the closed menu.

## Results — interaction states

Captured on both sides with `tools/visual-diff/interactions.mjs` (1440 × 900 unless noted).

| State | Diff | Notes |
|---|---|---|
| Menu open (panels, links, Lately strip) | 0.11 % | the Lately cards drift with time |
| Contact dialog | 0.27 % | form fields, validation copy |
| Cookie preferences drawer | 0.00 % | |
| Mobile menu open (390 × 844) | 1.02 % | the Lately strip drifts with time |
| Project "Deep Dive" dialog (/project/zopa) | 0.78 % | article text, image, close button |

Functional checks, run side by side against the original:

- **Carousels:** on every carousel of nine routes, two clicks on the visible "next" arrow move the track by the same
  distances as on the original at 1440, 1024 and 390 px. The one exception is at 390 px: the original's arrows on
  the ESG image cards and the Our Home image carousel do not move; here they do.
- **Projects index:** Sector and Team filters return the same projects in the same order (Finance: 10; Finance + Studio:
  4), and the address bar shows the same query (`?sector=Finance&team=Studio`). Load More (15 → 30) and the list view
  work.
- **Other:** Journal search, Read more / Read less on the process steps, the page-transition curtain (menu → People),
  and the Deep Dive card show/hide points (within 10 px of the original on desktop and phone). No console errors on
  the pages tested.

## What is left, and why

Frames above 1.5 %, grouped by cause:

1. **Phone images are sharper than the original's** (most 390 px frames between 1.5 % and 4.2 %; `/` frame 00 at 7.4 %).
   On phones the original loads 430 px-wide image renditions and a lower-resolution hero film and stretches them to
   fill the screen. The reconstruction ships one sharp rendition per image. Framing and crop are identical; only
   sharpness differs. (DECISIONS.md, [12:00])
2. **The first image of the Services "featured projects" stack** (`/services` frames 06 and 07 at 1024 px: 16.4 % and
   3.7 %; frames 08–10 at 390 px: 4.0–15.0 %). On the original, this image's vertical drift depends on how the page
   was scrolled to it, not only on the scroll position. The reconstruction reproduces the rule found on eight sampled
   scroll paths (home and Services at 1440, 1024 and 390), but the original's Services page at 1024 and 390 does not
   follow it. The drift is ±4 % of the image height. (DECISIONS.md, [11:55])
3. **The Approach process block at 1440** (`/approach` frames 02–04: 2.0–4.1 %). The pinned block sits 1.00 px higher
   than on the original at 1440 × 900; at 1024 × 768 the pin position matches exactly. At 1024 (frames 04–07,
   3.5–5.7 %) the cards flying between steps are up to 3 px from the original's positions in mid-transition. Resting
   positions match.
4. **ESG frames 04 and 07** (1.99–2.79 % at 1440 and 1024). A heading and image are revealed a frame earlier or later
   than on the original because their tops sit within a few pixels of the reveal threshold.

Measured, not guessed: reveal thresholds (line reveals at 85 % of the viewport; fade-ups 200 px above the viewport
bottom), pin positions and lengths, carousel geometry at each breakpoint, image drift percentages, card sizes, the
switch points of every scroll-driven caption, and the timings of menu, dialog, curtain and popup animations.

## Re-running

See `tools/visual-diff/README.md`. The reference is the live site, so numbers drift when its content changes.
