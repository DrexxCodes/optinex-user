/**
 * Every /api/* call is served by optinex-backend (Fastify). Only the path groups this app actually uses are
 * forwarded, so backend-only surfaces (e.g. /api/admin/*) are never reachable through this domain.
 * Cookies set by the backend pass straight through, so they stay host-only on this app's domain.
 */
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:4000').replace(/\/+$/, '');
const API_GROUPS = [
  'auth', 'avatar', 'casino', 'cron', 'investment', 'loans', 'notifications', 'popup', 'referral',
  'streak', 'tasks', 'upgrade', 'uploadthing', 'user', 'utils', 'wallet', 'withdrawal'
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // `:path*` also matches the bare group root (/api/popup, /api/loans, ...).
    const groups = API_GROUPS.map((group) => ({ source: `/api/${group}/:path*`, destination: `${BACKEND_URL}/api/${group}/:path*` }));
    // The backend serves UploadThing at exactly /api/uploadthing and doesn't match a trailing slash, so the bare
    // path gets its own exact rewrite (listed first) instead of relying on `:path*` for it.
    return [{ source: '/api/uploadthing', destination: `${BACKEND_URL}/api/uploadthing` }, ...groups];
  },
  images: {
    // Lets next/image serve SVGs through the optimizer.
    // Your DiceBear <Image> tags currently use `unoptimized`, which already
    // bypasses this — but keeping it configured means SVGs still work
    // correctly if that prop is ever removed, or if you use an <Image> for
    // an SVG elsewhere without `unoptimized`.
    dangerouslyAllowSVG: true,
    // Forces the optimizer to send SVGs with a strict CSP + as an attachment,
    // so an SVG response can't execute inline scripts in the browser. Since
    // your /api/avatar/[seed] route generates the SVGs itself (not user
    // upload), this is low-risk either way, but it's the safe default.
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  }
};

module.exports = nextConfig;