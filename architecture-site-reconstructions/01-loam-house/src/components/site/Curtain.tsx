import { WORDMARK } from "@/content/site";

/* eslint-disable @next/next/no-img-element -- static wordmark, blurred/sharpened by the loader */

/** Load curtain markup; `runCurtain` (lib/motion/curtain) drives it. */
export function Curtain() {
  return (
    <div className="curtain" data-curtain aria-hidden>
      <div className="curtain__stripes">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <i key={n} style={{ ["--n" as string]: n }} />
        ))}
      </div>
      <div className="curtain__lockup" data-curtain="lockup">
        <img src={WORDMARK} alt="Loam House" data-curtain="logo" />
        <div className="curtain__pct" data-curtain="pct">
          0
        </div>
      </div>
    </div>
  );
}
