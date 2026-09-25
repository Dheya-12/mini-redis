// Interaction-state capture. usage: node interactions.mjs <url> <outDir> <w> <h> [--mobile]
import { chromium } from 'playwright';
import fs from 'node:fs';
const [url, out, W, H] = process.argv.slice(2);
const mobile = process.argv.includes('--mobile');
const TARGET = process.argv.includes('--target');
const S = TARGET ? {
  cta: '.masthead__ctas .pill-btn >> nth=0', nav: '.masthead__nav a >> nth=1', mode: '[data-qa=enquiry-mode]', burger: '.burger',
  tag: '#finishes .frame__tag >> nth=2', dot: '[data-map=dots] [data-id="01"] .amenity-dot__hit', journey: '.journey-btn',
  name: '#contact-name', email: '#contact-email', next: '.step-form__step--active [data-qa=contact-next]',
} : {
  cta: '.header-ctas .mbtn >> nth=0', nav: '.desktop-nav a >> nth=1', mode: '#fmc-mode', burger: '.menu-button',
  tag: '#finishes .tags span >> nth=2', dot: '#dots .dot[data-id="01"] .hit', journey: '.map-journey',
  name: '#cf-name', email: '#cf-email', next: '.cf-step.active .cf-next',
};
const local = /localhost|127\.0\.0\.1/.test(url);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch(!local && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
const page = await ctx.newPage();
await page.route(/googletagmanager|google-analytics|doubleclick|facebook|clarity\.ms|capi-automation|googleadservices|calendly/, r => r.abort());
await page.goto(url, { waitUntil: 'load', timeout: 90000 });
await page.waitForFunction(() => document.body.classList.contains('pl-done') || document.documentElement.dataset.preloader === 'done', null, { timeout: 30000 }).catch(() => {});
await page.waitForTimeout(4500);
await page.evaluate(() => document.querySelectorAll('video').forEach(v => { v.pause(); try { v.currentTime = 0.5; } catch {} }));
await page.waitForTimeout(800);
const shot = async (n, clip) => { await page.screenshot({ path: `${out}/${n}.png`, ...(clip ? { clip } : {}) }); console.log('shot', n); };
const stopY = async (sel) => page.evaluate(s => { let el = document.querySelector(s), t = 0; while (el) { t += el.offsetTop; el = el.offsetParent; } return t; }, sel);
const go = async (sel, wait = 4500) => { const y = await stopY(sel); await page.evaluate(y => scrollTo(0, y), y); await page.waitForTimeout(wait); };
const H0 = { x: 0, y: 0, width: +W, height: 110 };

if (!mobile) {
  await page.hover(S.cta); await page.waitForTimeout(900); await shot('i01-header-cta-hover', H0);
  await page.hover(S.nav); await page.waitForTimeout(700); await shot('i02-nav-hover', H0);
  await page.mouse.move(700, 850);
  await page.click(S.mode); await page.waitForTimeout(1600); await shot('i03-form-callback');
  await page.click(S.mode); await page.waitForTimeout(1200);
} else {
  await page.click(S.burger); await page.waitForTimeout(1800); await shot('i04-menu-open');
  await page.click(S.burger); await page.waitForTimeout(1200);
  await go('#enquire'); await page.click(S.mode); await page.waitForTimeout(1600); await shot('i03-form-callback');
}
await go('#finishes');
await page.click(S.tag); await page.waitForTimeout(2200); await shot('i05-finishes-stone');
await go('#amenities', 9000);
if (!mobile) { await page.hover(S.dot, { force: true }).catch(e => console.log(e.message)); await page.waitForTimeout(800); await shot('i06-map-dot-hover'); }
await page.click(S.dot, { force: true }).catch(e => console.log(e.message));
await page.waitForTimeout(1200); await shot('i07-map-diving');
await page.waitForTimeout(4000); await shot('i08-map-dived');
await page.mouse.click(+W / 2, +H / 2); await page.waitForTimeout(4000); await shot('i09-map-returned');
await page.click(S.journey); await page.waitForTimeout(4000); await shot('i10-map-area');
await page.click(S.journey); await page.waitForTimeout(4000);
await go('#contact');
await page.fill(S.name, 'Alex Example'); await page.fill(S.email, 'alex@example.com');
await page.click(S.next); await page.waitForTimeout(1200); await shot('i11-contact-step2');
await page.click(S.next); await page.waitForTimeout(900); await shot('i12-contact-invalid');
await browser.close();
