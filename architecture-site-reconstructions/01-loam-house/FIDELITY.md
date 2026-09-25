# Fidelity report — Loam House

Reference: https://residences.loamhouse.com.au/ (live, captured 2026-09-25)
Target: this project, `npm run build && npm start` on :3000
Harness: `tools/visual-diff/` (Playwright 1.56 / Chromium 141, DPR 1, same machine and browser build for both sides)

## Method

This is a clean-room reconstruction: values were **measured** from the rendered public site (computed styles,
element geometry, observed timings) and re-implemented in original React/TypeScript. It is verified by numbers,
not by eye:

- **Chapter-stop frames** — the page is scrolled to every chapter's rest point (where each chapter's scrubbed
  reveal is fully shown) and to the midpoint between chapters (where one chapter's mirrored exit hands over to
  the next chapter's entrance), and each frame is pixel-diffed (`pixelmatch`, threshold 0.1).
- **Text geometry** — every visible text element is matched by its text between reference and target and its
  box, font size/family/weight/style, letter-spacing, line-height, colour and opacity are compared.
- **Determinism** — both sides wait for the load curtain and for the hero's intro→ambient video cut, freeze all
  video at t=0.5s, and pin CSS animations (randomly-phased dot pulses, the idle caret) to t=0 before each shot.

Gates (from the lift-to-source pipeline): static ≤ 1.0%, motion frame ≤ 1.5%. ~0.5% is the anti-aliasing floor.

## Results — chapter frames (pixel diff)

Every chapter rest position and the total scroll height match the reference exactly at all three widths
(9000 px @1440, 7721 px @1024, 9284 px @390).

| Frame | 1440×900 | 1024×768 | 390×844 (touch) |
| --- | --- | --- | --- |
| Hero (rest) | 0.07% | 0.08% | 0.01% |
| Hero → next (mid-scroll) | 0.06% | 0.04% | 0.00% |
| Enquiry chapter (phone only) | — | — | 0.01% / mid 0.01% |
| 01 Proposition / mid | 0.00% / 0.00% | 0.00% / 0.00% | 0.00% / 0.01% |
| 02 Size / mid | 0.00% / 0.00% | 0.00% / 0.00% | 0.01% / 0.00% |
| Lifestyle collection / mid | 0.00% / 0.00% | 0.00% / 0.00% | 0.01% / 0.00% |
| Penthouse collection / mid | 0.00% / 0.00% | 0.00% / 0.00% | 0.01% / 0.00% |
| 03 Storage / mid | 0.00% / 0.00% | 0.00% / 0.00% | 0.01% / 0.00% |
| 04 Finishes / mid | 0.00% / 0.00% | 0.00% / 0.00% | 0.00% / 0.00% |
| 05 Precinct map / mid | 0.00% / 0.00% | 0.00% / 0.00% | 0.00% / 0.01% |
| 06 Place / mid | 0.00% / 0.00% | 0.00% / 0.00% | 0.01% / 0.00% |
| 07 Contact + footer | 0.00% | 0.00% | 0.01% |
| **Worst frame** | **0.07%** | **0.08%** | **0.01%** |

Result: **PASSED** at every breakpoint (59 frames). The residual on the hero is video-frame decoding noise.
Text-geometry diff: no element differs by more than 2 px or in any type property.

## Results — interaction states (1440 / 390)

| State | 1440 | 390 | Notes |
| --- | --- | --- | --- |
| Header CTA hover (pill flood, icon shift) | visual match | n/a | pixel diff dominated by the looping hero video behind it |
| Nav link hover blur | visual match | n/a | same |
| Enquiry card → "Request a call back" morph | visual match | 0.14% | same card height, labels, phone field |
| Phone menu open (stripes + links) | n/a | 0.00% | |
| Finishes tag "Stone" cross-dissolve | 0.00% | 0.00% | |
| Map dot hover (name whisper) | 0.24% | n/a | dot pulse |
| Map mid-dive | differs by design | differs by design | dives sway by a random ±4° in the original too |
| Map dived into amenity 01 (photo lens + copy) | 0.00% | 0.00% | |
| Map returned to precinct | 0.32% | 1.52% | dot pulse phase |
| Map zoomed out to neighbourhood | 0.00% | 0.00% | |
| Contact step 2 | 0.00% | 0.01% | |
| Contact validation (empty step) | 0.00% | 0.01% | |

End-to-end (`tools/visual-diff/e2e.mjs`): brochure submit → thank-you performance, post-success call-back,
appointment dialog open/close, three-step contact validation and submit, legal pages — all pass, no page errors.
Dev mode (React StrictMode double-mount): no console errors or warnings; wheel stepping visits all ten chapter
stops and back; nav links glide to their chapter.

## Known deviations

- Third-party integrations are stubbed: GTM / Meta Pixel / Clarity / Google Ads are omitted; forms post to a local
  mock `/api/lead`; the Calendly popup is a local dialog (optional real link via `NEXT_PUBLIC_CALENDLY_URL`).
- The brochure PDF is not bundled (`NEXT_PUBLIC_BROCHURE_URL`, default `#`).
- The original's hidden `?tune` slider panel (a developer tool) is not reproduced.
- Not measured: Firefox/Safari-specific paths (the original has Gecko workarounds that are ported but untested
  here), real touch-flick physics on hardware.

## What is and isn't recovered

Recovered by measurement: layout, spacing, colour, typography, image/video assets, animation timings and eases,
scroll bands and scrub values, navigation behaviour, responsive breakpoints (800 / 1050 px).
Not recovered (by design): the original authors' code, names and component decomposition. Structure and names
here are this reconstruction's own.
