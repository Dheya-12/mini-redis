// Scroll-step captures of several routes, for pixel comparison against the live site.
// usage: node capture.mjs <origin> <outDir> <w> <h> [--mobile] [--routes /,/location] [--settle 2000] [--step 900]
// The original scrolls through its own smooth scroller; the reconstruction through Lenis. Both are set instantly.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [origin, out, W, H] = process.argv.slice(2);
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const mobile = process.argv.includes('--mobile');
const routes = arg('--routes', '/').split(',');
const SETTLE = +arg('--settle', '2000');
const STEP = +arg('--step', H);
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
const scrollTo = (page, y) => page.evaluate((y) => {
  if (window.lenis) window.lenis.scrollTo(y, { immediate: true, force: true });
  else if (window.$ && window.$.fn.scroller && window.$('body').scroller('instance')) window.$('body').scroller('instance').scrollTop(y);
  else window.scrollTo(0, y);
}, y);
const limit = (page) => page.evaluate(() => {
  if (window.lenis) return window.lenis.limit;
  const s = window.$ && window.$.fn.scroller && window.$('body').scroller('instance');
  if (s && s.scroller) return s.scroller.scroll.instance.limit.y;
  return document.documentElement.scrollHeight - innerHeight;
});
const current = (page) => page.evaluate(() => {
  if (window.lenis) return window.lenis.scroll;
  const s = window.$ && window.$.fn.scroller && window.$('body').scroller('instance');
  if (s && s.scroller) return s.scroller.scroll.instance.scroll.y;
  return scrollY;
});
const frames = [];
for (const route of routes) {
  const page = await ctx.newPage();
  await page.goto(origin + route, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(route === '/' || route === '/location' ? 9000 : 5000);
  await page.addStyleTag({ content: MASK });
  const slug = route === '/' ? 'home' : route.slice(1).replace(/\//g, '_');
  let y = 0, i = 0;
  for (;;) {
    await scrollTo(page, y);
    await page.waitForTimeout(SETTLE);
    const name = `${slug}-${String(i).padStart(2, '0')}`;
    await page.screenshot({ path: path.join(out, name + '.png') });
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
