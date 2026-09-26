# Pro Airbags — website

Marketing site for Pro Airbags (airbag repair, SRS module reset, seatbelt repair, programming).
Next.js 15 App Router, React 19, three.js + GSAP hero.

## Run locally

    npm install
    npm run dev        # http://localhost:3000
    npm run build && npm start

## Deploy to Vercel

The app lives in the `pro-airbags/` folder of the repository, so set **Root Directory** to `pro-airbags` when importing.

- Dashboard: New Project → import the repo → Root Directory `pro-airbags` → Deploy (framework is auto-detected as Next.js).
- CLI:

      cd pro-airbags
      npx vercel --prod

## Structure

- `components/pro-airbags-hero/` — the hero as delivered (gl.js, styles.css, generated/* untouched). `App.jsx` gained a mobile branch and `responsive.css` was added. At 1000px and wider the original 1536 x 1024 stage is scaled to the width exactly as designed. Below that, the dashboard band stays live, fixed and framed on the logo; the four nav items are re-laid as two rows of 46px pills over the dash (the same components, with their dropdown menus, at 11.5px type) plus a full-width neon Start a repair pill; the car region of the same live WebGL canvas is copied each frame into a cover-cropped scene; and the headline, buttons, SRS panel, cards and trust items are re-flowed for touch. A hamburger drawer duplicates the nav as an equivalent path.
- `components/site/` — everything below the hero, built with the huly.io design system: the three compiled Tailwind stylesheets from huly.io are served verbatim from `public/assets/css` (with their fonts and SVG art in `public/assets/media`) and each section reuses the exact class strings from the huly.io pages, so it renders identically. Sections: SiteHeader (huly header with CSS dropdowns and burger drawer, fixed and shown once the hero scrolls away), Productivity ("Unmatched productivity" ring cards + "Work together" video stage and icon columns), Insurance ("Sync with GitHub" dark stage with the readiness report as a shiki code block, six blue-glow features), Bento ("MetaBrain" outlined tiles + "Knowledge at your fingertips" editor demo with pins, toolbar, highlight and cursor, sticky side card), Pricing (snapping plan cards with hover glow), Reviews (huly blog article layout), Faq (huly dropdown panels), Cta ("Join the Movement" with the light and dark buttons, the sign-in form styling for the repair request, and the footer).
- `public/assets/css/site.css` — linked last: the button/plan/doc-demo behaviours huly.io drove from its client bundle, the header slide-in, and the handful of Tailwind utilities this site uses that huly.io's build never emitted.
- `public/assets/img/pa-*.jpg` — section images cropped from the hero plate.

Anchors used by the hero's own nav and cards resolve to the sections below it: `#airbags`, `#module`, `#seatbelt`, `#programming` (Productivity cards), each dropdown item (Bento tiles and Insurance features, e.g. `#crash-data-clearing`), and `#start` for the request form.
