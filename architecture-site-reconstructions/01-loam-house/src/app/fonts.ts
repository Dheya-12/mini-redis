import localFont from "next/font/local";

/**
 * Self-hosted copies of the two Google families the original site loads.
 * Both are variable fonts, so a single file covers every weight in use
 * (serif 300–500 roman + 300–400 italic, sans 300–600).
 */
export const serif = localFont({
  src: [
    { path: "./fonts/CormorantGaramond-Variable.woff2", weight: "300 700", style: "normal" },
    { path: "./fonts/CormorantGaramond-Italic-Variable.woff2", weight: "300 700", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

export const sans = localFont({
  src: [{ path: "./fonts/DMSans-Variable.woff2", weight: "100 1000", style: "normal" }],
  variable: "--font-dmsans",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});
