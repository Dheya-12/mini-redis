// Style extractor (build-time tool, not shipped to the browser).
//
// The original is styled by a custom CSS framework (≈500 classes, aspect-ratio-aware breakpoints) rather than a
// utility framework we could regenerate. Like the markup, its public stylesheets are treated as captured data:
// this tool keeps only the rules whose selectors can match the markup of these three routes (plus the state classes
// their behaviour adds at runtime), rewrites asset URLs to the self-hosted copies, drops the commercial @font-face
// rules (see src/app/fonts.css) and writes one stylesheet. Rules of the route stylesheets are scoped to their route
// with `:where(html[data-page="…"])`, which adds no specificity, so all routes can share one stylesheet.
//
// usage: node tools/extract-styles.mjs <cssDir> <ssrDir>
//   <cssDir> holds global.css, landing.css, location.css, privacy-policy.css as served by the site
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

const [cssDir, ssrDir] = process.argv.slice(2);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

// ---------------------------------------------------------------- the class vocabulary
const known = new Set();
for (const f of fs.readdirSync(ssrDir).filter((x) => x.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(ssrDir, f), 'utf8');
  for (const m of html.matchAll(/\sclass="([^"]*)"/g)) for (const c of m[1].split(/\s+/)) if (c) known.add(c);
}
// state classes the original's behaviour adds (and that src/behaviours reproduces)
const STATE = `animation--block animation--fast animation--height animation--slow carousel--not-ready carousel--ready
content-animation--ready cursor--left cursor--right disable-smooth-scrolling has-hover has-scroll-init
has-scroll-scrolling has-scroll-smooth header--collapsed header--hidden header--hidden-slow header--top is-active
is-disabled is-focused is-form-loading is-hidden is-inview is-invisible is-invisible--js is-invisible--md-up-js is-ios
is-not-empty is-ready is-seen is-splitting l-location-mobile-card--expanded l-three-worlds-sticky__explore-progress--hidden
location-pin--hidden modal--animating-out no-hover no-scroll-smooth not-ready page-transition-content with-cookie-consent
with-modal word--shy words lines chars splitting js no-js is-win form-control--error form-control--valid form-label--active
char word line line-wrap word-wrap word-nowrap-spacer text-nowrap whitespace page-overlay tooltip tooltip__animation
tooltip__content tooltip__triangle js-tooltip-text animation disable-transitions`.split(/\s+/);
for (const c of STATE) known.add(c);
const statePrefix = /^(is|has|with|no|not|js)-|^animation--|^reveal--|^is-slide-/;
const classOk = (c) => known.has(c) || statePrefix.test(c);

const unescapeClass = (s) => s.replace(/\\(.)/g, '$1');
const classesOf = (sel) => [...sel.matchAll(/\.((?:\\.|[a-zA-Z0-9_-])+)/g)].map((m) => unescapeClass(m[1]));

// ---------------------------------------------------------------- url rewriting
const rewriteUrls = (v) => v.replace(/url\((['"]?)(\/assets\/images\/(?:media\/)?)([^'")?#]+)(?:\?[^'")#]*)?(#[^'")]*)?\1\)/g, (_, q, _p, rest, hash) => `url(${q}/media/${rest}${hash || ''}${q})`);

// ---------------------------------------------------------------- font stacks
const FALLBACK = { 'TT Commons Pro': 'TT Commons Pro Fallback', 'TT Ramillas': 'TT Ramillas Fallback', 'altesse-std-64pt': 'Altesse Fallback', 'altesse-std-24pt': 'Altesse Fallback' };
const withFallbacks = (v) => v.replace(/(["']?)(TT Commons Pro|TT Ramillas|altesse-std-(?:64|24)pt)\1/g, (m, q, fam) => `${m}, "${FALLBACK[fam]}"`);

// ---------------------------------------------------------------- scoping of route stylesheets
function scope(selector, page) {
  const where = `html[data-page="${page}"]`;
  const s = selector.trim();
  // selectors that start at the root element carry the page attribute themselves
  const root = s.match(/^(html|:root)((?:[.#[:][^\s>+~]*)?)(.*)$/);
  if (root) return `html${root[2]}:where([data-page="${page}"])${root[3]}`;
  return `:where(${where}) ${s}`;
}

// ---------------------------------------------------------------- run
const stats = { kept: 0, dropped: 0 };
const out = [];
for (const [file, page] of [['global.css', null], ['landing.css', 'home'], ['location.css', 'location'], ['privacy-policy.css', 'privacy-policy']]) {
  const root = postcss.parse(fs.readFileSync(path.join(cssDir, file), 'utf8'), { from: file });
  root.walkAtRules('font-face', (r) => r.remove());
  root.walkAtRules('charset', (r) => r.remove());
  root.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
    const selectors = rule.selectors.filter((s) => classesOf(s).every(classOk));
    stats.dropped += rule.selectors.length - selectors.length;
    stats.kept += selectors.length;
    if (!selectors.length) { rule.remove(); return; }
    rule.selectors = page ? selectors.map((s) => scope(s, page)) : selectors;
  });
  root.walkDecls((d) => { if (d.value.includes('url(')) d.value = rewriteUrls(d.value); });
  // the commercial families are not redistributed: each stack gains its metric-matched open-licence stand-in
  root.walkDecls(/^font(-family)?$/, (d) => { d.value = withFallbacks(d.value); });
  // remove at-rules left empty
  let changed = true;
  while (changed) { changed = false; root.walkAtRules((a) => { if (a.nodes && a.nodes.length === 0) { a.remove(); changed = true; } }); }
  out.push(`/* ---- ${file}${page ? ` (scoped to ${page})` : ''} ---- */\n` + root.toResult({ map: false }).css.trim());
}
const header = `/*
 * GENERATED by tools/extract-styles.mjs from the public stylesheets of sobha-privy-collection.com
 * (global.css, landing.css, location.css, privacy-policy.css), filtered to the rules these routes use.
 * Do not edit by hand: overrides and additions for this reconstruction live in src/app/globals.css.
 */
`;
fs.mkdirSync(path.join(ROOT, 'src/styles'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'src/styles/site.css'), header + out.join('\n\n') + '\n');
console.log(`selectors kept ${stats.kept}, dropped ${stats.dropped}; ${(fs.statSync(path.join(ROOT, 'src/styles/site.css')).size / 1024).toFixed(0)} KB`);
