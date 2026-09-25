// Interaction and motion states, captured the same way on both sides.
// usage: node interactions.mjs <origin> <outDir>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [origin, out] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const local = /localhost/.test(origin);
const b = await chromium.launch({ ...(!local && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {}), args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const shot = (p, name) => p.screenshot({ path: path.join(out, name + '.png') });
async function page(route = '/', w = 1440, h = 900) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.route(/umami/, (r) => r.abort());
  const p = await ctx.newPage();
  await p.goto(origin + route, { waitUntil: 'load', timeout: 120000 });
  return p;
}
const toStack = async (p) => {
  const max = await p.evaluate(() => window.lenis.limit);
  // the stack sits one screen above the footer
  const y = await p.evaluate(() => { const w = document.querySelector('.wrapper'); return w.getBoundingClientRect().bottom + window.lenis.scroll - innerHeight + 10; });
  await p.evaluate((y) => window.lenis.scrollTo(y, { immediate: true, force: true }), Math.min(max, y));
  await p.waitForTimeout(3500);
};

// intro, first visit
{
  const p = await page('/');
  // intro frames, timed from the load event
  const t0 = Date.now();
  for (const t of [1500, 3000, 4500, 8000]) {
    await p.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
    await shot(p, `intro-${t}`);
  }
  // stack, hover a title, click it
  await toStack(p);
  await shot(p, 'stack');
  await p.locator('.content h2 a').nth(3).hover();
  await p.waitForTimeout(1500);
  await shot(p, 'stack-hover');
  await p.locator('.content h2 a').nth(3).click();
  await p.waitForTimeout(700);
  await shot(p, 'flight-700');
  await p.waitForTimeout(3300);
  await shot(p, 'product-after-flight');
  await p.context().close();
}
// product page: enlarge an image, then cycle to the next
{
  const p = await page('/products/influorescence-c7.1');
  await p.waitForTimeout(5000);
  const box = await p.locator('.product-slider [gl-media]').first().boundingBox();
  await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await p.waitForTimeout(1800);
  await shot(p, 'product-focus');
  const slot = await p.locator('.empty-slider').boundingBox();
  await p.mouse.click(slot.x + slot.width / 2, slot.y + slot.height / 2);
  await p.waitForTimeout(2200);
  await shot(p, 'product-next');
  await p.context().close();
}
// sound toggle
{
  const p = await page('/about');
  await p.waitForTimeout(4000);
  await p.click('[data-sound]');
  await p.waitForTimeout(800);
  await shot(p, 'sound-on');
  await p.context().close();
}
await b.close();
console.log('done');
