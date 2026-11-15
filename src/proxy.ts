import { NextRequest, NextResponse } from 'next/server';
import { redirectWithCookies, updateSession } from '@/lib/supabase/proxy';

// Route-level gate. `updateSession` validates the Supabase Auth JWT locally and — when the
// short-lived access token has expired but the refresh token is still good — transparently
// refreshes it and re-issues the cookies, so a still-valid session is never mistaken for a
// logged-out one (this replaces the old hand-rolled access/refresh cookie dance).
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
