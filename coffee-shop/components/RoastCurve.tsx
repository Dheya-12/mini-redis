// Bean-temperature curve from our Tuesday roast of Kii AA, drawn to scale.
const X0 = 56, X1 = 584, Y0 = 24, Y1 = 276;
const T_MAX = 12, C_MIN = 80, C_MAX = 240;

const x = (min: number) => X0 + (min / T_MAX) * (X1 - X0);
const y = (c: number) => Y1 - ((c - C_MIN) / (C_MAX - C_MIN)) * (Y1 - Y0);

const bean: [number, number][] = [
  [0, 200], [0.5, 138], [1, 103], [1.5, 92], [2, 96], [3, 117], [4, 137], [4.67, 150],
  [5, 155], [6, 168], [7, 180], [8, 189.5], [9, 196], [10, 204.5], [11, 212],
];

function smooth(points: [number, number][]) {
  const p = points.map(([t, c]) => [x(t), y(c)] as const);
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i - 1] ?? p[i], b = p[i], c = p[i + 1], e = p[i + 2] ?? c;
    const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6];
    const c2 = [c[0] - (e[0] - b[0]) / 6, c[1] - (e[1] - b[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${c[0].toFixed(1)},${c[1].toFixed(1)}`;
  }
  return d;
}

const events = [
  { t: 1.5, c: 92, label: "Turning point", time: "1:30", dy: 22, anchor: "start" as const },
  { t: 4.67, c: 150, label: "Dry end", time: "4:40", dy: 22, anchor: "start" as const },
  { t: 9, c: 196, label: "First crack", time: "9:00", dy: -16, anchor: "end" as const, key: true },
  { t: 11, c: 212, label: "Drop", time: "11:00", dy: -16, anchor: "end" as const },
];

export default function RoastCurve() {
  const path = smooth(bean);
  const area = `${path} L${x(11)},${Y1} L${x(0)},${Y1} Z`;
  return (
    <figure className="curve">
      <figcaption className="curve__head">
        <span className="label">Roast log · Kii AA · Batch 0412</span>
        <span className="curve__stats">
          <span><b>11:00</b> total</span>
          <span><b>2:00</b> development</span>
          <span><b>18.2%</b> DTR</span>
        </span>
      </figcaption>
      <div className="curve__svg">
        <svg viewBox="0 0 600 310" role="img" aria-label="Bean temperature rising from a 92 °C turning point at 1:30 to first crack at 196 °C at 9:00, dropped at 212 °C at 11:00.">
          <defs>
            <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--crema)" stopOpacity="0.28" />
              <stop offset="1" stopColor="var(--crema)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[100, 150, 200].map((c) => (
            <g key={c}>
              <line x1={X0} x2={X1} y1={y(c)} y2={y(c)} className="grid" />
              <text x={X0 - 10} y={y(c) + 4} textAnchor="end" className="tick">{c}°</text>
            </g>
          ))}
          {[0, 2, 4, 6, 8, 10, 12].map((t) => (
            <text key={t} x={x(t)} y={Y1 + 22} textAnchor="middle" className="tick">{t}:00</text>
          ))}
          <line x1={X0} x2={X1} y1={Y1} y2={Y1} className="axis" />
          <rect x={x(9)} y={Y0} width={x(11) - x(9)} height={Y1 - Y0} className="dev" />
          <text x={x(10)} y={Y1 - 10} textAnchor="middle" className="tick dev__label">development</text>
          <path d={area} fill="url(#curveFill)" />
          <path d={path} className="bean-temp" pathLength={1} />
          {events.map((e) => (
            <g key={e.label} className={e.key ? "event event--key" : "event"}>
              <circle cx={x(e.t)} cy={y(e.c)} r={e.key ? 6 : 4} />
              <text x={x(e.t) + (e.anchor === "start" ? 10 : -10)} y={y(e.c) + e.dy} textAnchor={e.anchor} className="event__label">
                {e.label} <tspan className="event__time">{e.time} · {e.c}°C</tspan>
              </text>
            </g>
          ))}
        </svg>
      </div>
    </figure>
  );
}
