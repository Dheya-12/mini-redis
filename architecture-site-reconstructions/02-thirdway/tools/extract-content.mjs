// Content extractor (build-time tool, not shipped to the browser).
//
// Reads the public, server-rendered HTML of every thirdway.com route (saved by the capture step),
// serialises the page markup into compact JSON element trees, rewrites every media URL to a
// self-hosted file under /public/media and writes:
//   src/content/pages/<slug>.json   one file per route  ({ route, title, description, tree })
//   src/content/chrome.json         header / cookie UI / footer shared by every route
//
// Tree format:  node = string | [tag, props | 0, ...children]
// Props are already React-shaped (className, htmlFor, style objects, camelCased SVG attributes).
//
// usage: node tools/extract-content.mjs <ssrDir> <manifest.json> <videoDir> [liveDir]
// liveDir: markup of UI the site only renders client-side (e.g. the contact modal), saved from the live page.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const [ssrDir, manifestPath, videoDir, liveDir] = process.argv.slice(2);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT_PAGES = path.join(ROOT, 'src/content/pages');
const MEDIA = path.join(ROOT, 'public/media');
fs.mkdirSync(OUT_PAGES, { recursive: true });
fs.mkdirSync(path.join(MEDIA, 'video'), { recursive: true });

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const workDir = path.dirname(path.resolve(manifestPath));
const byPath = new Map(); // url without query -> [urls]
for (const u of Object.keys(manifest)) {
  const k = u.split('?')[0];
  if (!byPath.has(k)) byPath.set(k, []);
  byPath.get(k).push(u);
}

// ---------------------------------------------------------------- media
const used = new Map(); // public name -> absolute source file
const downloads = new Map(); // url -> public name
const extOf = (type) => ({ 'image/avif': 'avif', 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/svg+xml': 'svg', 'image/gif': 'gif' })[type] || 'bin';
function pub(url) {
  const e = manifest[url];
  if (!e) return null;
  const name = e.file;
  used.set(name, path.join(workDir, e.dir, 'files', e.file));
  return '/media/' + name;
}
function widthOf(desc) { const m = /(\d+)w/.exec(desc || ''); return m ? +m[1] : 0; }
function parseSrcset(s) {
  return (s || '').split(/,(?=\s*https?:|\s*\/)/).map((x) => x.trim()).filter(Boolean).map((x) => {
    const [u, d] = x.split(/\s+/);
    return { url: u, w: widthOf(d) };
  });
}
function slugFor(url) {
  const u = new URL(url);
  const base = path.basename(u.pathname).replace(/\.[a-z0-9]+$/i, '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60);
  return base + '-' + crypto.createHash('sha1').update(url).digest('hex').slice(0, 6);
}
function resolveImage(cands) {
  const found = cands.filter((c) => manifest[c.url]).sort((a, b) => b.w - a.w);
  if (found.length) return pub(found[0].url);
  // same asset fetched with other parameters?
  for (const c of cands) {
    const alt = byPath.get(c.url.split('?')[0]);
    if (alt) return pub(alt.sort((a, b) => (manifest[b].bytes || 0) - (manifest[a].bytes || 0))[0]);
  }
  if (!cands.length) return null;
  // never seen by the capture: fetch the candidate closest to a 1440px layout
  const pick = [...cands].sort((a, b) => Math.abs((a.w || 1440) - 1440) - Math.abs((b.w || 1440) - 1440))[0];
  if (!/^https?:/.test(pick.url)) return pick.url;
  if (!downloads.has(pick.url)) downloads.set(pick.url, slugFor(pick.url));
  return '/media/' + downloads.get(pick.url) + '.__EXT__';
}

// ---------------------------------------------------------------- attributes -> React props
const RENAME = {
  class: 'className', for: 'htmlFor', tabindex: 'tabIndex', srcset: 'srcSet', crossorigin: 'crossOrigin',
  playsinline: 'playsInline', autoplay: 'autoPlay', readonly: 'readOnly', maxlength: 'maxLength', minlength: 'minLength',
  autocomplete: 'autoComplete', autofocus: 'autoFocus', colspan: 'colSpan', rowspan: 'rowSpan', datetime: 'dateTime',
  enctype: 'encType', frameborder: 'frameBorder', allowfullscreen: 'allowFullScreen', referrerpolicy: 'referrerPolicy',
  fetchpriority: 'fetchPriority', spellcheck: 'spellCheck', contenteditable: 'contentEditable', inputmode: 'inputMode',
  enterkeyhint: 'enterKeyHint', novalidate: 'noValidate', accesskey: 'accessKey', itemprop: 'itemProp',
  itemscope: 'itemScope', itemtype: 'itemType', srcdoc: 'srcDoc', usemap: 'useMap', cellpadding: 'cellPadding',
  cellspacing: 'cellSpacing', formaction: 'formAction', 'accept-charset': 'acceptCharset', 'http-equiv': 'httpEquiv',
};
const BOOL = new Set(['hidden', 'muted', 'loop', 'playsInline', 'autoPlay', 'controls', 'disabled', 'inert', 'open', 'allowFullScreen', 'itemScope', 'noValidate', 'required', 'multiple', 'readOnly', 'autoFocus', 'defer', 'async', 'reversed']);
const camel = (s) => s.replace(/[-:]([a-z])/g, (_, c) => c.toUpperCase());
function styleObject(css) {
  const out = {};
  let depth = 0, cur = '';
  const parts = [];
  for (const ch of css) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ';' && depth === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  parts.push(cur);
  for (const p of parts) {
    const i = p.indexOf(':');
    if (i < 0) continue;
    const k = p.slice(0, i).trim(), v = p.slice(i + 1).trim();
    if (!k) continue;
    out[k.startsWith('--') ? k : camel(k.replace(/^-ms-/, 'ms-'))] = v;
  }
  return out;
}
// hashed CSS-module names from the original build get readable equivalents (see globals.css)
const cleanClass = (v) => v
  .replace(/wysiwyg-module__\w+__wysiwyg/g, 'wysiwyg-flow')
  .replace(/vimeo-module__\w+__loader/g, 'vimeo-loader')
  .replace(/\S+-module__\w+__variable/g, '')
  .replace(/\s+/g, ' ').trim();
const SITE = /^https?:\/\/(www\.)?thirdway\.com/;
function toProps(tag, attrs) {
  const p = {};
  for (let [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) continue;
    if (k === 'crossorigin') continue; // media is same-origin once self-hosted
    if (k === 'style') { const s = styleObject(v); if (Object.keys(s).length) p.style = s; continue; }
    if (k === 'href' && SITE.test(v)) v = v.replace(SITE, '') || '/';
    if (k === 'class') v = cleanClass(v);
    if (k === 'poster') { const r = resolveImage([{ url: v, w: 0 }]); if (r) p.poster = r; continue; }
    let name = RENAME[k] || (k.startsWith('data-') || k.startsWith('aria-') ? k : (/[-:]/.test(k) ? camel(k) : k));
    if (name === 'xmlnsXlink' || name === 'xmlns') { if (tag !== 'svg') continue; }
    if (BOOL.has(name)) { p[name] = true; continue; }
    if (tag === 'input' && name === 'value') name = 'defaultValue';
    if (tag === 'input' && name === 'checked') { p.defaultChecked = true; continue; }
    p[name] = v;
  }
  return p;
}

// ---------------------------------------------------------------- tree conversion
const VOID = new Set(['img', 'br', 'hr', 'input', 'source', 'meta', 'link', 'area', 'col', 'embed', 'track', 'wbr']);
const NO_TEXT = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'colgroup', 'select', 'picture', 'svg', 'g', 'defs']);
let videoFor = () => null;
function convert(n, page, parentTag) {
  if (typeof n === 'string') return NO_TEXT.has(parentTag) && !n.trim() ? null : n;
  let [tag, attrs, ...kids] = n;
  if (tag === 'picture') {
    const img = kids.find((k) => Array.isArray(k) && k[0] === 'img');
    const cands = [];
    for (const k of kids) if (Array.isArray(k) && (k[0] === 'source' || k[0] === 'img')) cands.push(...parseSrcset(k[1].srcset), ...(k[1].src ? [{ url: k[1].src, w: 0 }] : []));
    if (img) {
      const a = { ...img[1] };
      delete a.srcset; delete a.sizes;
      const r = resolveImage(cands);
      if (r) a.src = r;
      kids = [['img', a]];
    }
  } else if (tag === 'img') {
    const a = { ...attrs };
    const r = resolveImage([...parseSrcset(a.srcset), ...(a.src ? [{ url: a.src, w: 0 }] : [])]);
    delete a.srcset; delete a.sizes;
    if (r) a.src = r;
    attrs = a;
  } else if (tag === 'video') {
    const v = videoFor(attrs, page);
    attrs = { ...attrs };
    if (v) attrs['data-src'] = v;
  }
  if (/\bvimeo-video\b/.test(attrs.class || '')) {
    const v = videoFor({}, page); // embedded Vimeo player -> self-hosted MP4 of the same film
    if (v) attrs = { ...attrs, 'data-src': v };
    // the player's still frame (captured from the Vimeo CDN on this page)
    const stills = Object.keys(manifest).filter((u) => u.includes('i.vimeocdn.com/video/') && manifest[u].page === page.route)
      .sort((a, b) => (+(/mw=(\d+)/.exec(b)?.[1] || 0)) - (+(/mw=(\d+)/.exec(a)?.[1] || 0)));
    if (stills.length) attrs = { ...attrs, 'data-poster': pub(stills[0]) };
  }
  if (tag === 'textarea') { const t = kids.join(''); kids = []; attrs = { ...attrs, defaultValue: t }; }
  const props = toProps(tag, attrs);
  const out = [tag, Object.keys(props).length ? props : 0];
  if (!VOID.has(tag)) for (const k of kids) { const c = convert(k, page, tag); if (c !== null && c !== '') out.push(c); }
  return out;
}

// ---------------------------------------------------------------- videos
const videoFiles = fs.readdirSync(videoDir).filter((f) => f.endsWith('.mp4'));
function copyVideo(file) { used.set('video/' + file, path.join(videoDir, file)); return '/media/video/' + file; }
videoFor = (attrs, page) => {
  const mux = /image\.mux\.com\/([A-Za-z0-9]+)/.exec(attrs.poster || '');
  if (mux && videoFiles.includes(`mux-${mux[1]}.mp4`)) return copyVideo(`mux-${mux[1]}.mp4`);
  const own = page.slug + '.mp4';
  if (videoFiles.includes(own)) return copyVideo(own);
  return null;
};

// ---------------------------------------------------------------- run
const b = await chromium.launch();
const ctx = await b.newContext({ javaScriptEnabled: false });
await ctx.route('**/*', (r) => (r.request().url().startsWith('file:') ? r.continue() : r.abort()));
const tab = await ctx.newPage();
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

// The server-rendered HTML also carries the page's data payload (React Server Components stream).
// A few interactive blocks render only their *current* item on the server, so the remaining items
// (featured-project captions, footer scroll facts) are read from that payload.
function rscText(html) {
  const chunks = [...html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)];
  return chunks.map((m) => JSON.parse('"' + m[1] + '"')).join('');
}
function jsonArrayAt(text, key) {
  const out = [];
  let from = 0;
  for (;;) {
    const i = text.indexOf(key, from);
    if (i < 0) return out;
    let d = 0, str = false, esc = false, j = i + key.length - 1;
    for (; j < text.length; j++) {
      const c = text[j];
      if (str) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') str = false; continue; }
      if (c === '"') str = true; else if (c === '[' || c === '{') d++; else if (c === ']' || c === '}') { d--; if (d === 0) break; }
    }
    try { out.push(JSON.parse(text.slice(i + key.length - 1, j + 1))); } catch { /* skip */ }
    from = j;
  }
}
const featuredData = (rsc) => jsonArrayAt(rsc, '"projects":[').filter((a) => a[0]?.clientQuote !== undefined).map((list) => list.map((x) => ({
  title: x.project.title, location: x.project.location, type: x.project.projectType, size: x.project.size,
  slug: x.project.slug, team: x.project.team?.teamName ?? null,
  quote: x.clientQuote, name: x.clientName, position: x.clientPosition,
})));
function attachData(tree, cls, list) {
  let k = 0;
  const walk = (n) => {
    if (!Array.isArray(n)) return;
    if (n[1] && typeof n[1].className === 'string' && n[1].className.split(' ').includes(cls) && list[k]) n[1]['data-items'] = JSON.stringify(list[k++]);
    n.slice(2).forEach(walk);
  };
  walk(tree);
}
const teams = {};
function collectTeams(n) {
  if (!Array.isArray(n)) return;
  const p = n[1] || {};
  if (typeof p.className === 'string' && p.className.includes('team-logo') && p['aria-label'] && !teams[p['aria-label']]) {
    const svg = n.slice(2).find((c) => Array.isArray(c) && c[0] === 'svg');
    if (svg) teams[p['aria-label']] = svg;
  }
  n.slice(2).forEach(collectTeams);
}

const files = fs.readdirSync(ssrDir).filter((f) => f.endsWith('.html')).sort();
const index = [];
let chrome = null;
for (const f of files) {
  const slug = path.basename(f, '.html');
  const route = slug === 'home' ? '/' : '/' + slug.replace('__', '/');
  await tab.goto('file://' + path.resolve(ssrDir, f));
  const raw = await tab.evaluate((ser) => {
    const s = new Function('return ' + ser)();
    const meta = (n) => document.querySelector(`meta[name="${n}"],meta[property="${n}"]`)?.getAttribute('content') || '';
    const main = s('main');
    const r = {
      title: document.title, description: meta('description'), ogImage: meta('og:image'),
      main,
    };
    if (location.pathname.endsWith('/home.html')) {
      const body = [...document.body.children];
      r.chrome = {
        header: s('body > header'),
        cookieBanner: s(body.find((e) => e.className.includes?.('z-[1001]'))),
        cookieDrawer: s(body.find((e) => e.className.includes?.('z-[1003]'))),
        transition: s(body.find((e) => e.className.includes?.('z-[9999]'))),
        footer: s('footer'),
        transitionFrameClass: document.querySelector('#transition-frame')?.getAttribute('class'),
      };
    }
    return r;
  }, serialize.toString());
  const page = { slug, route };
  const tree = convert(raw.main, page, null);
  const rsc = rscText(fs.readFileSync(path.resolve(ssrDir, f), 'utf8'));
  attachData(tree, 'featured-projects-full-bleed', featuredData(rsc));
  collectTeams(tree);
  const og = raw.ogImage ? resolveImage([{ url: raw.ogImage, w: 0 }]) : null;
  const doc = { route, title: raw.title, description: raw.description, ogImage: og, main: tree };
  fs.writeFileSync(path.join(OUT_PAGES, slug + '.json'), JSON.stringify(doc));
  index.push({ slug, route, title: raw.title });
  if (raw.chrome) {
    chrome = {};
    for (const [k, v] of Object.entries(raw.chrome)) chrome[k] = typeof v === 'string' || v === null ? v : convert(v, { slug: 'chrome', route: '/' }, null);
    chrome.scrollFacts = (jsonArrayAt(rsc, '"scrollComparisons":[')[0] || []).map((x) => ({
      distance: x.distance, text: x.text,
      image: x.image?.responsiveImage ? resolveImage([{ url: x.image.responsiveImage.src, w: 196 }]) : null,
      href: x.link?.internalUrl ? `/${x.link.internalUrl._modelApiKey === 'project' ? 'project/' : ''}${x.link.internalUrl.slug}` : x.link?.customUrl || null,
    }));
  }
}
if (liveDir) {
  for (const f of fs.readdirSync(liveDir).filter((x) => x.endsWith('.html'))) {
    await tab.goto('file://' + path.resolve(liveDir, f));
    const raw = await tab.evaluate((ser) => new Function('return ' + ser)()(document.body.firstElementChild), serialize.toString());
    chrome[path.basename(f, '.html')] = convert(raw, { slug: 'chrome', route: '/' }, null);
  }
}
await b.close();
fs.writeFileSync(path.join(ROOT, 'src/content/chrome.json'), JSON.stringify(chrome));
fs.writeFileSync(path.join(ROOT, 'src/content/teams.json'), JSON.stringify(teams));

// Full listings behind "Load More" / filters on /projects and /journal (cards only; pages that are
// not part of the reconstruction link to the original site).
const known = new Set(index.map((r) => r.route));
const linkFor = (route) => (known.has(route) ? route : 'https://www.thirdway.com' + route);
const listing = { projects: [], articles: [] };
{
  const rsc = rscText(fs.readFileSync(path.resolve(ssrDir, 'projects.html'), 'utf8'));
  const list = jsonArrayAt(rsc, '"projects":[').find((a) => a[0]?.projectDate !== undefined) || [];
  listing.projects = list.map((x) => ({
    slug: x.slug, title: x.title, location: x.location, type: x.projectType, size: x.size,
    team: x.team?.teamName ?? null, sectors: (x.categories || []).map((c) => c.title),
    href: linkFor('/project/' + x.slug),
    image: x.image?.url ? resolveImage([{ url: x.image.url + '?auto=format&w=912', w: 912 }]) : null,
  }));
}
{
  const rsc = rscText(fs.readFileSync(path.resolve(ssrDir, 'journal.html'), 'utf8'));
  const list = jsonArrayAt(rsc, '"articles":[').find((a) => a[0]?._firstPublishedAt !== undefined) || [];
  listing.articles = list.map((x) => ({
    slug: x.slug, title: x.title.trim(), date: x._firstPublishedAt,
    href: linkFor('/journal/' + x.slug),
    image: x.featuredImage?.url ? resolveImage([{ url: x.featuredImage.url + '?auto=format&w=680', w: 680 }]) : null,
  }));
}
fs.writeFileSync(path.join(ROOT, 'src/content/listing.json'), JSON.stringify(listing));
fs.writeFileSync(path.join(ROOT, 'src/content/routes.json'), JSON.stringify(index, null, 1));

// fetch media the capture never saw (mobile-only renditions etc.)
const extFix = new Map();
for (const [url, name] of downloads) {
  const tmp = path.join(MEDIA, name + '.tmp');
  let type = 'bin';
  try {
    const hdr = execFileSync('curl', ['-sS', '-L', '--max-time', '60', '-H', 'Accept: image/avif,image/webp,image/*,*/*;q=0.8', '-o', tmp, '-w', '%{content_type}', url]).toString();
    type = extOf(hdr.split(';')[0].trim());
  } catch { console.error('download failed', url); continue; }
  fs.renameSync(tmp, path.join(MEDIA, name + '.' + type));
  extFix.set(name, type);
}
// patch the placeholder extensions written above
for (const f of fs.readdirSync(OUT_PAGES).map((x) => path.join(OUT_PAGES, x)).concat(['chrome.json', 'listing.json'].map((f) => path.join(ROOT, 'src/content', f)))) {
  let s = fs.readFileSync(f, 'utf8');
  if (!s.includes('.__EXT__')) continue;
  s = s.replace(/\/media\/([^"]+?)\.__EXT__/g, (_, n) => `/media/${n}.${extFix.get(n) || 'bin'}`);
  fs.writeFileSync(f, s);
}
// copy captured media that is actually referenced
for (const [name, src] of used) {
  const dst = path.join(MEDIA, name);
  if (!fs.existsSync(dst)) fs.copyFileSync(src, dst);
}
console.log(`pages ${index.length}, media copied ${used.size}, downloaded ${downloads.size}`);
