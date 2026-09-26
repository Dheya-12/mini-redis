import '@/components/pro-airbags-hero/styles.css';
import '@/components/pro-airbags-hero/responsive.css';
import './globals.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000')),
  title: 'Pro Airbags — Airbag & Safety System Specialists',
  description: 'Airbag repair, SRS module reset, seatbelt repair and programming. OEM-level restraint system service in Detroit — safety restored, drive with confidence.',
  openGraph: {
    title: 'Pro Airbags — Airbag & Safety System Specialists',
    description: 'Airbag repair, SRS module reset, seatbelt repair and programming. Safety restored. Drive with confidence.',
    images: ['/og-plate.jpg'],
  },
};

export const viewport = { themeColor: '#090a0c', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

/* The site below the hero uses the Huly design system: its three compiled stylesheets are served verbatim from
   /assets/css (their @font-face rules resolve ../media/* relative to that folder), and the html carries next/font's
   generated hooks that define --font-inter, --font-esbuild and --font-mono. The hero keeps its own fonts. */
const STYLESHEETS = ['256cc48a980f9a66.css', '2cfc5f73f17d6511.css', '52f44d6bad6353a0.css', 'site.css'];
const PRELOAD_FONTS = ['14d7ce3e41dcbb66-s.p.woff2', '1b0b3615811be75b-s.p.woff2', 'c92e08b531692979-s.p.woff2', 'e4af272ccee01ff0-s.p.woff2', 'e8b276476c0ac6fa-s.p.woff2'];

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="__variable_b38aaf __variable_f367f3 __variable_0aa2f2 overscroll-y-none">
      <head>
        {STYLESHEETS.map(f => <link key={f} rel="stylesheet" href={`/assets/css/${f}`} />)}
        {PRELOAD_FONTS.map(f => <link key={f} rel="preload" href={`/assets/media/${f}`} as="font" crossOrigin="" type="font/woff2" />)}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400..800&family=Saira:wdth,wght@125,900&display=block" />
      </head>
      <body className="overscroll-y-none bg-grey-1">{children}</body>
    </html>
  );
}
