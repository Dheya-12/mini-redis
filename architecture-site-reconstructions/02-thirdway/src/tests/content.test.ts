import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const CONTENT = path.join(ROOT, "src/content");
const routes: { slug: string; route: string }[] = JSON.parse(fs.readFileSync(path.join(CONTENT, "routes.json"), "utf8"));
const read = (f: string) => fs.readFileSync(path.join(CONTENT, f), "utf8");
const allContent = () => [
  ...routes.map((r) => read(`pages/${r.slug}.json`)),
  read("chrome.json"),
  read("listing.json"),
];

test("every route has a page document with a <main> tree", () => {
  assert.ok(routes.length >= 60);
  for (const r of routes) {
    const doc = JSON.parse(read(`pages/${r.slug}.json`));
    assert.equal(doc.route, r.route);
    assert.equal(doc.main[0], "main", r.route);
    assert.ok(doc.title, r.route);
  }
});

test("all media is self-hosted and present", () => {
  const missing = new Set<string>();
  for (const s of allContent()) {
    assert.ok(!/datocms-assets\.com|image\.mux\.com|vimeocdn\.com/.test(s), "remote media URL left in content");
    for (const m of s.matchAll(/"(\/media\/[^"]+)"/g)) {
      if (!fs.existsSync(path.join(ROOT, "public", m[1]))) missing.add(m[1]);
    }
  }
  assert.deepEqual([...missing], []);
});

test("internal links resolve to generated routes", () => {
  const known = new Set(routes.map((r) => r.route));
  const bad = new Set<string>();
  for (const s of allContent()) {
    for (const m of s.matchAll(/"href":"(\/[^"#?]*)/g)) {
      const href = m[1].replace(/\/$/, "") || "/";
      if (!known.has(href) && !href.startsWith("/media/")) bad.add(href);
    }
  }
  assert.deepEqual([...bad], []);
});

test("listings cover the full archive", () => {
  const listing = JSON.parse(read("listing.json"));
  assert.equal(listing.projects.length, 87);
  assert.equal(listing.articles.length, 27);
  for (const p of listing.projects) assert.match(p.href, /^(\/project\/|https:\/\/www\.thirdway\.com\/project\/)/);
});
