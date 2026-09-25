// Content extractor (build-time tool, not shipped to the browser).
//
// Reads the public, server-rendered HTML of every sobha-privy-collection.com route (saved by the capture step),
// serialises the page markup into compact JSON element trees, downloads every referenced image once to /public/media
// (keeping the site's folder structure, e.g. /assets/images/media/landing/… → /media/landing/…), turns the Kinescope
// film embeds into self-hosted <video> elements and writes:
//   src/content/pages/<slug>.json   one file per route  ({ route, title, description, htmlClass, view })
//   src/content/chrome.json         skip link, preloaders, cookie dialog and rotate-device message
//   src/content/routes.json         the route index
//   src/content/films.json          Kinescope embed id → local file, poster size
//
// Tree format:  node = string | [tag, props | 0, ...children]
// Props are already React-shaped (className, htmlFor, style objects, camelCased SVG attributes).
//
// usage: node tools/extract-content.mjs <ssrDir> [--no-films]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const [ssrDir] = process.argv.slice(2);
const FILMS = !process.argv.includes('--no-films');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'src/content');
const PUBLIC = path.join(ROOT, 'public');
const ORIGIN = 'https://sobha-privy-collection.com';
fs.mkdirSync(path.join(OUT, 'pages'), { recursive: true });

// ---------------------------------------------------------------- media
const downloaded = new Map(); // site path -> public path
const missing = new Set(); // referenced by the original's markup but not served by it
function curl(url, file, extra = []) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  execFileSync('curl', ['-sS', '-L', '--fail', '--retry', '3', '--max-time', '300', ...extra, '-o', file, url]);
}
/** /assets/images/<rest>?v → /media/<rest> (the image itself is downloaded once) */
function localAsset(url) {
  if (!url) return url;
  const m = url.match(/^(?:https:\/\/sobha-privy-collection\.com)?\/assets\/images\/([^?#\s]+)(?:\?[^#\s]*)?(#.*)?$/);
  if (!m) return url;
  const rel = m[1].replace(/^media\//, '');
  const pub = '/media/' + rel;
  if (!downloaded.has(rel)) {
    const file = path.join(PUBLIC, 'media', rel);
    // a few references are broken on the original too (404); they stay broken here, and are listed
    try { if (!fs.existsSync(file)) curl(`${ORIGIN}/assets/images/${m[1]}`, file); } catch { missing.add(rel); fs.rmSync(file, { force: true }); }
    downloaded.set(rel, pub);
  }
  return pub + (m[2] || '');
}
const localSrcset = (v) => (v.startsWith('data:') ? v : v.split(',').map((c) => c.trim()).filter(Boolean).map((c) => { const [u, ...d] = c.split(/\s+/); return [localAsset(u), ...d].join(' '); }).join(', '));

// ---------------------------------------------------------------- films (Kinescope → one MP4 per film)
const films = {};
function film(id) {
  if (films[id]) return films[id];
  const file = path.join(PUBLIC, 'media/films', id + '.mp4');
  const entry = (films[id] = { src: `/media/films/${id}.mp4` });
  if (!FILMS || fs.existsSync(file)) return entry;
  // the embed page names the HLS master playlist; each rendition is one fragmented MP4 served in byte ranges
  const embed = execFileSync('curl', ['-sS', '-L', '-H', `Referer: ${ORIGIN}/`, `https://kinescope.io/embed/${id}`]).toString();
  const master = embed.match(/https:\/\/kinescope\.io\/[0-9a-f-]{36}\/master\.m3u8/)?.[0];
  if (!master) { console.warn('no playlist for film', id); return entry; }
  const list = execFileSync('curl', ['-sS', '-H', `Referer: ${ORIGIN}/`, master]).toString();
  const variants = [...list.matchAll(/RESOLUTION=(\d+)x(\d+)[^\n]*\n(media\.m3u8\?quality=(\d+)&type=video)/g)].map((v) => ({ w: +v[1], h: +v[2], q: +v[4], uri: v[3] }));
  // the largest rendition up to 1080 lines (the films fill the screen at 1440 × 900)
  const pick = variants.filter((v) => v.q <= 1080).sort((a, b) => b.q - a.q)[0] ?? variants[0];
  const media = execFileSync('curl', ['-sS', '-H', `Referer: ${ORIGIN}/`, master.replace('master.m3u8', pick.uri)]).toString();
  const mp4 = media.match(/#EXT-X-MAP:URI="([^"]+)"/)?.[1];
  if (!mp4) { console.warn('no media file for film', id); return entry; }
  curl(mp4, file, ['-H', `Referer: ${ORIGIN}/`]);
  Object.assign(entry, { width: pick.w, height: pick.h });
  return entry;
}

// ---------------------------------------------------------------- attributes -> React props
const RENAME = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', srcset: 'srcSet', crossorigin: 'crossOrigin',
  fetchpriority: 'fetchPriority', referrerpolicy: 'referrerPolicy', autoplay: 'autoPlay', playsinline: 'playsInline',
  maxlength: 'maxLength', minlength: 'minLength', autocomplete: 'autoComplete', novalidate: 'noValidate',
  readonly: 'readOnly', frameborder: 'frameBorder', allowfullscreen: 'allowFullScreen', inputmode: 'inputMode',
  enctype: 'encType', 'accept-charset': 'acceptCharset', datetime: 'dateTime', spellcheck: 'spellCheck',
  contenteditable: 'contentEditable', enterkeyhint: 'enterKeyHint', autocapitalize: 'autoCapitalize',
  colspan: 'colSpan', rowspan: 'rowSpan', 'http-equiv': 'httpEquiv', formnovalidate: 'formNoValidate',
  'xlink:href': 'xlinkHref', 'xml:space': 'xmlSpace', 'xmlns:xlink': 'xmlnsXlink', viewbox: 'viewBox',
};
const BOOL = new Set(['hidden', 'muted', 'loop', 'playsInline', 'autoPlay', 'controls', 'disabled', 'required', 'noValidate', 'readOnly', 'multiple', 'open', 'allowFullScreen', 'inert', 'formNoValidate', 'async', 'defer']);
const camel = (s) => s.replace(/[-:]([a-z])/g, (_, c) => c.toUpperCase());
function styleObject(css) {
  const out = {};
  for (const part of css.split(/;(?![^(]*\))/)) {
    const i = part.indexOf(':');
    if (i < 0) continue;
    const k = part.slice(0, i).trim(), v = part.slice(i + 1).trim();
    if (k) out[k.startsWith('--') ? k : camel(k)] = v.replace(/url\((['"]?)([^'")]+)\1\)/g, (_, q, u) => `url(${q}${localAsset(u)}${q})`);
  }
  return out;
}
const SITE = /^https?:\/\/sobha-privy-collection\.com/;
function toProps(tag, attrs, custom) {
  const p = {};
  for (let [k, v] of Object.entries(attrs)) {
    if (/^on[a-z]/.test(k)) continue; // inline handlers are re-implemented (see src/behaviours)
    if (k === 'style') { const s = styleObject(v); if (Object.keys(s).length) p.style = s; continue; }
    if ((k === 'href' || k === 'action') && SITE.test(v)) v = v.replace(SITE, '') || '/';
    if (k === 'src' || k === 'data-src' || k === 'poster' || k === 'href' || k === 'xlink:href') v = localAsset(v);
    if (k === 'srcset' || k === 'data-srcset') v = localSrcset(v);
    if (k === 'value' && (tag === 'input' || tag === 'textarea') ) { if (attrs.type === 'checkbox' || attrs.type === 'radio') p.value = v; else p.defaultValue = v; continue; }
    if (k === 'checked') { p.defaultChecked = true; continue; }
    if (k === 'selected') continue; // folded into the <select>'s defaultValue
    let name = custom ? (k === 'class' ? 'className' : k) : RENAME[k] || (k.startsWith('data-') || k.startsWith('aria-') ? k : /[-:]/.test(k) ? camel(k) : k);
    if (BOOL.has(name)) { p[name] = true; continue; }
    p[name] = v;
  }
  return p;
}

// ---------------------------------------------------------------- tree conversion
const VOID = new Set(['img', 'br', 'hr', 'input', 'source', 'meta', 'link', 'wbr', 'use', 'stop', 'path', 'circle', 'rect', 'ellipse', 'line', 'polyline', 'polygon']);
const NO_TEXT = new Set(['picture', 'svg', 'g', 'ul', 'ol', 'select', 'defs', 'mask', 'linearGradient', 'radialGradient', 'clipPath', 'table', 'tbody', 'thead', 'tr', 'video']);
function convert(n, parentTag) {
  if (typeof n === 'string') return NO_TEXT.has(parentTag) && !n.trim() ? null : n;
  let [tag, attrs, ...kids] = n;
  if (tag === 'iframe' && /kinescope\.io\/embed\//.test(attrs.src || attrs['data-src'] || '')) {
    // film embed → self-hosted, muted, looping video that keeps the iframe's classes and box
    const id = (attrs.src || attrs['data-src']).match(/embed\/([A-Za-z0-9]+)/)[1];
    const f = film(id);
    const props = { className: ['film', attrs.class].filter(Boolean).join(' '), src: f.src, 'data-film': id, muted: true, loop: true, playsInline: true, autoPlay: true, preload: 'none' };
    if (attrs.width) props.width = attrs.width;
    if (attrs.height) props.height = attrs.height;
    if (attrs.title) props.title = attrs.title;
    for (const [k, v] of Object.entries(attrs)) if (k.startsWith('data-') || k.startsWith('aria-')) props[k] = v;
    return ['video', props];
  }
  if (tag === 'select') {
    const sel = kids.find((k) => Array.isArray(k) && k[0] === 'option' && 'selected' in k[1]);
    if (sel) attrs = { ...attrs, value: sel[1].value ?? '' };
    const p = toProps(tag, attrs, false);
    if ('value' in p) { p.defaultValue = p.value; delete p.value; }
    const out = [tag, Object.keys(p).length ? p : 0];
    for (const k of kids) { const c = convert(k, tag); if (c !== null && c !== '') out.push(c); }
    return out;
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
for (const slug of ['home', 'location', 'privacy-policy']) {
  const route = slug === 'home' ? '/' : '/' + slug;
  await tab.goto('file://' + path.resolve(ssrDir, slug + '.html'));
  const raw = await tab.evaluate((ser) => {
    const s = new Function('return ' + ser)();
    const meta = (n) => document.querySelector(`meta[name="${n}"],meta[property="${n}"]`)?.getAttribute('content') || '';
    return {
      title: document.title, description: meta('description'), ogImage: meta('og:image'),
      htmlClass: document.documentElement.className,
      view: s('[data-barba="container"]'),
      chrome: {
        skip: s('body > a.sr-only'), preloader: s('body > .preloader.js-preloader'), preloaderIntro: s('body > .preloader--intro'),
        cookie: s('#cookie-consent'), turn: s('body > .turn-message'),
      },
      hasIntro: !!document.querySelector('body > .preloader--intro'),
    };
  }, serialize.toString());
  const doc = { route, title: raw.title, description: raw.description, ogImage: raw.ogImage ? localAsset(raw.ogImage.replace(SITE, '')) : null, intro: raw.hasIntro, view: convert(raw.view, null) };
  fs.writeFileSync(path.join(OUT, 'pages', slug + '.json'), JSON.stringify(doc));
  index.push({ slug, route, title: raw.title });
  if (slug === 'home') chrome = Object.fromEntries(Object.entries(raw.chrome).map(([k, v]) => [k, v ? convert(v, null) : null]));
}
await b.close();
// the icon sprite and the favicons referenced from <head>
for (const f of ['icons.svg']) localAsset(`/assets/images/${f}`);
for (const f of ['favicon-32x32.png', 'favicon-16x16.png', 'apple-touch-icon.png']) {
  const file = path.join(PUBLIC, 'manifest', f);
  if (!fs.existsSync(file)) curl(`${ORIGIN}/assets/manifest/${f}`, file);
}
fs.writeFileSync(path.join(OUT, 'chrome.json'), JSON.stringify(chrome));
fs.writeFileSync(path.join(OUT, 'routes.json'), JSON.stringify(index, null, 1));
fs.writeFileSync(path.join(OUT, 'films.json'), JSON.stringify(films, null, 1));
fs.writeFileSync(path.join(OUT, 'missing-media.json'), JSON.stringify([...missing].sort(), null, 1));
console.log(`pages ${index.length}, images ${downloaded.size - missing.size} (+${missing.size} broken on the original), films ${Object.keys(films).length}`);
