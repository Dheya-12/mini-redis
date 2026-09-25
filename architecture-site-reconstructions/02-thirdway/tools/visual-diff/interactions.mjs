// Interaction states: menu open, contact dialog, cookie preferences, mobile menu (/approach); Deep Dive dialog (/project/zopa).
// usage: node interactions.mjs <origin> <outDir>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const [origin, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const local = /localhost/.test(origin);
const b = await chromium.launch(!local && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
const MASK = `header .number-pill, header .cursor-grab, [data-cookie-banner] .min-w-0{visibility:hidden!important}`;
async function page(w, h, mobile, route = '/approach') {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await ctx.route(/googletagmanager|google-analytics|clarity|hotjar/, (r) => r.abort());
  const p = await ctx.newPage();
  // the original sometimes never hydrates its header in headless Chromium: reload (up to twice) until it does
  for (let attempt = 0; attempt < 3; attempt++) {
    await (attempt ? p.reload({ waitUntil: 'load', timeout: 120000 }) : p.goto(origin + route, { waitUntil: 'load', timeout: 120000 }));
    const ok = await p.waitForSelector('[data-cookie-banner] button, header [data-menu-panel] button', { state: 'visible', timeout: 20000 }).then(() => true, () => false);
    if (ok) break;
  }
  await p.waitForTimeout(4000);
  await p.addStyleTag({ content: MASK });
  return p;
}
const shots = [
  ['menu-open', 1440, 900, false, async (p) => { await p.click('header .lg\\:block [data-menu-panel] button'); await p.waitForTimeout(1500); }],
  ['contact', 1440, 900, false, async (p) => { await p.click('header .lg\\:block [data-menu-keep-open] button'); await p.waitForTimeout(1500); }],
  ['cookie-prefs', 1440, 900, false, async (p) => { await p.click('[data-cookie-banner] button:has-text("Preferences")'); await p.waitForTimeout(1500); }],
  ['menu-open-mobile', 390, 844, true, async (p) => { await p.click('header .lg\\:hidden [data-menu-panel] button[aria-label$="menu"]'); await p.waitForTimeout(1500); }],
  ['deep-dive', 1440, 900, false, async (p) => {
    await p.evaluate(() => scrollTo(0, 2000)); await p.waitForTimeout(1500);
    await p.click('aside.project-behind-the-build-popup button'); await p.waitForTimeout(1500);
  }, '/project/zopa'],
];
for (const [name, w, h, m, act, route] of shots) {
  const p = await page(w, h, m, route);
  try { await act(p); } catch (e) { console.log(name, 'action failed', e.message.split('\n')[0]); }
  await p.screenshot({ path: path.join(out, name + '.png') });
  await p.context().close();
}
await b.close();
console.log('done');
