# Bulbs by Simon Dupety — clean-room Next.js reconstruction

Reconstruction of [bulbs.simondupety.com](https://bulbs.simondupety.com/) (website by Joffrey Spitzer; Awwwards
nominee) as a Next.js 16 App Router project. 22 routes are statically generated: the home collection, About and the
20 product pages.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
npm run lint && npm run typecheck && npm test
```

## Typefaces

- **Special Gothic** (SIL Open Font License): the same file the original loads from Google Fonts, self-hosted in
  `public/fonts/`.
- **Big Caslon FB** is commercial (Font Bureau) and is **not** included. With a licence, copy it to
  `public/fonts/licensed/BigCaslonFB-Roman.woff` (git-ignored) and it is used automatically. Otherwise the titles use
  Libre Caslon Text (SIL OFL), metric-matched to Big Caslon (`src/app/fonts.css`).

## How it is built

| Path | What it is |
|------|------------|
| `src/content/pages/*.json` | One file per route: the page's server-rendered markup as a compact element tree (`[tag, props, ...children]`), with images pointing at `/media/*` |
| `src/content/chrome.json` | Header, preloader and the "Click to enable sound" prompt |
| `src/lib/tree.ts` | Renders element trees in server components |
| `src/gl/shaders.ts`, `src/gl/scene.ts` | The WebGL image layer (three.js): the home intro, the scrolling "ribbon" that rolls images back as they rise, the stacked card beside the title list, the flight to a product page, product-page enlarge/cycle, the About cover |
| `src/behaviours/text.ts` | The four custom elements of the markup: `c-title` (line reveals), `c-paragraph`, `c-shuffle` (scramble-in titles), `c-media` (parallax / fade) |
| `src/behaviours/sound.ts` | Interface sound, synthesised with Web Audio (ambient pad, hover and click tones) |
| `src/behaviours/navigation.ts` | Page transitions: fade, home ↔ product flight, return to the stacked selection, About dim |
| `src/behaviours/page.ts` | Preloader, WebGL layer placement, image credits on hover |
| `src/behaviours/smooth.ts` | Lenis smooth scrolling (lerp 0.075, wheel × 1.4) |
| `tools/extract-content.mjs` | Build-time extractor that produced `src/content` from the captured public HTML |
| `tools/visual-diff/` | Capture and pixel-diff harness used for `FIDELITY.md` |

Libraries, pinned to the versions the original loads: GSAP 3.14.2 (ScrollTrigger, SplitText, ScrambleText),
three.js r184, Lenis 1.3.21. Next 16.3.6, React 19.2, Tailwind CSS 4.

## Differences from the live site

- **WebGL effects are our own shaders.** The effects look the same: the page roll, the stacking wave and the
  unfolding intro. Tuning values (pivot, radius, focal length, fold depths, durations and eases) were measured on the
  original. The small paper-wave and cloth-noise details of the original's product-page slide are simplified to a
  cross-fade.
- **About transition:** the page dims and fades; the original's animated WebGL cover flight is not reproduced.
- **Phones** scroll the window rather than a fixed `<main>` container; the layout is the same.
- **Analytics** (Umami) is removed. The Price List link still opens the original's PDF on Google Drive.

All photographs and copy belong to Simon Dupety and the credited photographers and are included only so the
reconstruction can be compared with the original.
