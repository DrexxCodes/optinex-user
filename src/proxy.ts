import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { ACCESS_COOKIE } from '@/lib/auth/session';

// Route-level gate. This is a fast, edge-friendly check on the access token
// only — full session/refresh handling still lives in the API routes.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const session = token ? await verifyAccessToken(token) : null;

  const isAuthRoute = pathname.startsWith('/auth');

  if (!session && !isAuthRoute) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/signin';
    return NextResponse.redirect(url);
  }

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
