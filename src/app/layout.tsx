import type { Metadata, Viewport } from 'next';
import { sora, inter } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Incossify Africa',
  description: 'Earn, grow, and invest with Incossify.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Incossify Africa'
  }
};

export const viewport: Viewport = {
  themeColor: '#9D0EB3',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
