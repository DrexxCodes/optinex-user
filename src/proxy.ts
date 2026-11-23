import { NextRequest, NextResponse } from 'next/server';
import { redirectWithCookies, updateSession } from '@/lib/auth/proxySession';

// Route-level gate (UX only — real authorization happens in optinex-backend on every API call).
// `updateSession` checks the session cookie's expiry and, when the short-lived access token has lapsed but the
// refresh cookie is still good, asks the backend to rotate it and re-issues the cookies, so a still-valid
// session is never mistaken for a logged-out one.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const { response, authenticated } = await updateSession(req);
  const isAuthRoute = pathname.startsWith('/auth');

  if (!authenticated && !isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/signin';
    return redirectWithCookies(url, response);
  }

  if (authenticated && isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return redirectWithCookies(url, response);
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/streak/:path*',
    '/tasks/:path*',
    '/investment/:path*',
    '/withdrawal/:path*',
    '/loans/:path*',
    '/casino/:path*',
    '/profile/:path*',
    '/referral/:path*',
    '/transactions/:path*',
    '/upgrade/:path*',
    '/admin/:path*',
    '/auth/:path*'
  ]
};
