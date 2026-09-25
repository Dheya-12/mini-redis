// usage: node compare.mjs <refDir> <tgtDir> <outDir> [--threshold 0.1]
import fs from 'node:fs'; import path from 'node:path';
import { PNG } from 'pngjs'; import pixelmatch from 'pixelmatch';
const [refDir, tgtDir, outDir] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const ref = JSON.parse(fs.readFileSync(path.join(refDir, 'meta.json')));
const tgt = JSON.parse(fs.readFileSync(path.join(tgtDir, 'meta.json')));
const rows = [];
for (const rf of ref.frames) {
  const tf = tgt.frames.find(f => f.name === rf.name) || tgt.frames.find(f => f.name.slice(0, 3) === rf.name.slice(0, 3));
  if (!tf) { rows.push({ frame: rf.name, diff: 'missing' }); continue; }
  const a = PNG.sync.read(fs.readFileSync(path.join(refDir, rf.name + '.png')));
  const b = PNG.sync.read(fs.readFileSync(path.join(tgtDir, tf.name + '.png')));
  const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
  const crop = (img) => { if (img.width === w && img.height === h) return img.data; const o = Buffer.alloc(w * h * 4); for (let y = 0; y < h; y++) img.data.copy(o, y * w * 4, y * img.width * 4, y * img.width * 4 + w * 4); return o; };
  const diff = new PNG({ width: w, height: h });
  const n = pixelmatch(crop(a), crop(b), diff.data, w, h, { threshold: 0.1, includeAA: false, alpha: 0.3 });
  fs.writeFileSync(path.join(outDir, rf.name + '-diff.png'), PNG.sync.write(diff));
  // text geometry: match by text content
  const deltas = [];
  for (const t of rf.texts) {
    const m = tf.texts.find(u => u.t === t.t && u.tag === t.tag) || tf.texts.find(u => u.t === t.t);
    if (!m) { deltas.push(`MISSING ${JSON.stringify(t.t)} @${t.x},${t.y}`); continue; }
    const d = [];
    for (const k of ['x', 'y', 'w', 'h']) if (Math.abs(t[k] - m[k]) > 2) d.push(`${k} ${t[k]}→${m[k]}`);
    const norm = v => v;
    for (const k of ['fs', 'ff', 'fw', 'fst', 'ls', 'lh', 'c']) if (norm(t[k]) !== norm(m[k])) d.push(`${k} ${t[k]}→${m[k]}`);
    if (Math.abs(t.op - m.op) > 0.1) d.push(`op ${t.op}→${m.op}`);
    if (d.length) deltas.push(`${JSON.stringify(t.t.slice(0, 28))}: ${d.join(', ')}`);
  }
  for (const u of tf.texts) if (!rf.texts.find(t => t.t === u.t)) deltas.push(`EXTRA ${JSON.stringify(u.t)} @${u.x},${u.y}`);
  rows.push({ frame: rf.name, y: `${rf.actual}/${tf.actual}`, diff: (100 * n / (w * h)).toFixed(2) + '%', deltas });
}
for (const r of rows) {
  console.log(`${r.frame.padEnd(18)} ${String(r.y).padEnd(12)} ${r.diff}`);
  if (process.argv.includes('--text')) for (const d of r.deltas || []) console.log('     ' + d);
}
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(rows, null, 1));
