import localFont from 'next/font/local';

// Self-hosted Inter & Sora — previously loaded via next/font/google, which
// calls out to fonts.googleapis.com at build/dev time. Any environment
// without outbound access to Google's CDN (offline dev, sandboxed CI,
// restrictive corporate networks) would fail that request and silently fall
// back to a system font. Bundling the woff2 files locally removes the
// network dependency entirely — zero external requests, works offline.
export const sora = localFont({
  src: [
    { path: '../../public/fonts/sora-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/sora-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/sora-latin-700-normal.woff2', weight: '700', style: 'normal' },
    { path: '../../public/fonts/sora-latin-800-normal.woff2', weight: '800', style: 'normal' }
  ],
  variable: '--font-sora',
  display: 'swap'
});

export const inter = localFont({
  src: [
    { path: '../../public/fonts/inter-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: '../../public/fonts/inter-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: '../../public/fonts/inter-latin-600-normal.woff2', weight: '600', style: 'normal' },
    { path: '../../public/fonts/inter-latin-700-normal.woff2', weight: '700', style: 'normal' }
  ],
  variable: '--font-inter',
  display: 'swap'
});
