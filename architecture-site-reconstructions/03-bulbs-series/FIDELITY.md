# Fidelity report — Bulbs by Simon Dupety

Reference: https://bulbs.simondupety.com/ (live, captured 2026-09-25)
Target: this project, `npm run build && npm start`
Harness: `tools/visual-diff/` (Playwright / Chromium, DPR 1, same machine and browser build for both sides)

## Method

This is a clean-room reconstruction. The page markup was captured from the public server-rendered HTML. Every
behaviour was **measured** on the running site and re-implemented in original TypeScript and GLSL. Measurements
include element geometry, event timings, image-edge positions sampled every 40 px of scroll, and timestamped
screencasts of the transitions. It is checked by numbers, not by eye:

- **Scroll frames:** each route is captured at whole-viewport scroll steps (0, 1 vh, 2 vh, … to the end) and
  pixel-diffed (`pixelmatch`, threshold 0.1). The home page is captured 9 s after load, once the intro has
  finished. Each step settles for 2.5 s so the eased stack comes to rest.
- **WebGL:** every image on the site is drawn by a WebGL layer. Both sides use the same software rasteriser
  (`--use-gl=swiftshader`), so the shader output is compared pixel for pixel.
- **Text geometry:** visible text elements are matched by their text. Their boxes, font size, line height, letter
  spacing, colour and opacity are compared.
- **Typefaces:** both sides use Big Caslon FB for the comparison. It is not redistributed; see the README.

Gates (lift-to-source pipeline): static ≤ 1.0 %, motion frame ≤ 1.5 %. About 0.5 % is anti-aliasing noise.

## Results — scroll frames (pixel diff)

63 frames over 4 routes: the home collection, About, and two product pages. All 20 product pages share one
template. Cells show the mean and the worst frame per route.

| Route | 1440px mean / worst (frames) | 1024px mean / worst (frames) | 390px mean / worst (frames) |
|---|---|---|---|
| / | 0.08% / 0.49% (20) | 0.11% / 0.25% (17) | 0.32% / 0.65% (12) |
| /about | 0.00% / 0.00% (2) | 0.00% / 0.00% (2) | 0.32% / 0.54% (2) |
| /products/influorescence-c7.1 | 0.08% / 0.08% (1) | 0.09% / 0.09% (1) | 0.19% / 0.22% (2) |
| /products/cirva-1.x | 0.12% / 0.12% (1) | 0.14% / 0.14% (1) | 0.29% / 0.29% (2) |

| Width | Frames | ≤ 1.0 % | ≤ 1.5 % |
|---|---|---|---|
| 1440 × 900 | 24 | 24 | 24 |
| 1024 × 768 | 21 | 21 | 21 |
| 390 × 844 (touch) | 18 | 18 | 18 |
| **All** | **63** | **63 (100 %)** | **63 (100 %)** |

**Result: every frame passes the gate.** The worst frame is 0.65 %. Page heights and scroll limits match the
original exactly at all three widths.

**Text geometry:** no differences in any of the 63 frames.

## Results — interaction states (1440 × 900)

Captured by `interactions.mjs`: identical pointer actions on both sides, screenshots at fixed times after each
action.

| State | Diff |
|---|---|
| Stack at the end of the collection | 0.09 % |
| Hovering a title (its photograph comes to the top of the stack) | 0.03 % |
| Flight to the product page, 0.7 s after clicking a title | 0.03 % |
| Product page after the flight | 0.04 % |
| Product photograph enlarged | 0.08 % |
| Next photograph (after the wipe) | 0.12 % |
| Sound switched on | 0.00 % |
| Intro, 4.5 s and 8 s after load | 0.17 %, 0.00 % |
| Intro, 1.5 s and 3 s after load | 0.82 %, 4.25 % — timing, see below |

The two early intro frames differ in timing only. The original waits for its first five photographs from a CDN
before the intro starts, while the reconstruction loads them from localhost, so it is a few frames further into the
same zoom.

**Motion timing** (timestamped screencasts, 12–19 fps):

- **Next-photograph wipe:** fitted as sine in-out, starting 0.08 s after the click and lasting 1.22 s. The
  reconstruction measures 0.14 s and 1.24 s, within two screencast frames.
- **Enlarging a photograph:** the other photographs slide in under the clicked one during the first 60 % of the
  move, then the pile grows into the large slot. This matches the original's sequence.
- **Stacking:** starts at the same scroll position as the original's (7823 px at 390 × 844). The stacked card
  lands within 1 px of the original's.

## Functional checks (both sides, 1440 and 390 touch)

- Title click or tap → flight → `/products/influorescence-c7.1`, with the page title matching.
- "← Back" → home, restored at the end of the collection with the stack formed.
- "About" → `/about`. The original shows `/about/` because its router follows a server redirect.
- "Price List" opens the same Google Drive PDF.
- No console errors in the reconstruction.
- `npm test`: 6/6 (markup rendering; 22 routes and 20 products; 20 gallery images on home; all media self-hosted;
  all internal links resolve).

## Known deviations

- **WebGL shaders are our own.** They reproduce the effects by measurement (see the method above). While images
  travel to the product slot, the original also wobbles their edges like cloth; the reconstruction moves them flat.
- **About transition:** the page dims and fades. The original also flies its cover photograph in WebGL over the
  dimmed page. The settled About page is identical (0.00 %).
- **Lazy photographs and layout:** six photographs are 2:3 inside 4:5 frames and grow their frames once loaded. The
  original measures the strip before those photographs arrive, so its result varies with load order. The
  reconstruction always lays the strip out as it would be before they load, which is the original's usual outcome
  (see DECISIONS.md).
- **Analytics** (Umami) removed.
