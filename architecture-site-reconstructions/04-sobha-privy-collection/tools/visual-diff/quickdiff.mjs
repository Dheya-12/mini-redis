// quick pixel diff of same-named PNGs in two folders (no metadata needed)
// usage: node quickdiff.mjs <refDir> <tgtDir> [prefix]
import fs from 'node:fs'; import path from 'node:path';
import { PNG } from 'pngjs'; import pixelmatch from 'pixelmatch';
const [a, b, prefix = ''] = process.argv.slice(2);
for (const f of fs.readdirSync(a).filter((f) => f.endsWith('.png') && f.startsWith(prefix)).sort()) {
  if (!fs.existsSync(path.join(b, f))) continue;
  const A = PNG.sync.read(fs.readFileSync(path.join(a, f))), B = PNG.sync.read(fs.readFileSync(path.join(b, f)));
  if (A.width !== B.width || A.height !== B.height) { console.log(f, 'size mismatch'); continue; }
  const n = pixelmatch(A.data, B.data, null, A.width, A.height, { threshold: 0.1, includeAA: false });
  console.log(f.padEnd(40), (100 * n / (A.width * A.height)).toFixed(2) + '%');
}
