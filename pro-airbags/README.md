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

- `components/pro-airbags-hero/` — the hero exactly as delivered (App.jsx, gl.js, styles.css, generated/*). Do not edit; the rest of the site is styled to match it.
- `components/sections/` — Header, Ticker, About, Services, Process, Testimonials, Faq, Contact, Footer, Reveals.
- `app/globals.css` — site styles (design tokens copied from the hero: #070709 background, #ff3a2c neon red, silver/red gradient headlines in Saira 900 / Montserrat).

Anchors used by the hero's own nav and cards resolve to the sections below it: `#airbags`, `#module`, `#seatbelt`, `#programming`, each dropdown item (e.g. `#crash-data-clearing`), and `#start` for the contact form.
