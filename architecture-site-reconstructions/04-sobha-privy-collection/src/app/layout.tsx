import type { Metadata } from "next";
import "./globals.css";
import { loadChrome } from "@/lib/content";
import { renderTree } from "@/lib/tree";
import SiteEffects from "@/components/SiteEffects";

export const metadata: Metadata = {
  title: "Sobha Privy Collection – Luxury Villas & Penthouses in Dubai",
  icons: {
    icon: [
      { url: "/manifest/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/manifest/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/manifest/apple-touch-icon.png",
  },
};

/**
 * Runs before first paint: the same root classes the original sets from its <head>, the native-scroll mode of its
 * stylesheet (sections clip with clip-path, so sticky layers work on the window), and the route name that scopes each
 * route's stylesheet (see tools/extract-styles.mjs).
 */
const BOOT = `(function(){var d=document.documentElement;d.classList.remove('no-js');d.classList.add('js','no-scroll-smooth');
if(navigator.platform.toUpperCase().indexOf('WIN')>=0)d.classList.add('is-win');
if(!matchMedia('(hover: hover)').matches){d.classList.remove('has-hover');d.classList.add('no-hover');}
var p=location.pathname.replace(/\\/+$/,'');d.setAttribute('data-page',p?p.slice(1):'home');})();`;

/** the cookie dialog stays hidden once a choice has been stored (as on the original) */
const COOKIE = `(function(){var c=document.cookie,e=document.querySelector('#cookie-consent');
if((c.indexOf('cookieConsentStatus=1')!==-1||c.indexOf('cookieConsentStatus=0')!==-1)&&e){e.classList.add('is-hidden')}
else{document.documentElement.classList.add('with-cookie-consent')}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const chrome = loadChrome();
  return (
    <html lang="en" dir="ltr" className="has-hover no-js not-ready" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body data-barba="wrapper" suppressHydrationWarning>
        {renderTree(chrome.skip)}
        {renderTree(chrome.preloader)}
        {renderTree(chrome.preloaderIntro)}
        {children}
        {renderTree(chrome.cookie)}
        <script dangerouslySetInnerHTML={{ __html: COOKIE }} />
        {renderTree(chrome.turn)}
        <SiteEffects />
      </body>
    </html>
  );
}
