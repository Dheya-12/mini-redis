// Interaction states on /approach: menu open, contact dialog, cookie preferences, mobile menu.
// usage: node interactions.mjs <origin> <outDir>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const [origin, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const local = /localhost/.test(origin);
const b = await chromium.launch(!local && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
const MASK = `header .number-pill, header .cursor-grab, [data-cookie-banner] .min-w-0{visibility:hidden!important}`;
async function page(w, h, mobile) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await ctx.route(/googletagmanager|google-analytics|clarity|hotjar/, (r) => r.abort());
  const p = await ctx.newPage();
  await p.goto(origin + '/approach', { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(4000);
  await p.addStyleTag({ content: MASK });
  return p;
}
const shots = [
  ['menu-open', 1440, 900, false, async (p) => { await p.click('header .lg\\:block [data-menu-panel] button'); await p.waitForTimeout(1500); }],
  ['contact', 1440, 900, false, async (p) => { await p.click('header .lg\\:block [data-menu-keep-open] button'); await p.waitForTimeout(1500); }],
  ['cookie-prefs', 1440, 900, false, async (p) => { await p.click('[data-cookie-banner] button:has-text("Preferences")'); await p.waitForTimeout(1500); }],
  ['menu-open-mobile', 390, 844, true, async (p) => { await p.click('header .lg\\:hidden [data-menu-panel] button[aria-label$="menu"]'); await p.waitForTimeout(1500); }],
];
for (const [name, w, h, m, act] of shots) {
  const p = await page(w, h, m);
  try { await act(p); } catch (e) { console.log(name, 'action failed', e.message.split('\n')[0]); }
  await p.screenshot({ path: path.join(out, name + '.png') });
  await p.context().close();
}
await b.close();
console.log('done');
