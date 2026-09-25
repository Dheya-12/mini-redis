// Summarise compare.mjs reports per route and width as a Markdown table.
// usage: node summary.mjs <diffRoot> 1440 1024 390
import fs from 'node:fs';
import path from 'node:path';
const [root, ...widths] = process.argv.slice(2);
const per = {};
for (const w of widths) {
  const rows = JSON.parse(fs.readFileSync(path.join(root, w, 'report.json'), 'utf8'));
  for (const r of rows) {
    const route = r.frame.replace(/-\d+$/, '');
    const v = parseFloat(r.diff);
    per[route] ??= {};
    per[route][w] ??= [];
    if (!Number.isNaN(v)) per[route][w].push(v);
  }
}
const cell = (a) => (a && a.length ? `${(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2)}% / ${Math.max(...a).toFixed(2)}% (${a.length})` : '—');
console.log(`| Route | ${widths.map((w) => `${w}px mean / worst (frames)`).join(' | ')} |`);
console.log(`|---|${widths.map(() => '---').join('|')}|`);
for (const [route, byW] of Object.entries(per)) console.log(`| ${route} | ${widths.map((w) => cell(byW[w])).join(' | ')} |`);
