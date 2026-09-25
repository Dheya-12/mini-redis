# Fidelity report — Sobha Privy Collection

Reference: https://sobha-privy-collection.com/ (live, captured 2026-09-25)
Target: this project, `npm run build && npm start`
Harness: `tools/visual-diff/` (Playwright / Chromium, DPR 1, same machine and browser build for both sides)

## Method

This is a clean-room reconstruction. The public server-rendered markup and stylesheets were captured as data
(`tools/extract-content.mjs`, `tools/extract-styles.mjs`). Every behaviour was re-implemented in original TypeScript
from measurements of the running site and from the values its public bundles configure: scroll keyframes, easings,
durations, camera paths, focal lengths and smoothing factors. It is checked by numbers, not by eye:

- **Scroll frames:** each route is captured at whole-viewport scroll steps (0, 1 vh, 2 vh, … to the end) and
  pixel-diffed (`pixelmatch`, threshold 0.1). Both sides are jumped to each position instantly (the original through
  its own smooth scroller, the reconstruction through Lenis), stepping one screen at a time so every section
  initialises as it would for a visitor. Pages are captured 9 s (home, location) or 5 s after load; each step settles
  2 s (6 s on `/location`, whose camera eases towards the scroll position).
- **WebGL:** the three scenes (three worlds, Handpicked gallery, 3D map) render with the same three.js release as the
  original (r179), on the same software rasteriser on both sides (`--use-gl=swiftshader`), so their output is compared
  pixel for pixel.
- **Films** (Kinescope players on the original, local MP4 loops here) are hidden on both sides; their placeholder
  images, which sit under them, are compared instead.
- **Typefaces:** both sides use the original's commercial faces for the comparison. They are not redistributed; see
  the README.

Gates (lift-to-source pipeline): static ≤ 1.0 %, motion frame ≤ 1.5 %. About 0.5 % is anti-aliasing noise.

## Results — scroll frames (pixel diff)

_Filled in from the final run._
