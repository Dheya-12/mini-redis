// Phone interactions (390 × 844, touch), captured the same way on the original and on the reconstruction.
// usage: node phone.mjs <origin> <outDir>
// States: the menu; the locations map after tapping a pin (its card scrolls to the middle, the pin lights, the map
// shifts) and after swiping the cards; a card's description expanded. Also prints the measured state as JSON.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [origin, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const local = /localhost|127\.0\.0\.1/.test(origin);
const b = await chromium.launch({
  ...(!local && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}),
  args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const MASK = 'iframe[src*="kinescope"], video.film { visibility: hidden !important; } * { caret-color: transparent !important; }';
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await ctx.route(/googletagmanager|google-analytics|player-metrics|recaptcha/, (r) => r.abort());
const p = await ctx.newPage();
await p.goto(origin + '/', { waitUntil: 'load', timeout: 120000 });
await p.waitForTimeout(8000);
await p.addStyleTag({ content: MASK });
const shot = (name) => p.screenshot({ path: path.join(out, name + '.png'), timeout: 180000 });
const state = {};

await p.locator('header a[href="#menu"]').first().tap();
await p.waitForTimeout(2500);
await shot('phone-menu-open');
await p.locator('header a[href="#menu"]').first().tap();
await p.waitForTimeout(2500);

// the locations map, with its card row in view
// the original scrolls its fixed page wrapper on phones; the reconstruction scrolls the window
const scroller = () => p.evaluate(() => { const w = document.querySelector('.js-page-content-wrapper'); return !!(w && w.scrollHeight > w.clientHeight + 1 && getComputedStyle(w).overflowY !== 'visible'); });
const inWrapper = await scroller();
const scrollTo = (y) => p.evaluate(([y, inWrapper]) => { if (inWrapper) { const w = document.querySelector('.js-page-content-wrapper'); w.style.scrollBehavior = 'auto'; w.scrollTop = y; } else window.scrollTo({ top: y, behavior: 'instant' }); }, [y, inWrapper]);
const y = await p.evaluate((inWrapper) => {
  const list = document.querySelector('#locations ul.mobile-scrollable');
  const top = inWrapper ? document.querySelector('.js-page-content-wrapper').scrollTop : scrollY;
  return Math.round(list.getBoundingClientRect().bottom + top - innerHeight + 20);
}, inWrapper);
for (let s = 0; s < y; s += 844) { await scrollTo(s); await p.waitForTimeout(200); }
await scrollTo(y);
await p.waitForTimeout(2500);
const read = () => p.evaluate(() => {
  const list = document.querySelector('#locations ul.mobile-scrollable');
  return {
    scrollLeft: Math.round(list.scrollLeft),
    activeCard: [...list.querySelectorAll('.mobile-scrollable__item')].findIndex((c) => c.classList.contains('is-active')),
    activePin: [...document.querySelectorAll('.js-map-active-pin')].findIndex((c) => c.classList.contains('is-active')),
    slide: [...document.querySelector('.js-location-map-inner').classList].find((c) => /^is-slide-/.test(c)) || null,
    expanded: [...list.querySelectorAll('.l-location-mobile-card--expanded')].length,
  };
});
state.before = await read();
await shot('phone-map');
await p.locator('.js-map-active-pin').nth(2).tap();
await p.waitForTimeout(2500);
state.pinTapped = await read();
await shot('phone-map-pin-3');
await p.locator('#locations ul.mobile-scrollable .mobile-scrollable__item').nth(2).locator('.btn--square').first().tap();
await p.waitForTimeout(2000);
state.expanded = await read();
await shot('phone-card-expanded');
console.log(JSON.stringify(state));
await b.close();
