// Server-component helper for "does this visitor look signed in?" — used only to adapt UI (e.g. the landing
// page navbar). It reads the httpOnly cookies the backend set; it never contacts a database or auth provider and
// grants no access: every API call is verified by optinex-backend.
import { cookies } from 'next/headers';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './cookies';
import { isTokenFresh } from './jwt';

export async function isSignedIn(): Promise<boolean> {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  // A refresh cookie means a recoverable session even if the 1h access token has lapsed (proxy.ts renews it
  // as soon as they open the dashboard).
  return !!store.get(REFRESH_COOKIE)?.value || (!!access && isTokenFresh(access));
}
