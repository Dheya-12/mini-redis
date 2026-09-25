// Content extractor (build-time tool, not shipped to the browser).
//
// Reads the public, server-rendered HTML of every bulbs.simondupety.com route (saved by the capture step),
// serialises the page markup into compact JSON element trees, downloads every image once to /public/media
// and writes:
//   src/content/pages/<slug>.json   one file per route  ({ route, title, description, view })
//   src/content/chrome.json         header, preloader and sound prompt shared by every route
//   src/content/routes.json         the route index
//
// Tree format:  node = string | [tag, props | 0, ...children]
// Props are already React-shaped (className, htmlFor, style objects, camelCased SVG attributes).
//
// usage: node tools/extract-content.mjs <ssrDir>
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const [ssrDir] = process.argv.slice(2);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT_PAGES = path.join(ROOT, 'src/content/pages');
const MEDIA = path.join(ROOT, 'public/media');
fs.mkdirSync(OUT_PAGES, { recursive: true });
fs.mkdirSync(MEDIA, { recursive: true });

// ---------------------------------------------------------------- media (one rendition per image)
const media = new Map(); // remote url -> public path
function localImage(url) {
  if (!/^https:\/\/images\.prismic\.io\//.test(url)) return url;
  if (media.has(url)) return media.get(url);
  const u = new URL(url);
  const base = decodeURIComponent(path.basename(u.pathname)).replace(/\.[a-z0-9]+$/i, '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
  const name = `${base}-${crypto.createHash('sha1').update(url).digest('hex').slice(0, 6)}`;
  const existing = fs.readdirSync(MEDIA).find((f) => f.startsWith(name + '.'));
  let file = existing;
  if (!file) {
    const tmp = path.join(MEDIA, name + '.tmp');
    // ask for a baseline JPEG so every browser (and WebGL texture upload) can read it
    const type = execFileSync('curl', ['-sS', '-L', '--max-time', '120', '-H', 'Accept: image/jpeg,image/*;q=0.8', '-o', tmp, '-w', '%{content_type}', url]).toString().split(';')[0].trim();
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }[type] || 'jpg';
    file = `${name}.${ext}`;
    fs.renameSync(tmp, path.join(MEDIA, file));
  }
  const pub = '/media/' + file;
  media.set(url, pub);
  return pub;
}

// ---------------------------------------------------------------- attributes -> React props
const RENAME = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', srcset: 'srcSet', crossorigin: 'crossOrigin',
  fetchpriority: 'fetchPriority', referrerpolicy: 'referrerPolicy', decoding: 'decoding', loading: 'loading', autoplay: 'autoPlay', playsinline: 'playsInline',
  'stroke-width': 'strokeWidth', 'stroke-linecap': 'strokeLinecap', 'stroke-linejoin': 'strokeLinejoin', 'fill-rule': 'fillRule',
  'clip-rule': 'clipRule', viewbox: 'viewBox',
};
const BOOL = new Set(['hidden', 'muted', 'loop', 'playsInline', 'autoPlay', 'controls', 'disabled', 'download']);
const camel = (s) => s.replace(/[-:]([a-z])/g, (_, c) => c.toUpperCase());
function styleObject(css) {
  const out = {};
  for (const part of css.split(/;(?![^(]*\))/)) {
    const i = part.indexOf(':');
    if (i < 0) continue;
    const k = part.slice(0, i).trim(), v = part.slice(i + 1).trim();
    if (k) out[k.startsWith('--') ? k : camel(k)] = v;
  }
  return out;
}
const SITE = /^https?:\/\/bulbs\.simondupety\.com/;
function toProps(tag, attrs, custom) {
  const p = {};
  for (let [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) continue; // inline handlers are re-implemented (see src/behaviours)
    if (k.startsWith('data-astro-cid')) continue; // scoped-style hashes of the original build
    if (k === 'crossorigin') continue; // media is same-origin once self-hosted
    if (k === 'style') { const s = styleObject(v); if (Object.keys(s).length) p.style = s; continue; }
    if (k === 'href' && SITE.test(v)) v = v.replace(SITE, '') || '/';
    if ((k === 'data-product-image2' || k === 'data-product-image3') && v) v = localImage(v);
    // custom elements take raw attribute names (React 19 passes them through)
    let name = custom ? (k === 'class' ? 'className' : k) : RENAME[k] || (k.startsWith('data-') || k.startsWith('aria-') || k === 'gl-media' || k === 'gl-dom' ? k : (/[-:]/.test(k) ? camel(k) : k));
    if (BOOL.has(name)) { p[name] = true; continue; }
    p[name] = v;
  }
  return p;
}

// ---------------------------------------------------------------- tree conversion
const VOID = new Set(['img', 'br', 'hr', 'input', 'source', 'meta', 'link', 'wbr']);
const NO_TEXT = new Set(['picture', 'svg', 'g', 'ul', 'ol']);
function convert(n, parentTag) {
  if (typeof n === 'string') return NO_TEXT.has(parentTag) && !n.trim() ? null : n;
  let [tag, attrs, ...kids] = n;
  if (tag === 'picture') {
    // one self-hosted rendition per image: keep the <img>, drop the <source> candidates
    kids = kids.filter((k) => Array.isArray(k) && k[0] === 'img');
  }
  if (tag === 'img' || tag === 'source') {
    attrs = { ...attrs };
    delete attrs.srcset; delete attrs.sizes;
    if (attrs.src) attrs.src = localImage(attrs.src);
  }
  const custom = tag.includes('-');
  const props = toProps(tag, attrs, custom);
  const out = [tag, Object.keys(props).length ? props : 0];
  if (!VOID.has(tag)) for (const k of kids) { const c = convert(k, tag); if (c !== null && c !== '') out.push(c); }
  return out;
}

const serialize = (sel) => {
  const ser = (el) => {
    if (el.nodeType === 3) return el.data;
    if (el.nodeType !== 1) return null;
    const tag = el.localName;
    if (['script', 'noscript', 'style', 'template', 'link', 'meta'].includes(tag)) return null;
    const attrs = {};
    for (const a of el.attributes) attrs[a.name] = a.value;
    return [tag, attrs, ...[...el.childNodes].map(ser).filter((x) => x !== null)];
  };
  const root = typeof sel === 'string' ? document.querySelector(sel) : sel;
  return root ? ser(root) : null;
};

// ---------------------------------------------------------------- run
const b = await chromium.launch();
const ctx = await b.newContext({ javaScriptEnabled: false });
await ctx.route('**/*', (r) => (r.request().url().startsWith('file:') ? r.continue() : r.abort()));
const tab = await ctx.newPage();
const index = [];
let chrome = null;
for (const f of fs.readdirSync(ssrDir).filter((x) => x.endsWith('.html')).sort()) {
  const slug = path.basename(f, '.html');
  const route = slug === 'home' ? '/' : '/' + slug.replace('_', '/');
  await tab.goto('file://' + path.resolve(ssrDir, f));
  const raw = await tab.evaluate((ser) => {
    const s = new Function('return ' + ser)();
    const meta = (n) => document.querySelector(`meta[name="${n}"],meta[property="${n}"]`)?.getAttribute('content') || '';
    return {
      title: document.title, description: meta('description'), ogImage: meta('og:image'),
      view: s('[data-taxi-view]'),
      chrome: { header: s('body > header'), preloader: s('body > .preloader'), preloaderSound: s('body > .preloader-sound') },
    };
  }, serialize.toString());
  const view = convert(raw.view, null);
  const doc = { route, title: raw.title, description: raw.description, ogImage: raw.ogImage ? localImage(raw.ogImage) : null, view };
  fs.writeFileSync(path.join(OUT_PAGES, slug + '.json'), JSON.stringify(doc));
  index.push({ slug, route, title: raw.title });
  if (slug === 'home') chrome = Object.fromEntries(Object.entries(raw.chrome).map(([k, v]) => [k, v ? convert(v, null) : null]));
}
await b.close();
fs.writeFileSync(path.join(ROOT, 'src/content/chrome.json'), JSON.stringify(chrome));
fs.writeFileSync(path.join(ROOT, 'src/content/routes.json'), JSON.stringify(index, null, 1));
console.log(`pages ${index.length}, images ${media.size}`);
