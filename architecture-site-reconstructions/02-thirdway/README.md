# Thirdway — clean-room Next.js reconstruction

Reconstruction of [thirdway.com](https://www.thirdway.com/) (brand & website by How&How, built by Hambly Freeman)
as a Next.js 16 App Router project. 60 routes are statically generated: the home page, the 16 top-level and legal
pages, 22 project case studies and 21 journal articles.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint && npm run typecheck && npm test
```

## Typefaces (read this first)

The site uses two commercial typefaces, **KMR Waldenburg Medium** and **ABC Marist Book**. They are licensed per
domain and are **not** included. If you have a licence, copy the files to:

```
public/fonts/licensed/KMRWaldenburg-Medium.woff2
public/fonts/licensed/ABCMarist-Book.woff2
```

They are picked up automatically, and the folder is git-ignored. Without them the site uses open-licence stand-ins
(Inter Tight and Newsreader, SIL OFL, in `public/fonts/fallback/`). These are metric-matched to the originals, so
line breaks and spacing stay close; see `src/app/fonts.css`.

## How it is built

| Path | What it is |
|------|------------|
| `src/content/pages/*.json` | One file per route: the page's server-rendered markup as a compact element tree (`[tag, props, ...children]`), with media pointing at `/media/*` |
| `src/content/chrome.json` | Header and menu, footer, cookie banner and preferences, page-transition curtain, contact dialog, footer "you've scrolled" facts |
| `src/content/listing.json` | Full project (87) and article (27) listings behind Load More, the filters and search |
| `src/content/teams.json`, `intro-lottie.json` | Team wordmarks (SVG trees) and the intro monogram animation |
| `src/lib/tree.ts` | Renders element trees in server components |
| `src/app/[[...slug]]/page.tsx` | Static route generation plus per-page metadata |
| `src/components/SiteEffects.tsx` | Persistent chrome behaviour: Lenis smooth scroll, header clock and colour scheme, menu, cookie UI, contact dialog, footer ruler, page transitions |
| `src/components/PageEffects.tsx` | Per-route wiring of the block behaviours below |
| `src/components/IntroLoader.tsx` | First-visit home intro (monogram, then panels opening onto the hero film) |
| `src/behaviours/reveal.ts` | Line reveals (SplitText), fade-ups, scroll-fill paragraphs |
| `src/behaviours/home.ts` | Home hero, pinned featured-projects stack, client-logo marquees |
| `src/behaviours/blocks.ts` | Process steps, case-study scroller, services stack, People hero |
| `src/behaviours/listings.ts` | Projects and Journal index controls, stat counters |
| `src/behaviours/carousels.ts` | Every Swiper carousel, using geometry measured on the live site |
| `src/behaviours/deepdive.ts`, `src/components/BodyPortal.tsx` | The "Deep Dive" card on three project pages and its article dialog (rendered at the end of `<body>`) |
| `tools/extract-content.mjs` | Build-time extractor that produced `src/content` from the captured public HTML |
| `tools/visual-diff/` | Capture and pixel-diff harness used for `FIDELITY.md` |

Libraries: Next 16.3.6, React 19.2, Tailwind CSS 4, GSAP 3.15 (ScrollTrigger, SplitText), Lenis 1.3.25,
Swiper 14.2, lottie-web 5.13.

## Differences from the live site

- **Integrations:** the contact dialog validates and acknowledges locally (no backend). Cookie choices are stored
  in `localStorage`. No analytics.
- **Video:** films are served as local MP4 files instead of Vimeo, Mux or HLS streams. Long journal films are 360p.
  The YouTube embed on one article is kept.
- **Images:** each image ships as one rendition (the largest the original served) without `srcset`. On phones the
  original stretches a 430px-wide rendition across the screen, so these images look sharper here.
- **Out of scope:** projects and articles that are only reachable through "Load More" link to the original site.
  See `DECISIONS.md` at the repository root.

All images, films and copy belong to Thirdway and are included only so the reconstruction can be compared with the
original.
