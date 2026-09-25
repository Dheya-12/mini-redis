// First diverging texts per frame (matched by content): where does layout start to drift?
// usage: node textdelta.mjs <refDir> <tgtDir> <routePrefix> [maxPerFrame]
import fs from 'node:fs'; import path from 'node:path';
const [a, b, prefix, max = 6] = process.argv.slice(2);
const A = JSON.parse(fs.readFileSync(path.join(a, 'meta.json'))), B = JSON.parse(fs.readFileSync(path.join(b, 'meta.json')));
for (const fa of A.frames.filter((f) => f.name.startsWith(prefix))) {
  const fb = B.frames.find((f) => f.name === fa.name);
  if (!fb) { console.log(fa.name, 'missing'); continue; }
  const out = [];
  for (const t of fa.texts.filter((t) => t.x + t.w > 0)) {
    const m = fb.texts.find((u) => u.t === t.t);
    if (!m) { out.push(`  MISSING ${JSON.stringify(t.t.slice(0, 30))} @${t.x},${t.y}`); continue; }
    const d = ['x', 'y', 'w', 'h'].filter((k) => Math.abs(t[k] - m[k]) > 3).map((k) => `${k} ${t[k]}→${m[k]}`);
    for (const k of ['fs', 'ff', 'lh', 'ls']) if (t[k] !== m[k]) d.push(`${k} ${t[k]}→${m[k]}`);
    if (d.length) out.push(`  ${JSON.stringify(t.t.slice(0, 30))}: ${d.join(', ')}`);
  }
  for (const u of fb.texts) if (!fa.texts.find((t) => t.t === u.t)) out.push(`  EXTRA ${JSON.stringify(u.t.slice(0, 30))} @${u.x},${u.y}`);
  console.log(`${fa.name} y=${fa.actual}/${fb.actual} (${out.length} deltas)`);
  out.slice(0, +max).forEach((l) => console.log(l));
}
