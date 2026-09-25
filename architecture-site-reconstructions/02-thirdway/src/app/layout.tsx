import type { Metadata, Viewport } from "next";
import "./globals.css";
import { loadChrome } from "@/lib/content";
import { renderTree, type TreeNode, type TreeProps } from "@/lib/tree";
import SiteEffects from "@/components/SiteEffects";
import IntroLoader from "@/components/IntroLoader";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.thirdway.com"),
  title: "Thirdway",
  icons: { icon: "/favicon.png", apple: "/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#f7f1e9",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** The contact dialog is captured open; ship it closed (the chrome behaviour opens it). */
function closedModal(node: TreeNode): TreeNode {
  if (typeof node === "string") return node;
  const [tag, props, ...kids] = node;
  const p = (props || {}) as TreeProps;
  return [tag, { ...p, "data-contact-modal": "true", "aria-hidden": "true", className: `${p.className ?? ""} pointer-events-none`, style: { opacity: 0, visibility: "hidden" } }, ...kids];
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const chrome = loadChrome();
  return (
    <html lang="en" className="font-sans antialiased" suppressHydrationWarning>
      <head>
        {/* first paint on the home page shows the intro sheet instead of a flash of content */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if(location.pathname==="/"&&!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.intro="1"`,
          }}
        />
      </head>
      <body>
        <a
          id="skip-to-content-link"
          href="#main"
          className="body-regular fixed top-0 left-[-200px] z-400 bg-warm-black p-[15px] text-warm-white transition-all duration-300 ease-in-out outline-none focus:left-0"
        >
          Skip to content
        </a>
        <a
          id="skip-to-footer-link"
          href="#footer"
          className="body-regular fixed top-0 left-[-200px] z-400 bg-warm-black p-[15px] text-warm-white transition-all duration-300 ease-in-out outline-none focus:left-0"
        >
          Skip to footer
        </a>
        {renderTree(chrome.header)}
        <div id="smooth-wrapper" className="relative">
          <div id="smooth-content">
            <div id="transition-frame" className="pt-[var(--header-space)]">
              {children}
            </div>
            {renderTree(chrome.footer)}
          </div>
        </div>
        {renderTree(chrome.cookieBanner)}
        {renderTree(chrome.cookieDrawer)}
        {renderTree(chrome.transition)}
        {renderTree(closedModal(chrome.contact))}
        <IntroLoader />
        <SiteEffects facts={chrome.scrollFacts} />
      </body>
    </html>
  );
}
