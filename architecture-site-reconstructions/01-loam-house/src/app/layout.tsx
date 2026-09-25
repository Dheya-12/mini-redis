import type { Metadata, Viewport } from "next";
import { sans, serif } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loam House — Sandringham",
  description: "Loam House — house-sized residences in Sandringham. Final release now selling.",
  icons: { icon: "/assets/favicon.png" },
  openGraph: {
    type: "website",
    title: "Loam House — Sandringham",
    description: "Loam House — house-sized residences in Sandringham. Final release now selling.",
    images: ["/assets/hero-video/hero-skyline-poster.jpg"],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-AU" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
