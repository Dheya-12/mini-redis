// Scroll-step captures of several routes, for pixel comparison against the live site.
// usage: node capture.mjs <origin> <outDir> <w> <h> [--mobile] [--routes /,/about] [--settle 2500]
// Both sides render WebGL with the same software rasteriser (SwiftShader) and scroll through Lenis.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [origin, out, W, H] = process.argv.slice(2);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const mobile = process.argv.includes('--mobile');
const routes = arg('--routes', '/').split(',');
const SETTLE = +arg('--settle', '2500');
fs.mkdirSync(out, { recursive: true });

const local = /localhost|127\.0\.0\.1/.test(origin);
const browser = await chromium.launch({
  ...(!local && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}),
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
await ctx.route(/umami|googletagmanager|google-analytics/, (r) => r.abort());
const frames = [];
const scrollTo = (page, y) => page.evaluate((y) => (window.lenis ? window.lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)), y);
for (const route of routes) {
  const page = await ctx.newPage();
  await page.goto(origin + route, { waitUntil: 'load', timeout: 120000 });
  // the home intro (preloader, unfolding strips, zoom) takes about 6 s
  await page.waitForTimeout(route === '/' ? 9000 : 5000);
  await page.addStyleTag({ content: '*{caret-color:transparent!important}' });
  const slug = route === '/' ? 'home' : route.slice(1).replace(/\//g, '_');
  let y = 0, i = 0;
  for (;;) {
    await scrollTo(page, y);
    await page.waitForTimeout(SETTLE);
    const name = `${slug}-${String(i).padStart(2, '0')}`;
    await page.screenshot({ path: path.join(out, name + '.png') });
    const actual = await page.evaluate(() => Math.round(window.lenis?.scroll ?? scrollY));
    const texts = await page.evaluate(() => {
      const r = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const t = walker.currentNode.nodeValue.trim();
        const el = walker.currentNode.parentElement;
        if (!t || t.length < 3 || !el || el.closest('script,style')) continue;
        const b = el.getBoundingClientRect();
        if (b.bottom < 0 || b.top > innerHeight || b.width === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
        r.push({ t: t.slice(0, 60), tag: el.tagName, x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), fs: cs.fontSize, ff: cs.fontFamily.split(',')[0].replace(/"/g, ''), fw: cs.fontWeight, fst: cs.fontStyle, ls: cs.letterSpacing, lh: cs.lineHeight, c: cs.color, op: +cs.opacity });
      }
      return r.slice(0, 120);
    });
    frames.push({ name, route, y, actual, texts });
    // lazy images grow the page as it is scrolled: re-read the height every step
    const max = await page.evaluate(() => (window.lenis?.limit ?? document.documentElement.scrollHeight - innerHeight));
    if (y >= max) break;
    y = Math.min(max, y + +H);
    i++;
  }
  await page.close();
}
fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify({ origin, W, H, frames }, null, 0));
await browser.close();
console.log(`captured ${frames.length} frames`);
