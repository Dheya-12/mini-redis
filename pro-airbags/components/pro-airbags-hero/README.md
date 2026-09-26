# Pro Airbags hero (React + three.js + GSAP)

## Install
    npm i three gsap

GSAP 3.13 or newer (SplitText, CustomEase and ScrambleText ship in the main package).

## Use (Next.js App Router)
1. Copy this folder to `components/pro-airbags-hero/`.
2. Import the styles once, in `app/layout.jsx`:
       import '@/components/pro-airbags-hero/styles.css';
3. Load the fonts in `app/layout.jsx`, either with `<link>`:
       <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400..800&family=Saira:wdth,wght@125,900&display=block" />
   or with next/font (Montserrat 400-800, Saira width 125 weight 900), keeping the family names "Montserrat" and "Saira".
4. Render it (the component is a client component):
       import Hero from '@/components/pro-airbags-hero/App';
       export default function Page() { return <Hero />; }

## Files
- App.jsx: the hero UI and every GSAP interaction.
- gl.js: the three.js layer (relit background, neon power-up, airbag inflation, scans, pulses, embers, sparks). Exposes an effects API the UI calls.
- generated/layout.js: text sizes and positions fitted to the design (1536 x 1024 design space, scaled to the section width).
- generated/assets.js: the cleaned background plate, effect masks and cut-out sprites as data URIs.
