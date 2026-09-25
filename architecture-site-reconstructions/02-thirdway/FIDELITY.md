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

__RESULTS__

## Results — interaction states

__INTERACTIONS__

## What is left, and why

__RESIDUALS__

## Re-running

See `tools/visual-diff/README.md`. The reference is the live site, so numbers drift when its content changes.
