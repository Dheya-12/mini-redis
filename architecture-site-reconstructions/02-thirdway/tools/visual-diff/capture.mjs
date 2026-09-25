// Scroll-step captures of several routes, for pixel comparison against the live site.
// usage: node capture.mjs <origin> <outDir> <w> <h> [--mobile] [--routes /,/approach] [--step 1] [--settle 1600]
//   --mask  extra CSS selectors hidden in both captures (time-driven regions)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [origin, out, W, H] = process.argv.slice(2);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const mobile = process.argv.includes('--mobile');
const routes = arg('--routes', '/').split(',');
const STEP = +arg('--step', '1');
const SETTLE = +arg('--settle', '1600');
// regions driven by wall-clock time (clock, marquees, drifting portraits, scroll-distance counter)
const MASK = ['header .number-pill', "[data-cookie-banner] .overflow-hidden", "[class*='mask-image']", '.people-hero-block .slot', 'footer .w-\\[9\\.32px\\]', ...arg('--mask', '').split(',').filter(Boolean)];
fs.mkdirSync(out, { recursive: true });

const local = /localhost|127\.0\.0\.1/.test(origin);
const browser = await chromium.launch(!local && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
await ctx.route(/googletagmanager|google-analytics|doubleclick|clarity|hotjar|linkedin|facebook/, (r) => r.abort());
const frames = [];
for (const route of routes) {
  const page = await ctx.newPage();
  await page.goto(origin + route, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(route === '/' ? 10500 : 3500);
  await page.addStyleTag({ content: `${MASK.join(',')}{visibility:hidden!important} *{caret-color:transparent!important}` });
  const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const slug = route === '/' ? 'home' : route.slice(1).replace(/\//g, '_');
  const ys = [];
  for (let y = 0; y < total; y += Math.round(+H * STEP)) ys.push(y);
  ys.push(total);
  for (const [i, y] of ys.entries()) {
    await page.evaluate((y) => window.scrollTo(0, y), y);
    await page.waitForTimeout(SETTLE);
    // films: same still on both sides
    await page.evaluate(async () => {
      await Promise.all([...document.querySelectorAll('video')].map((v) => new Promise((res) => {
        v.pause();
        if (v.readyState < 1) return res();
        v.addEventListener('seeked', res, { once: true });
        v.currentTime = 0.5;
        setTimeout(res, 1500);
      })));
    });
    const name = `${slug}-${String(i).padStart(2, '0')}`;
    await page.screenshot({ path: path.join(out, name + '.png') });
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
    frames.push({ name, route, y, actual: await page.evaluate(() => Math.round(scrollY)), texts });
  }
  await page.close();
}
fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify({ origin, W, H, frames }, null, 0));
await browser.close();
console.log(`captured ${frames.length} frames`);
