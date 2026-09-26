import '@/components/pro-airbags-hero/styles.css';
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

export const viewport = { themeColor: '#070709', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400..800&family=Saira:wdth,wght@125,900&display=block" />
      </head>
      <body>{children}</body>
    </html>
  );
}
