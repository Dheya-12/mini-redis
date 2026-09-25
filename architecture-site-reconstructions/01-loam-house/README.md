# Loam House — clean-room Next.js reconstruction

A clean-room reconstruction of the publicly observable UX/UI of
[residences.loamhouse.com.au](https://residences.loamhouse.com.au/) (credited on Awwwards to **FrontageDigital**):
a one-page, "chaptered" scroll journey for a residential development in Sandringham, Melbourne.

Written from scratch in Next.js (App Router) + TypeScript + Tailwind CSS v4 + GSAP 3.13. No original source code
is included; values (sizes, colours, timings, eases) were measured from the rendered public site.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint
npm run typecheck
```

Node 20.9+ is required (Next.js 16).

Optional environment variables:

| Variable | Effect |
| --- | --- |
| `NEXT_PUBLIC_CALENDLY_URL` | Adds a "Choose a time" link (prefilled) to the appointment dialog |
| `NEXT_PUBLIC_BROCHURE_URL` | Target of "View the brochure now" after the brochure form (default `#`) |

## What is reconstructed

- **Load curtain** — seven ink stripes held until the hero video can play, fonts are ready and the poster has
  decoded; the wordmark sharpens from blur with a live percentage, then the stripes lift on a staggered ramp.
- **Masthead** — transparent over imagery, frosted paper once scrolled; nav links blur on hover; pill CTAs whose
  dark circle floods the pill (bobbing download arrow, popping calendar dots). ≤1050px: CTAs on their own row;
  ≤800px: burger + short labels.
- **Phone menu** — five-stripe curtain, links sliding up through masks in sequence, morphing burger.
- **Hero** — skyline intro clip hard-cutting into an ambient loop (desktop), still image (phone); a one-shot
  entrance (alternating-side headline lines with long blur) released by the curtain, and a scrubbed exit.
- **Enquiry card** — ink card overlaying the hero (desktop), swinging through on a scrubbed rotation (801–1050px),
  its own chapter (phones). Brochure ⇄ call-back morph, focus underlines, idle caret, thank-you performance and a
  post-success call-back offer. Submits to a local mock `/api/lead`.
- **Chapters 01–04** — full-bleed renders; every element role has one motion (plates, headings, eyebrows, stats,
  body, lists), scroll-scrubbed with an exit that is the exact mirror of the entrance; number tickers count up
  as stat blocks land. Finishes tags cross-dissolve the background.
- **05 The precinct** — interactive SVG map with its own camera (the viewBox): the entry camera flies in and
  un-rotates with the scroll; 13 breathing amenity dots fly onto the plan; hover whispers the name; click dives
  into a dot (van Wijk–Nuij zoom path, sway, photo revealed through a circular lens, copy performance); the
  corner control pulls out to the neighbourhood (roads, suburbs, stations, landmarks) with speed-tied motion blur.
- **06 The place** and **07 Contact** — three-step validated enquiry with progress dots, footer folded onto the
  final image; `/privacy-policy` and `/disclaimer` document pages.
- **Navigation model** — GSAP ScrollSmoother; on desktop the wheel/keys/links glide one chapter at a time and a
  released scrollbar settles into the nearest chapter; on touch a flick coasts into the next chapter.

## Structure

```
src/app/                 layout, page, legal pages, /api/lead mock, self-hosted fonts
src/components/site/     masthead, burger, menu sheet, curtain, booking dialog, UI context
src/components/chapters/ one component per chapter
src/components/motion/   EditorialEngine — builds the whole motion system after mount
src/lib/motion/          mirrored reveal primitive, choreography vocabulary, hero, curtain, chapter nav
src/lib/map/             camera maths, PrecinctMapEngine, camera hand-off
src/content/             all copy and map data
src/styles/              component CSS (Tailwind `components` layer)
```

## Differences from the original

- Analytics/ads tags are not included. Lead forms post to a mock endpoint; the scheduling popup is replaced by a
  local dialog. The brochure PDF and the unused 9:16 phone hero clip are not bundled.
- See `FIDELITY.md` for measured visual-diff results.

## Rights

The imagery, video, copy and brand belong to their owners (Auyin / Loam House). They are included only so the
reconstruction can be compared visually with the original; replace them before any other use.
