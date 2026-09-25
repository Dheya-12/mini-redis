import type { SVGProps } from "react";

const stroke: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

/** Tray with a downward arrow; the arrow group bobs on hover. */
export function DownloadIcon({ arrowClassName }: { arrowClassName?: string }) {
  return (
    <svg {...stroke}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <g className={arrowClassName}>
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </g>
    </svg>
  );
}

const CALENDAR_DOTS = ["M8 14h.01", "M12 14h.01", "M16 14h.01", "M8 18h.01", "M12 18h.01", "M16 18h.01"];

/** Calendar whose six day-dots pop in sequence on hover. */
export function CalendarIcon({ dotClassName }: { dotClassName?: string }) {
  return (
    <svg {...stroke}>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      {CALENDAR_DOTS.map((d, i) => (
        <path key={d} className={dotClassName} style={{ ["--i" as string]: i }} d={d} />
      ))}
    </svg>
  );
}

/** Four-corner "expand" glyph; `direction` flips the arrows to contract. */
export function JourneyIcon({ direction }: { direction: "out" | "back" }) {
  const out = direction === "out";
  return (
    <svg {...stroke}>
      <g className="journey-btn__corner journey-btn__corner--tr">
        <polyline points={out ? "15 3 21 3 21 9" : "20 10 14 10 14 4"} />
        <line x1={out ? 21 : 14} y1={out ? 3 : 10} x2={out ? 14 : 21} y2={out ? 10 : 3} />
      </g>
      <g className="journey-btn__corner journey-btn__corner--bl">
        <polyline points={out ? "9 21 3 21 3 15" : "4 14 10 14 10 20"} />
        <line x1={3} y1={21} x2={10} y2={14} />
      </g>
    </svg>
  );
}
