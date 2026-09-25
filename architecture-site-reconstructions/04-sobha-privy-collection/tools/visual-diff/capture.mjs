// Scroll-step captures of several routes, for pixel comparison against the live site.
// usage: node capture.mjs <origin> <outDir> <w> <h> [--mobile] [--routes /,/location] [--settle 2000] [--step 900] [--follow <refDir>]
// The original scrolls through its own smooth scroller; the reconstruction through Lenis. Both are set instantly.
// --follow: after stepping to each position, settle on the scroll position the reference capture actually reached
// (the original occasionally clamps a jump while a section is still initialising), so both frames show the same state.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [origin, out, W, H] = process.argv.slice(2);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const mobile = process.argv.includes('--mobile');
const routes = arg('--routes', '/').split(',');
const SETTLE = +arg('--settle', '2000');
const STEP = +arg('--step', H);
const follow = arg('--follow', null);
const reached = new Map(follow ? JSON.parse(fs.readFileSync(path.join(follow, 'meta.json'), 'utf8')).frames.map((f) => [f.name, f.actual]) : []);
fs.mkdirSync(out, { recursive: true });

const local = /localhost|127\.0\.0\.1/.test(origin);
const browser = await chromium.launch({
  ...(!local && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}),
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
await ctx.route(/googletagmanager|google-analytics|player-metrics|recaptcha/, (r) => r.abort());
// films are compared on their placeholder images (headless Chromium cannot play the H.264 streams)
const MASK = 'iframe[src*="kinescope"], video.film { visibility: hidden !important; } * { caret-color: transparent !important; }';
// the scrolling element: Lenis (reconstruction), the original's smooth scroller (desktop), or on phones the original's
// fixed page wrapper, which scrolls instead of the window
const SCROLLER = `(() => {
  if (window.lenis) return { get: () => window.lenis.scroll, set: (y) => window.lenis.scrollTo(y, { immediate: true, force: true }), max: () => window.lenis.limit };
  const s = window.$ && window.$.fn.scroller && window.$('body').scroller('instance');
  if (s && s.scroller) return { get: () => s.scroller.scroll.instance.scroll.y, set: (y) => s.scrollTop(y), max: () => s.scroller.scroll.instance.limit.y };
  const w = document.querySelector('.js-page-content-wrapper');
  if (w && w.scrollHeight > w.clientHeight + 1 && getComputedStyle(w).overflowY !== 'visible') return { get: () => w.scrollTop, set: (y) => { w.style.scrollBehavior = 'auto'; w.scrollTop = y; }, max: () => w.scrollHeight - w.clientHeight };
  return { get: () => scrollY, set: (y) => window.scrollTo({ top: y, behavior: 'instant' }), max: () => document.documentElement.scrollHeight - innerHeight };
})()`;
const scrollTo = (page, y) => page.evaluate(([y, S]) => new Function('return ' + S)().set(y), [y, SCROLLER]);
const limit = (page) => page.evaluate((S) => new Function('return ' + S)().max(), SCROLLER);
const current = (page) => page.evaluate((S) => new Function('return ' + S)().get(), SCROLLER);
const frames = [];
for (const route of routes) {
  const page = await ctx.newPage();
  await page.goto(origin + route, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(route === '/' || route === '/location' ? 9000 : 5000);
  await page.addStyleTag({ content: MASK });
  const slug = route === '/' ? 'home' : route.slice(1).replace(/\//g, '_');
  let y = 0, i = 0;
  for (;;) {
    const name = `${slug}-${String(i).padStart(2, '0')}`;
    await scrollTo(page, y);
    if (reached.has(name) && reached.get(name) !== y) { await page.waitForTimeout(300); await scrollTo(page, reached.get(name)); }
    // both sides run a layout pass whenever an image arrives (desktop); on the live site that depends on network
    // timing, so after each jump one pass is triggered on both, the same way (a load event from an image)
    await page.evaluate(() => document.querySelector('main img, img')?.dispatchEvent(new Event('load')));
    await page.waitForTimeout(SETTLE);
    await page.screenshot({ path: path.join(out, name + '.png'), timeout: 180000 });
    const actual = Math.round(await current(page));
    frames.push({ name, route, y, actual });
    const max = await limit(page);
    if (y >= max) break;
    y = Math.min(max, y + STEP);
    i++;
  }
  await page.close();
}
fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify({ origin, W, H, frames }, null, 0));
await browser.close();
console.log(`captured ${frames.length} frames`);
