# Visual verification harness

Scripts used to measure this reconstruction against the live reference. They are not part of the app build.

```bash
npm i --no-save playwright pixelmatch@5 pngjs && npx playwright install chromium
npm run build && npm start &            # target on :3000

R=/,/approach,/services,/people,/projects,/journal,/vision-and-values,/our-home,/esg,/careers,/project/zopa,/journal/behind-the-build-the-campus-in-the-sky,/privacy-policy
node tools/visual-diff/capture.mjs https://www.thirdway.com work/ref/1440 1440 900 --routes $R
node tools/visual-diff/capture.mjs http://localhost:3000    work/tgt/1440 1440 900 --routes $R
#    (repeat with 1024 768, and 390 844 --mobile)
node tools/visual-diff/compare.mjs work/ref/1440 work/tgt/1440 work/diff/1440 --text
```

Determinism: every route is captured at whole-viewport scroll steps after the reveals settle. Regions
driven by wall-clock time are hidden in both captures: the London clock, the client-logo marquees, the
drifting portraits on /people and the "you've scrolled" ruler in the footer. Films are compared on their
poster frames (headless Chromium has no H.264). Both sides must use the same typefaces: put the licensed
font files in `public/fonts/licensed/` before comparing (see the README at the project root).
