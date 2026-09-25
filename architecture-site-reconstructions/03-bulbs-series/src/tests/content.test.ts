import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../..");
const CONTENT = path.join(ROOT, "src/content");
const routes: { slug: string; route: string }[] = JSON.parse(fs.readFileSync(path.join(CONTENT, "routes.json"), "utf8"));
const read = (f: string) => fs.readFileSync(path.join(CONTENT, f), "utf8");
const allContent = () => [...routes.map((r) => read(`pages/${r.slug}.json`)), read("chrome.json")];

test("22 routes: home, about and the 20 products, each with a page view", () => {
  assert.equal(routes.length, 22);
  assert.equal(routes.filter((r) => r.route.startsWith("/products/")).length, 20);
  for (const r of routes) {
    const doc = JSON.parse(read(`pages/${r.slug}.json`));
    assert.equal(doc.route, r.route);
    assert.ok(Array.isArray(doc.view) && doc.view[1]["data-taxi-view"] !== undefined, r.route);
    assert.ok(doc.title, r.route);
  }
});

test("the home gallery has 20 WebGL images and a title per product", () => {
  const home = read("pages/home.json");
  assert.equal((home.match(/"gl-media":"true"/g) || []).length, 20);
  assert.equal((home.match(/"data-product-url":"\/products\//g) || []).length, 20);
  assert.equal((home.match(/"data-taxi-ignore"/g) || []).length, 20);
});

test("all media is self-hosted and present", () => {
  const missing = new Set<string>();
  for (const s of allContent()) {
    assert.ok(!/images\.prismic\.io/.test(s), "remote image URL left in content");
    for (const m of s.matchAll(/"(\/media\/[^"]+)"/g)) if (!fs.existsSync(path.join(ROOT, "public", m[1]))) missing.add(m[1]);
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
