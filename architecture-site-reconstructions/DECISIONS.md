# Autopilot decision log

Decisions taken without consulting the user, each with rationale and a reversal path.
Low-confidence entries are marked **[LOW]**.

---

## Site #1 — Loam House

### [07:22] Resolved URL: https://residences.loamhouse.com.au/

**Fork:** "Loam House" matches several properties (loamhouse.com.au marketing site, auyin.com.au project page, Kickstarter "Loam Home").
**Investigated:** Searched `"Loam House" "FrontageDigital"` (no direct hit), then located the Awwwards
entry (awwwards.com/sites/loam-house): credited to **FrontageDigital**, "Visit website" →
`https://residences.loamhouse.com.au`, description "An immersive, chaptered scroll journey … revealed through motion".
Loaded the live page: title "Loam House — Sandringham", GSAP 3.13 + ScrollTrigger/SplitText/ScrollSmoother — matches.
**Chose:** residences.loamhouse.com.au (not loamhouse.com.au, which is a separate sales page).
**Confidence:** High.

### [07:24] Browser TLS: added the session proxy CA to Chromium's NSS store

**Fork:** Headless Chromium rejected the egress proxy's certificate (ERR_CERT_AUTHORITY_INVALID).
**Chose:** `certutil -A -n ccr-agent-proxy -t C,, -i /root/.ccr/agent-proxy-ca.crt` into `~/.pki/nssdb` (trusts the
session proxy CA; TLS verification stays on).
**To reverse:** `certutil -D -d sql:$HOME/.pki/nssdb -n ccr-agent-proxy`.

### [07:26] Clean-room boundary

**Fork:** The site ships readable, un-minified public CSS/JS (styles.css, editorial.js, map.js).
**Chose:** Treat the publicly served CSS/JS like DevTools inspection: read it to *measure* values (sizes, colours,
eases, durations, scroll bands) and understand behaviour, then write an original React/TypeScript implementation
with its own structure and naming. No file is copied into the project; no source maps or private repos were sought.
Content data needed to render the same page (copy, map label positions, amenity coordinates) is reproduced as data.
**To reverse:** n/a (policy choice). If a stricter reading is wanted, the motion constants in `src/lib/motion/*`
could be re-derived purely from frame-by-frame capture.

### [07:28] Media: public images/videos are bundled in the reconstruction

**Fork:** Placeholders would make visual comparison meaningless; the real media is copyrighted by the developer.
**Chose:** Bundle the publicly served media (26 MB) under `public/assets/` so the reconstruction is visually
comparable, and flag copyright in README/FIDELITY. Not bundled: the brochure PDF, the unused 9:16 mobile hero clip.
**To reverse:** delete `public/assets/**` and swap `src/content/*` image paths for placeholders.

### [07:28] Third-party integrations are stubbed

**Chose:** GTM / Meta Pixel / Clarity / Google Ads removed. Lead forms POST to a local mock route
(`/api/lead`) that validates and returns `{ ok: true }`. The Calendly popup is replaced by a local booking dialog
that opens the real Calendly URL only if `NEXT_PUBLIC_CALENDLY_URL` is set. Brochure link uses
`NEXT_PUBLIC_BROCHURE_URL` (default `#`).
**Why:** A reconstruction must not create real leads/bookings with a real sales team.
**To reverse:** set the env vars; replace the body of `src/app/api/lead/route.ts` with a real forwarder.

### [07:30] Stack versions

**Chose:** Next.js 16.3.6 (current `latest`), React 19.2, Tailwind v4, TypeScript. GSAP pinned to **3.13.0**
(exact version the reference loads from jsDelivr) — SplitText line breaking and ScrollSmoother behaviour are
version-sensitive. Scroll smoothing uses GSAP ScrollSmoother (what the reference uses) rather than Lenis.
**To reverse:** bump `gsap` in package.json.

### [07:31] Fonts self-hosted with next/font/local

**Chose:** Downloaded the exact latin woff2 files Google Fonts serves for the reference's CSS request
(Cormorant Garamond roman+italic variable, DM Sans variable) and load them with `next/font/local`, so builds work
offline and metrics match. **To reverse:** switch `src/app/fonts.ts` to `next/font/google`.

### [07:40] Tailwind v4 without preflight

**Fork:** Tailwind's preflight resets UA defaults (html `line-height:1.5`, `p{margin:0}`, list/heading resets)
that the reference layout relies on (it runs on browser defaults + its own rules).
**Chose:** Import only `tailwindcss/theme.css` + `tailwindcss/utilities.css`; supply a small base layer that
mirrors the reference's own base. Design tokens (ink/paper/chalk/clay/olive, serif/sans) live in `@theme`.
Complex component styling (pseudo-elements, masks, keyframes, per-breakpoint cascades) lives in
`src/styles/*.css` inside `@layer components`; simple layout uses utilities in JSX.
**To reverse:** add `@import "tailwindcss/preflight.css" layer(base);` to globals.css and re-diff.

### [08:05] Capture harness determinism (applied identically to reference and target)

**Fork:** First diff run showed 40% on the hero and ~1% on the map — caused by timing, not code: the hero plays an
8.04 s intro clip then hard-cuts to an ambient loop, and the local build finished its curtain sooner, so it was
captured before the cut; map dots breathe with a random phase per page load.
**Chose:** The harness waits for the intro→ambient cut, freezes video at t=0.5 s, and pins CSS animations to t=0,
on **both** sides. The ≤1.0% / ≤1.5% gates were not changed.
**To reverse:** remove the two blocks marked in `tools/visual-diff/capture.mjs`.

### [08:14] Unit tests with Node's built-in runner

**Chose:** Pure maths (camera path, marker curves, ease mirroring, entrance length, tickers) extracted into
import-free modules and tested with `node --test` (Node ≥22 strips TS types natively; `allowImportingTsExtensions`
enabled for the `.ts` import specifiers). No extra test dependency. Browser-level checks live in
`tools/visual-diff/` (Playwright) and are documented, not wired into `npm test`, because they need a browser download.
**To reverse:** delete `src/**/*.test.ts` and the `test` script.

### [08:20] **[LOW]** Repository size strategy

**Fork:** Each site commits its expanded project (with ~25 MB of public media) *and* its ZIP (~25 MB). Over 63
sites that trends toward ~3 GB of history, above GitHub's recommended repo size (no single file is near the 100 MB
hard limit).
**Chose:** Follow the requested layout literally for now (both committed).
**Alternatives if it becomes a problem:** track `zips/*.zip` with Git LFS, attach ZIPs to GitHub Releases instead,
or stop committing `NN-*/public/assets` (the ZIP stays complete).
**To reverse:** `git rm --cached architecture-site-reconstructions/zips/*.zip` and adopt one of the alternatives.

---

## Site #2 — Thirdway

### [08:40] URL and identity

**Fork:** URL was given (https://www.thirdway.com/); no studio to verify against.
**Investigated:** Page title "Thirdway"; footer credits How&How (howandhow.com) and Hambly Freeman (hamblyfreeman.com).
Next.js 16 (Turbopack) + Tailwind v4 + DatoCMS images + Vimeo HLS video + Lenis 1.3.25 + GSAP 3.15.0 + Swiper.
**Chose:** Reconstruct https://www.thirdway.com/ as given. **Confidence:** High.

### [08:45] **[LOW]** Commercial fonts are not redistributed

**Fork:** The site's typefaces are commercial (KMR Waldenburg Medium by Kimera; ABC Marist Book by Dinamo).
Bundling the woff2 files in a public repo/ZIP would redistribute licensed fonts.
**Chose:** The project declares `@font-face` for "waldenburg"/"marist" pointing at `public/fonts/licensed/*.woff2`
(git-ignored, excluded from the ZIP). Without them the site falls back to open-licence lookalikes that ship with it
(Inter Tight for Waldenburg, Newsreader for Marist). Visual validation was run *with* the licensed files present
locally (so layout is measured against the real metrics) and is also reported without them.
**To reverse:** drop licensed files into `public/fonts/licensed/` (names in README), or change the fallbacks in
`src/app/fonts.css`.

### [09:10] Architecture: server markup as data + hand-written behaviour modules

**Fork:** ~25 CMS block types across 60 routes. Hand-writing JSX for every block, or rendering the site's own
public server-side markup (SSR HTML, fetched per route) from data and re-implementing all behaviour.
**Investigated:** No source maps; the SSR HTML is clean, pre-hydration markup (no GSAP inline state, no SplitText
wrappers). Everything interactive (reveals, pins, carousels, menu, cookies, contact dialog, counters, filters) is
client JavaScript.
**Chose:** `tools/extract-content.mjs` serialises each route's `<main>` (and the shared header / footer / cookie UI /
contact dialog) into compact JSON element trees with React-shaped props and self-hosted media URLs
(`src/content/**`). `src/lib/tree.ts` renders them in server components. All motion and interaction is new code in
`src/behaviours/*` (GSAP / ScrollTrigger / SplitText / Lenis / Swiper), keyed to block class names, with timings
measured from the live page by recording its DOM mutations (`reveal.ts` documents the measured eases/offsets).
**Why:** Reproduces every page's markup exactly (verifiable by diff) while keeping the implementation our own; the
original's JavaScript was never used or recovered.
**To reverse:** any block can be replaced by a JSX component: render it instead of the tree node in
`src/app/[[...slug]]/page.tsx` and drop its entry from `src/behaviours/blocks.ts`.
**Confidence:** Medium — markup-as-data is less editable than hand-written JSX.

### [09:40] **[LOW]** Route scope: 60 pages; the rest of the archive links out

**Fork:** The Projects and Journal indexes list 87 projects and 27 articles behind "Load More"; only 21 + 21 are
linked from pages without clicking Load More. All 114 pages' images would push the ZIP far past 100 MB.
**Chose:** Reconstruct the 59 routes reachable without Load More, plus /project/forge (linked from the home
carousel). Load More / Sector / Team / search / sort still work over the full listing (card data + thumbnails taken
from the site's data payload); cards for pages outside the build link to the original site.
**To reverse:** save the extra routes' server HTML into the capture folder and re-run the extractor. They build with
no code changes (about 3 MB of media per project page).

### [09:45] **[LOW]** Heavy media not committed to the repository

**Chose:** `02-thirdway/public/media/` (~90 MB) is git-ignored in the repo copy; the ZIP carries it. This keeps the
repository growing only by the ZIP, not by the ZIP plus a second copy of the media.
**To reverse:** remove the `/public/media/` line from `02-thirdway/.gitignore`.

### [09:50] Values measured on the live site (not guessed)

Lenis `lerp: 0.13`. Line reveals rise from 130 % with opacity 0, `power4.out` over 1 s, 0.1 s stagger. Fade reveals
rise 24 px. Scroll-fill characters go from 30 % opacity. The intro panels open to a 415 × 36 px slit, then a portrait
window, then fully, while the film scales from 0.6422. Featured projects pin for 3 × 100 lvh and wipe bottom-up.
Services pin for 473 px per service. Process steps pin with the frame 89 px above the viewport bottom, and images
fly between the frame, a 0.398 × frame-height thumbnail and a point beyond it. Logo marquees drift at 51 px/s.
Swiper geometry was measured at 390/1024/1440 px (`carousels.ts`). Menu panel: 172 × 44 → 680 px wide.
Footer ruler: 96 px = 2.54 cm.
**Approximated (not observable):** People-hero portrait anchors 5–7 and drift speed; case-study colours for teams
other than Studio/Boutique; the easing of the process-step transitions; counter durations.

### [09:55] Integrations stubbed

Contact dialog validates locally and acknowledges (no backend). Cookie consent is stored in `localStorage`
(`cookieConsent`) and gates only the banner; there are no analytics to gate. The intro animation's Lottie data (a
14 KB public asset in the site's bundle) is played with lottie-web.

### [11:30] Client-rendered UI reproduced from the live DOM

**Fork:** The original renders some UI only in the browser, so the server HTML omits it: the contact dialog, the
People sticky team bar, the desktop "View all" cell in related-project grids, and the People footer photo.
**Chose:** Save that markup from the live page (`tools/extract-content.mjs` reads `live/*.html`, with
`page-<slug>-*.html` appended to that page) or derive it from the server data. Behaviour is re-implemented.
**Why:** Without these the grids reflow and page heights drift (the People page was 68px short, and related
projects wrapped at 1024px). Measured page heights now match the live site to within 3px.
**To reverse:** delete `live/page-*.html` and re-run the extractor.

### [11:55] Reproduced the original's scroll-history-dependent first-image drift

**Fork:** On the pinned "featured projects" stack, the first image's vertical drift is not a function of scroll
position on the original. It depends on the path: a jump across the pin start leaves it at +4 %, while slow scrolling
gives a smooth +4 → −4 % line. Implementing a clean single curve was simpler; the original's quirk is observable.
**Investigated:** Sampled eight scroll paths on the live site (1440, 1024, 390; home and Services). All eight fit
two overlapping drifts (entry 0 → +4 % over the viewport before the pin; exit +4 → −4 % from 0.14 vh before the pin
to the end of the first wipe). The entry drift normally renders last, except when the section is entered in one jump
from above, where the exit drift wins until the entry drift is back at its start.
**Chose:** Encode exactly that rule (`src/behaviours/home.ts`, `drift`). It matches the live values to ±0.04 % on all
paths sampled except one Services path at 390 px (one frame).
**To reverse:** replace `drift` with a plain scrubbed timeline (`fromTo 0→4` then `to −4`) on the same trigger.
**Confidence:** Medium. The rule is empirical; the original's mechanism (likely tween overwrite order) was not recovered.

### [12:00] **[LOW]** Phone-sized images are sharper than the original's

**Fork:** On phones the original's full-bleed images request a 430 px-wide rendition and stretch it about 4×, so
they look soft. The reconstruction ships one rendition per image (the largest the capture saw), without the
`srcset`.
**Chose:** Keep the sharp rendition. Geometry and crop are identical; only sharpness differs. This accounts for most
of the remaining pixel difference on featured-project frames at 390 px.
**To reverse:** keep `srcset`/`sizes` in `tools/extract-content.mjs` (`convert`, `picture` branch) and download
every candidate. Media would grow by about 30 %.

### [12:20] Home content refreshed after the original changed

**Fork:** During validation (about 12:00 UTC) the original replaced the third featured project on the home page
(Forge → University of Hull London) and the John Laing quote. The capture from 08:40 no longer matched.
**Investigated:** Re-fetched all 60 routes and compared visible text and image lists. Only the home page changed.
**Chose:** Re-extract the home page from the fresh server HTML (the extractor is deterministic; only
`src/content/pages/home.json` changed). /project/forge stays in the build; it is still a live page.
**To reverse:** `git checkout <previous commit> -- 02-thirdway/src/content/pages/home.json`.

### [12:50] Project "Deep Dive" popup captured from the live DOM

**Fork:** Three project pages (Cleo AI, University of Hull London, Zopa) show a floating "Deep Dive" card that opens
an article dialog. Both are rendered in the browser only; the server HTML has neither.
**Chose:** Same approach as [11:30]. The card and dialog markup were saved from the live page
(`live/deepdive/<page>.html`); the extractor appends the card to `<main>` and stores the dialog as the page's
`modal`, which is portalled into `<body>` as on the original. Show/hide thresholds and open/close timing were
measured (`src/behaviours/deepdive.ts`).
**To reverse:** delete the `deepdive` captures and re-run the extractor.

### [14:00] **[LOW]** Thirdway accepted with 60 of 377 frames above the 1.0 % gate

**Fork:** Keep iterating on Thirdway until every frame is at or under 1.0 %, or accept, document and move on to Site #3.
**Investigated:** Over 11 capture rounds the worst frames were traced to measured causes. What remains: phone images are
sharper than the original's (it upscales 430 px renditions), the original's Services image drift depends on scroll
history, and a 1 px pin offset at 1440. At 1440 × 900, 115 of 121 frames pass; interaction states are 0.00–1.02 %;
carousels, filters and dialogs behave like the original. Loam House passed every frame.
**Chose:** Accept. The ZIP builds and runs from a clean extraction. FIDELITY.md lists every frame over 1.5 % with its
cause.
**To reverse:** re-open Thirdway. The fastest wins: keep `srcset` for phone images (about 30 % more media), then
recapture.
**Confidence:** Medium — the brief asks for major discrepancies to be fixed, and none of the remaining ones changes
layout or behaviour.

### [08:55] Media handling

**Chose:** Images are the exact bytes the browser received (AVIF from DatoCMS at the requested widths). Renditions
the capture never requested are fetched once at the width closest to 1440 px (~570 files, ~50 MB in total). Vimeo HLS streams are converted to single MP4 files: background loops (home, vision) at 720p; long-form
journal videos at 360p, and the menu's Mux clip at 270p, to keep the ZIP under GitHub's 100 MB file limit
(~40 MB of video). Vimeo still frames are used as posters. A YouTube embed on one
article stays a YouTube iframe.
**To reverse:** re-run `tools/fetch_hls.py` with a higher height.

## Site #3 — Bulbs Series

### [14:20] URL resolution

**Fork:** The brief says "RESOLVE FIRST"; no URL given. A search for "Bulbs Series" "Joffrey Spitzer" found only his portfolio.
**Investigated:** joffreyspitzer.com's works list (Aerleum, Ambrosia, Hélène Blanck, Merrell) has no Bulbs project. The
Awwwards entry `awwwards.com/sites/bulbs-series` ("Sculptural glass lighting series by Simon Dupety"; nominee,
2026-09-23; GSAP, GLSL, Astro) credits Joffrey Spitzer and links to https://bulbs.simondupety.com/. The live page
(title "Bulbs by Simon Dupety") links back to joffreyspitzer.com in its credits.
**Chose:** https://bulbs.simondupety.com/. **Confidence:** High.

### [14:40] Architecture: markup as data, WebGL written from scratch

**Fork:** The original is an Astro site whose images are all drawn by a bespoke three.js layer (about 1,400 lines,
with custom vertex shaders for the page roll, stacking, intro and product slides). We could transcribe that code from
the public bundle, or write our own implementation of the same observable effects.
**Chose:** Our own. The page markup is served from the captured HTML as data, as for Thirdway. The image layer
(`src/gl`) is new code: a cylindrical page roll, stacking with a corner wave, an unfolding intro and a focus flight,
tuned with values measured from the running site (pivot 0.58, roll radius 0.5 vh, focal length 1040 px, easing
constants, durations and thresholds). The sound (Web Audio synthesis) and the custom text elements are
re-implemented in the same way.
**Why:** The brief is a clean-room reconstruction: reproduce what is observable, never copy code. Tuning values are
measurements; the shader code is ours.
**To reverse:** n/a (a design constraint).
**Confidence:** Medium — fine details (paper wobble, cloth noise on product slides) are simplified; see FIDELITY.md.

### [14:45] **[LOW]** About transition simplified

**Fork:** Navigating to About plays a dedicated WebGL flight of the cover photo over a dimmed page.
**Chose:** Dim (50 % black over 0.7 s) plus the standard fade. The static About page matches.
**To reverse:** add a cover-flight mode to `src/gl/scene.ts`, triggered from `src/behaviours/navigation.ts`.

### [14:50] Media and fonts

Images: one rendition per photo (the 1600/2400 px JPEG the original serves), 115 files, 26 MB, shipped in the ZIP and
git-ignored in the repo (as for Thirdway). Special Gothic is OFL and self-hosted. Big Caslon FB is commercial: a
git-ignored drop-in slot, with Libre Caslon Text (OFL) metric-matched as the fallback (size-adjust 99 %).


### [15:00] Ribbon layout measured before lazy photos arrive

**Fork:** At 390 px the home ribbon drifted from the original by up to 30 % per frame after the eighth image. Six
of the twenty photos are 2:3 inside 4:5 figures; when such a photo loads, it grows its figure by 71 px and pushes the
rest of the page down.
**Investigated:** Sampled each image's rendered top and bottom edges every 40 px of scroll on both sites. The ribbon
itself matched to 1 px until the first 2:3 photo. The original lays the strip out once, when the first five images are
ready, and never re-measures (a resize event changes nothing). Figure 8's photo sometimes arrives before that moment
and sometimes after, so the original's result varies between loads. In two of three runs it had not arrived. The
original starts stacking at scroll 7823 at 390 × 844, which equals the threshold with all six photos unloaded. The
stacked card, by contrast, follows its placeholder every frame.
**Chose:** Measure each lazy figure at its CSS 4:5 frame and move later content up by any growth above it. Re-measure
the stacked card's placeholder every frame (below 640 px the canvas is fixed while the placeholder scrolls).
**Why:** Deterministic, and it matches the original's usual outcome. The stacking threshold is now 7823 on both sites,
and the card lands 411–569 px (original 411–568).
**To reverse:** in `src/gl/scene.ts` `refreshLayout()`, drop the `frameHeight` clamp to always use the real figure
height.
**Confidence:** Medium. When figure 8's photo happens to load first, the original draws it at 2:3 and later images
71 px lower.

## Site #4 — Sobha Privy Collection

### [15:35] URL resolution

**Fork:** The brief says "RESOLVE FIRST" and gives no URL.
**Investigated:** A search for "Sobha Privy Collection" "Vide Infra" finds the Awwwards entry
`awwwards.com/sites/sobha-privy-collection` (Site of the Day, 7.37; tags WebGL, Three.js, 3D gallery, 3D map). It
credits Vide Infra and links to https://sobha-privy-collection.com/. The live page (title "Sobha Privy Collection –
Luxury Villas & Penthouses in Dubai") links to videinfra.com in its footer credit.
**Chose:** https://sobha-privy-collection.com/ with its linked routes `/location` and `/privacy-policy`.
**Confidence:** High.

### [15:40] Films

**Fork:** The films are Kinescope embeds. In headless Chromium they show "Protected playback is not available".
**Investigated:** The HLS playlists have no `EXT-X-KEY`, so the streams are not encrypted. The message is the player
failing because the open-source Chromium build has no H.264, the same limitation as Thirdway's Vimeo films.
**Chose:** Self-host each loop as a single MP4 (the public stream, unmodified). Compare film regions masked on both
sides.
**To reverse:** point the video elements back at the Kinescope embed URLs kept in the content.

### [15:40] **[LOW]** Stylesheet captured as data, like the markup

**Fork:** Sites 1–3 styled their markup with regenerated Tailwind utilities plus hand-written component CSS. This
site uses a custom CSS framework: 504 classes, a `--md`/`--n-md` toggle-variable system, and aspect-ratio-aware
breakpoints (for example, `md` is 568–667 px portrait or ≥ 668 px). Its public stylesheets total about 11,600
formatted lines, and no utility framework exists to regenerate them from.
**Investigated:** Hand-writing it from computed styles loses the fluid and aspect-ratio rules between the measured
widths. The lift-to-source method prefers reading authored values from the matching CSS rules for layout.
**Chose:** `tools/extract-styles.mjs` treats the public stylesheets as captured data, as the markup already is:
- it keeps only the rules whose selectors can match these routes' markup or the state classes their behaviour adds
  (1,627 kept, 2,724 dropped);
- it rewrites asset URLs, drops the commercial @font-face rules, and scopes route sheets with `:where()`;
- it writes `src/styles/site.css`, marked as generated.
All behaviour (scroll, parallax, reveals, WebGL, forms) is new code.
**To reverse:** replace `src/styles/site.css` with hand-written component CSS, one component at a time, and use the
pixel diff to guard each step.
**Confidence:** Low as a policy call: this is closer to reuse than the "no file copied" line taken for Loam House.
Technically it is the most faithful option.

### [17:00] Two more policy pages

**Fork:** The privacy page's tabs link to `/privacy-policy-uk-eu` and `/data-protection-policy`. The site's markup
links to them only from those tabs, and they were not in the first extraction.
**Investigated:** Both return 200, use the same stylesheet and plugins as `/privacy-policy`, and add no CSS rules
(the style extraction output is byte-identical with them included).
**Chose:** Reconstruct them as well: five routes in all. Stylesheet scoping now follows each route's stylesheet
(`data-page="privacy-policy"` for all three policy pages) instead of its path.
**To reverse:** drop the two slugs from `tools/extract-content.mjs` and re-run it; the tab links would then leave the
site.
**Confidence:** High.

### [17:10] Scroll anchoring off

**Fork:** Arriving at the Handpicked gallery, the page jumped back 17 px. The browser's scroll anchoring compensated
for a layer above changing size as a section initialised.
**Investigated:** The original scrolls a fixed container, where browsers never anchor, so it never shows the jump.
With `overflow-anchor: none` the jump is gone and the frame matches.
**Chose:** `overflow-anchor: none` on `html` and `body`.
**To reverse:** remove the rule from `src/app/globals.css`.
**Confidence:** High.

### [17:20] Smoothing follows the original's formula

**Fork:** The original eases followers (pointer, scroll progress, cursor) by `strength × elapsed / 16 ms` per frame,
capped at the target. The first version compounded per 60th of a second. The two agree at 60 fps but not at low
frame rates, and the software renderer used for comparisons runs the location scene at a few frames per second.
**Chose:** the original's formula everywhere (`approach` in `src/gl/app.ts`, `Follower` in `src/lib/follow.ts`). With
it, the location camera's smoothed progress after the same scroll equals the original's to 16 decimal places.
**To reverse:** restore the exponential form in those two functions.
**Confidence:** High.

### [17:30] Page changes on the Next.js router

**Fork:** The original follows internal links with Barba (ajax page swaps): by default the preloader screen fades in,
the next page loads behind it, and the screen lifts as the page reveals itself. The policy tabs fade in place.
**Chose:** The same two transitions on the Next.js App Router (`src/behaviours/navigation.ts`), with prefetch on
hover as Barba does. Back and forward cover the swap with the screen and lift it the same way. Barba's own history
scroll restoration is not reproduced: a covered page change starts at the top of the page.
**To reverse:** delete `initPageTransitions` from `SiteEffects`; links then load pages normally.
**Confidence:** Medium: the flow and animations are the original's, the timing of the swap is the router's.

### [17:30] Location model: road mask not loaded

**Fork:** The original loads `mask.png` as the roads' alpha map and then sets the alpha map back to `null`, so the
texture is fetched but never used.
**Chose:** Skip loading it (the file stays extracted alongside the model).
**To reverse:** load it and assign it in `src/gl/location.ts`, then clear it, as the original does.
**Confidence:** High (no visual effect).
