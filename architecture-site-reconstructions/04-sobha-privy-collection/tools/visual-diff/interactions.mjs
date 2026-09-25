// Interaction states, captured the same way on the original and on the reconstruction.
// usage: node interactions.mjs <origin> <outDir>
// States: the menu (open, and its list following the pointer), the quotes cursor, the footer's masked line, the cookie
// choice, a location modal opened from the address, and a page change (the preloader screen, then the next page).
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
const shot = (p, name) => p.screenshot({ path: path.join(out, name + '.png'), timeout: 180000 });

async function page(route = '/', w = 1440, h = 900) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.route(/googletagmanager|google-analytics|player-metrics|recaptcha/, (r) => r.abort());
  const p = await ctx.newPage();
  await p.goto(origin + route, { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(9000);
  await p.addStyleTag({ content: MASK });
  return p;
}
const scrollTo = (p, y) => p.evaluate((y) => {
  if (window.lenis) window.lenis.scrollTo(y, { immediate: true, force: true });
  else if (window.$('body').scroller('instance')?.scroller) window.$('body').scroller('instance').scrollTop(y);
  else window.scrollTo(0, y);
}, y);
const current = (p) => p.evaluate(() => (window.lenis ? window.lenis.scroll : window.$('body').scroller('instance')?.scroller?.scroll.instance.scroll.y ?? scrollY));
const limit = (p) => p.evaluate(() => (window.lenis ? window.lenis.limit : window.$('body').scroller('instance')?.scroller?.scroll.instance.limit.y ?? document.documentElement.scrollHeight - innerHeight));
/** scrolls in screen-sized steps (as a visitor would, so every section initialises) to a position */
async function travel(p, y) {
  for (let s = await current(p); Math.abs(y - s) > 900; s += Math.sign(y - s) * 900) { await scrollTo(p, s); await p.waitForTimeout(250); }
  await scrollTo(p, y);
  await p.waitForTimeout(2000);
}
/** the scroll position at which an element's top reaches the top of the screen */
const topOf = async (p, sel) => Math.round(await p.evaluate((sel) => document.querySelector(sel).getBoundingClientRect().top, sel) + (await current(p)));

// home: menu, quotes cursor, footer mask, cookie choice
{
  const p = await page('/');
  await p.mouse.move(720, 450);
  await p.locator('header a[href="#menu"]').first().click();
  await p.waitForTimeout(2500);
  await shot(p, 'menu-open');
  await p.mouse.move(720, 880, { steps: 10 });
  await p.waitForTimeout(3000);
  await shot(p, 'menu-pointer-bottom');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(2500);
  await shot(p, 'menu-closed');

  const quotes = await topOf(p, '.l-quotes__sticky');
  await travel(p, quotes + 450);
  await p.mouse.move(980, 520, { steps: 10 });
  await p.waitForTimeout(2500);
  await shot(p, 'quotes-cursor');

  await travel(p, await limit(p));
  const box = await p.locator('.footer__text-mask').first().boundingBox();
  if (box) await p.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.5, { steps: 10 });
  await p.waitForTimeout(2500);
  await shot(p, 'footer-mask');

  await p.locator('.js-cookie-consent-accept').first().click();
  await p.waitForTimeout(1500);
  await shot(p, 'cookie-accepted');
  await p.context().close();
}

// a location modal opened from the address
{
  const p = await page('/location#museum-future');
  await p.waitForTimeout(3000);
  await shot(p, 'location-modal');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(3000);
  await shot(p, 'location-modal-closed');
  await p.context().close();
}

// page change: home → location through the header link
{
  const p = await page('/');
  await p.locator('header .header__content-right a[href="/location"]').first().click();
  await p.waitForTimeout(1200);
  await shot(p, 'page-change-screen');
  await p.waitForTimeout(12000);
  await shot(p, 'page-change-arrived');
  await p.context().close();
}

await b.close();
console.log('interaction states captured');
