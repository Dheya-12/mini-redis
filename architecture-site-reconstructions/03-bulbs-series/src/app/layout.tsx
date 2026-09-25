import type { Metadata } from "next";
import "./globals.css";
import { loadChrome } from "@/lib/content";
import { renderTree } from "@/lib/tree";
import SiteEffects from "@/components/SiteEffects";

export const metadata: Metadata = {
  title: "Bulbs by Simon Dupety",
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const chrome = loadChrome();
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {renderTree(chrome.preloader)}
        {renderTree(chrome.preloaderSound)}
        {renderTree(chrome.header)}
        <main data-taxi="">{children}</main>
        <SiteEffects />
      </body>
    </html>
  );
}
