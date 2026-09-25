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
