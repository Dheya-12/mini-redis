// Generic chapter-stop capture harness.
// usage: node capture.mjs <url> <outDir> <width> <height> [--mobile] [--settle ms] [--mids]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [url, outDir, W, H] = process.argv.slice(2);
const mobile = process.argv.includes('--mobile');
const mids = process.argv.includes('--mids');
const settleArg = process.argv.indexOf('--settle');
const SETTLE = settleArg > 0 ? +process.argv[settleArg + 1] : 4500;
const local = /localhost|127\.0\.0\.1/.test(url);
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch(!local && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
const ctx = await browser.newContext({
  viewport: { width: +W, height: +H }, deviceScaleFactor: 1,
  isMobile: mobile, hasTouch: mobile, reducedMotion: 'no-preference',
});
const page = await ctx.newPage();
// block analytics so both sides run the same code paths
await page.route(/googletagmanager|google-analytics|doubleclick|facebook|clarity\.ms|capi-automation|googleadservices|google\.com\/(ccm|rmkt)/, r => r.abort());
await page.goto(url, { waitUntil: 'load', timeout: 90000 });
await page.waitForFunction(() => document.body.classList.contains('pl-done') || document.documentElement.dataset.preloader === 'done', null, { timeout: 30000 }).catch(() => console.log('preloader flag timeout'));
await page.waitForTimeout(4500);
// deterministic hero media: wait for the intro clip's hard cut into the ambient loop (desktop)
if (!mobile) await page.waitForFunction(() => /ambient/.test(document.querySelector('.hero')?.className || ''), null, { timeout: 20000 }).catch(() => console.log('ambient timeout'));

// freeze videos on a deterministic frame
async function freezeVideos() {
  await page.evaluate(async () => {
    const vids = [...document.querySelectorAll('video')];
    await Promise.all(vids.map(v => new Promise(res => {
      try { v.pause(); } catch {}
      if (v.readyState < 1) return res();
      const done = () => res();
      v.addEventListener('seeked', done, { once: true });
      try { v.currentTime = 0.5; } catch { res(); }
      setTimeout(res, 3000);
    })));
  });
}
await freezeVideos();
await page.addStyleTag({ content: '*{caret-color:transparent!important}' });

const stops = await page.evaluate(() => {
  const max = document.documentElement.scrollHeight - innerHeight;
  const arr = [];
  document.querySelectorAll('.chapter,[data-chapter]').forEach(ch => {
    let top = 0, el = ch; while (el) { top += el.offsetTop; el = el.offsetParent; }
    top = Math.min(top, max);
    if (arr.length && Math.abs(top - arr[arr.length - 1].y) < 2) return;
    arr.push({ y: top, id: ch.id || ch.className.split(' ')[0] });
  });
  return { arr, max, scrollH: document.documentElement.scrollHeight };
});
console.log(JSON.stringify(stops));

async function textProbe() {
  return page.evaluate(() => {
    const out = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let el;
    while ((el = walker.nextNode())) {
      if (el.closest('svg')) continue;
      const own = [...el.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').replace(/\s+/g, ' ').trim();
      if (!own) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      const cs = getComputedStyle(el);
      let op = 1, p = el; while (p && p !== document.body) { op *= +getComputedStyle(p).opacity; p = p.parentElement; }
      if (cs.visibility === 'hidden' || op < 0.05) continue;
      out.push({ t: own.slice(0, 48), tag: el.tagName.toLowerCase(), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
        fs: cs.fontSize, ff: cs.fontFamily.split(',')[0].replace(/"/g, ''), fw: cs.fontWeight, fst: cs.fontStyle, ls: cs.letterSpacing, lh: cs.lineHeight, c: cs.color, op: +op.toFixed(2) });
    }
    return out;
  });
}

const frames = [];
const targets = [];
stops.arr.forEach((s, i) => {
  targets.push({ name: `${String(i).padStart(2, '0')}-${s.id}`, y: s.y });
  if (mids && i < stops.arr.length - 1) targets.push({ name: `${String(i).padStart(2, '0')}m-${s.id}`, y: Math.round((s.y + stops.arr[i + 1].y) / 2) });
});
for (const t of targets) {
  await page.evaluate(y => window.scrollTo(0, y), t.y);
  const isMap = /amenities|map/.test(t.name);
  await page.waitForTimeout(isMap ? Math.max(SETTLE, 8500) : SETTLE);
  // pin CSS animations (dot pulses, caret) to t=0 so random phases can't differ between runs
  await page.evaluate(() => document.getAnimations().forEach(a => { if (a instanceof CSSAnimation) { try { a.effect.updateTiming({ delay: 0 }); a.currentTime = 0; a.pause(); } catch {} } }));
  await page.waitForTimeout(100);
  const actual = await page.evaluate(() => window.scrollY);
  await page.screenshot({ path: path.join(outDir, `${t.name}.png`) });
  const texts = await textProbe();
  frames.push({ ...t, actual, texts });
  console.log('shot', t.name, t.y, actual);
}
fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify({ url, W: +W, H: +H, mobile, stops, frames }, null, 1));
await browser.close();
