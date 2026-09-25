import { chromium } from 'playwright';
const [origin, Y, sel] = process.argv.slice(2);
const local = /localhost/.test(origin);
const b = await chromium.launch({ ...(!local ? { proxy: { server: process.env.HTTPS_PROXY } } : {}) });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(origin + '/', { waitUntil: 'load', timeout: 120000 });
await p.waitForTimeout(8000);
const go = (y) => p.evaluate((y) => window.lenis ? window.lenis.scrollTo(y, { immediate: true, force: true }) : $('body').scroller('instance').scrollTop(y), y);
for (let y = 0; y <= +Y; y += 900) { await go(y); await p.waitForTimeout(400); }
await go(+Y); await p.waitForTimeout(2000);
console.log(JSON.stringify(await p.evaluate((sel) => {
  const sec = document.querySelector(sel);
  const out = [];
  for (const e of [sec, ...sec.querySelectorAll('*')]) {
    if (e.closest('svg') && e.tagName !== 'svg') continue;
    const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    if (!r.height) continue;
    out.push([e.tagName, (e.className?.baseVal ?? e.className).slice(0, 45), Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height), cs.transform.slice(0, 50), cs.opacity, (e.getAttribute('data-parallax-pattern') || '').slice(0, 40)].join(' | '));
  }
  return out.slice(0, 40);
}, sel), null, 1));
await b.close();
