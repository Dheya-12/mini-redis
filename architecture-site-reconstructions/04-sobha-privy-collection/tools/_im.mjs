import { chromium } from 'playwright';
const [origin, Y, sel] = process.argv.slice(2);
const local = /localhost/.test(origin);
const b = await chromium.launch({ ...(!local ? { proxy: { server: process.env.HTTPS_PROXY } } : {}) });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(origin + '/', { waitUntil: 'load', timeout: 120000 });
await p.waitForTimeout(8000);
const go = (y) => p.evaluate((y) => window.lenis ? window.lenis.scrollTo(y, { immediate: true, force: true }) : $('body').scroller('instance').scrollTop(y), y);
for (let y = 0; y <= +Y; y += 900) { await go(y); await p.waitForTimeout(250); }
await go(+Y); await p.waitForTimeout(1500);
console.log(JSON.stringify(await p.evaluate((sel) => {
  const root = document.querySelector(sel);
  return [root, ...root.querySelectorAll('*')].map((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return [e.tagName, (e.className?.baseVal ?? e.className).slice(0, 50), Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height), cs.position, cs.objectFit, cs.transform.slice(0, 40), cs.visibility, cs.opacity, e.currentSrc?.slice(-40), e.getAttribute('style')?.slice(0, 120)].join(' | '); });
}, sel), null, 1));
await b.close();
