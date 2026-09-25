# Visual verification harness

Scripts used to measure this reconstruction against the live reference. They are not part of the app build.

```bash
npm i --no-save playwright pixelmatch@5 pngjs && npx playwright install chromium
npm run build && npm start &            # target on :3000

R=/,/about,/products/influorescence-c7.1,/products/cirva-1.x
node tools/visual-diff/capture.mjs https://bulbs.simondupety.com work/ref/1440 1440 900 --routes $R
node tools/visual-diff/capture.mjs http://localhost:3000          work/tgt/1440 1440 900 --routes $R
#    (repeat with 1024 768, and 390 844 --mobile)
node tools/visual-diff/compare.mjs work/ref/1440 work/tgt/1440 work/diff/1440
node tools/visual-diff/summary.mjs work/diff/1440

# interaction states: intro, stack, title hover, flight to a product, product enlarge / next, sound on
node tools/visual-diff/interactions.mjs https://bulbs.simondupety.com work/ix/ref
node tools/visual-diff/interactions.mjs http://localhost:3000          work/ix/tgt
node tools/visual-diff/quickdiff.mjs work/ix/ref/stack.png work/ix/tgt/stack.png
```

Determinism: both sides render WebGL with the same software rasteriser (`--use-gl=swiftshader`) and are
scrolled through Lenis with `immediate: true`, then left to settle for 2.5 s so the eased stack and ribbon
come to rest. The home page is captured 9 s after load so the intro has finished. Both sides must use the
same typefaces: put the licensed Big Caslon file in `public/fonts/licensed/` before comparing (see the
README at the project root). Intro frames are timed from the load event and vary by a few frames between runs;
compare them by eye rather than by the gate.
