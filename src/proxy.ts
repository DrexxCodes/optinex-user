import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/auth/session';

// Route-level gate. This is a fast, edge-friendly check on the access token
// only — full session/refresh handling still lives in the API routes.
//
// IMPORTANT: the access token is short-lived (15m) by design, while the
// refresh token cookie lives for 30 days. Client-side, `authFetch` already
// knows how to silently exchange an expired access token for a new one on a
// 401 (see src/lib/auth/authClient.ts) — but that retry logic only runs
// around *fetch calls*. Every client-side navigation and full page load
// passes through here first, before any component has a chance to make a
// fetch. Previously this function redirected to /auth/signin the instant
// the access token was missing or expired, with no regard for whether a
// valid refresh token existed — so any navigation that happened to land
// more than ~15 minutes after the last token refresh bounced the user to
// the sign-in page even though they had a perfectly valid 30-day session.
// That's the "logged out mid-session" bug.
//
// Fix: only treat the user as logged out when there's no session artifact
// at all (no valid access token AND no refresh token cookie). If a refresh
// token cookie is present but the access token has simply expired, let the
// request through — the page will mount, `authFetch` will hit a 401 on its
// first API call, silently call /api/auth/refresh, and retry. We don't call
// /api/auth/refresh from here directly because that route needs bcrypt +
// the Firestore Admin SDK, which aren't Edge-runtime friendly.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  const hasRefreshToken = !!req.cookies.get(REFRESH_COOKIE)?.value;
  const session = accessToken ? await verifyAccessToken(accessToken) : null;

  const isAuthRoute = pathname.startsWith('/auth');
  const hasSessionArtifact = !!session || hasRefreshToken;

  if (!hasSessionArtifact && !isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/signin';
    return NextResponse.redirect(url);
  }

  // Only bounce away from /auth when the access token itself is verified —
  // not merely because a refresh cookie exists — so someone with an expired
  // (but refreshable) session can still reach /auth/signin instead of being
  // redirect-looped into a dashboard that hasn't refreshed its token yet.
  if (session && isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/streak/:path*',
    '/tasks/:path*',
    '/investment/:path*',
    '/withdrawal/:path*',
    '/casino/:path*',
    '/profile/:path*',
    '/referral/:path*',
    '/transactions/:path*',
    '/upgrade/:path*',
    '/admin/:path*',
    '/auth/:path*'
  ]
};
