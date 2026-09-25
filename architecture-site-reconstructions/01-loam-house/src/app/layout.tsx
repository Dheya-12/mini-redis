import type { Metadata, Viewport } from "next";
import { cormorant, dmSans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
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
    <html lang="en-AU" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
