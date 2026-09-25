# Visual verification harness

Scripts used to measure this reconstruction against the live reference. They are not part of the app build.

```bash
npm i --no-save playwright pixelmatch@5 pngjs && npx playwright install chromium
npm run build && npm start &            # target on :3000

# 1. Chapter-stop captures (rest state of every chapter + the midpoint between chapters)
node tools/visual-diff/capture.mjs https://residences.loamhouse.com.au/ work/ref/1440 1440 900 --mids
node tools/visual-diff/capture.mjs http://localhost:3000/              work/tgt/1440 1440 900 --mids
#    (repeat with 1024 768, and 390 844 --mobile)

# 2. Pixel diff + text-geometry diff (elements matched by their text)
node tools/visual-diff/compare.mjs work/ref/1440 work/tgt/1440 work/diff/1440 --text

# 3. Interaction states (header hover, form morph, finishes swap, map dive / zoom-out, contact steps)
node tools/visual-diff/interactions.mjs https://residences.loamhouse.com.au/ work/ref-int/1440 1440 900
node tools/visual-diff/interactions.mjs http://localhost:3000/ work/tgt-int/1440 1440 900 --target

# 4. End-to-end form flows against the local build
node tools/visual-diff/e2e.mjs http://localhost:3000
```

Determinism: the capture waits for the curtain and for the hero's intro→ambient video cut, freezes every
video at t=0.5s, and pins CSS animations (dot pulses, caret) to t=0 before each shot. Scroll is driven with
`window.scrollTo` and allowed to settle (8.5s for the map chapter, whose scrub is 6s).
