import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const CONTENT = path.join(ROOT, "src/content");
const routes: { slug: string; route: string; sheet: string }[] = JSON.parse(fs.readFileSync(path.join(CONTENT, "routes.json"), "utf8"));
const read = (f: string) => fs.readFileSync(path.join(CONTENT, f), "utf8");
const allContent = () => [...routes.map((r) => read(`pages/${r.slug}.json`)), read("chrome.json")];
const source = (f: string) => fs.readFileSync(path.join(ROOT, "src", f), "utf8");

test("five routes, each with a page view and its stylesheet scope", () => {
  assert.deepEqual(routes.map((r) => r.route), ["/", "/location", "/privacy-policy", "/privacy-policy-uk-eu", "/data-protection-policy"]);
  for (const r of routes) {
    const doc = JSON.parse(read(`pages/${r.slug}.json`));
    assert.equal(doc.route, r.route);
    assert.equal(doc.sheet, r.sheet);
    assert.ok(["home", "location", "privacy-policy"].includes(doc.sheet), r.route);
    assert.equal(doc.view[1]["data-barba"], "container", r.route);
    assert.ok(doc.title, r.route);
  }
  assert.ok(source("styles/site.css").includes(':where(html[data-page="privacy-policy"])'));
});

test("all media is self-hosted and present (except the three images missing on the original)", () => {
  const known = new Set((JSON.parse(read("missing-media.json")) as string[]).map((m) => "/media/" + m));
  const missing = new Set<string>();
  for (const s of allContent()) {
    assert.ok(!/sobha-privy-collection\.com\/assets|kinescope\.io/.test(s), "remote media URL left in content");
    for (const m of s.matchAll(/\/media\/[^"\s,)]+/g)) {
      const file = m[0].replace(/#.*/, "");
      if (!known.has(file) && !fs.existsSync(path.join(ROOT, "public", file))) missing.add(file);
    }
  }
  assert.deepEqual([...missing], []);
});

test("every film is a local muted loop", () => {
  const films = allContent().join("").match(/\["video",\{[^}]*\}/g) ?? [];
  assert.ok(films.length >= 11);
  for (const f of films) {
    assert.match(f, /"className":"film"/);
    assert.match(f, /"src":"\/media\/films\/[\w]+\.mp4"/);
    assert.match(f, /"muted":true/);
  }
});

test("every plugin in the markup has a behaviour", () => {
  const implemented = new Set([
    "appear", "parallax", "reveal", "stickySlider", "themed", "topHeader", "hideHeader", "contentAnimation", "iframeSize",
    "modal", "modalHeaderClass", "modalHash", "modalHideHeader", "menuLinks", "cursor", "maskText", "mobileScrollable",
    "mapActivePin", "mapCardToggle", "cookieConsent", "utmSave", "preloader", "preloaderIntro", "navigation",
    "threeWorldsWebGl", "carouselWebGl", "locationWebGl",
  ]);
  const used = new Set<string>();
  for (const s of allContent()) for (const m of s.matchAll(/"data-plugin":"([^"]*)"/g)) m[1].split(/\s+|\\n/).filter(Boolean).forEach((p) => used.add(p));
  assert.deepEqual([...used].filter((p) => !implemented.has(p)), []);
});

test("every parallax pattern named in the markup is defined", () => {
  const defined = new Set([...source("behaviours/parallax/patterns.ts").matchAll(/^\s{2}(\w+): /gm)].map((m) => m[1]));
  const used = new Set<string>();
  for (const s of allContent()) for (const m of s.matchAll(/"data-parallax-pattern":"([^"]*)"/g)) m[1].split(/\s+/).filter(Boolean).forEach((p) => used.add(p));
  assert.ok(used.size > 30);
  assert.deepEqual([...used].filter((p) => !defined.has(p)), []);
});

test("internal links resolve to generated routes or in-page targets", () => {
  const known = new Set(routes.map((r) => r.route));
  const bad: string[] = [];
  for (const r of routes) {
    const s = read(`pages/${r.slug}.json`);
    const ids = new Set([...s.matchAll(/"id":"([^"]+)"/g)].map((m) => m[1]));
    for (const m of s.matchAll(/"href":"([^"]+)"/g)) {
      const href = m[1];
      if (/^(https?:|mailto:|tel:)/.test(href) || href.startsWith("/media/")) continue;
      const [p, hash] = href.split("#");
      if (p && !known.has(p.replace(/\/+$/, "") || "/")) bad.push(`${r.route}: ${href}`);
      if (hash && !p && !ids.has(hash)) bad.push(`${r.route}: ${href}`);
    }
  }
  assert.deepEqual(bad, []);
});

test("the location scene's model and textures are present", () => {
  const gltf = JSON.parse(fs.readFileSync(path.join(ROOT, "public/webgl/location/model.gltf"), "utf8"));
  for (const b of gltf.buffers) assert.ok(fs.existsSync(path.join(ROOT, "public/webgl/location", b.uri)), b.uri);
  for (const i of gltf.images) assert.ok(fs.existsSync(path.join(ROOT, "public/webgl/location", i.uri)), i.uri);
  const names = new Set(gltf.nodes.map((n: { name: string }) => n.name));
  for (const n of [0, 1, 2, 3]) assert.ok(names.has(`Camera_Position_${n}`) && names.has(`Target_Position_${n}`));
});
