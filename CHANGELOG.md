# Changelog — API extracted to optinex-backend (user app)

## What changed
- **No database or service code left in this app.** All 38 route handlers under `src/app/api/**` were ported to the Fastify service `optinex-backend` at the same URLs. `next.config.js` now rewrites `/api/<group>/*` to `BACKEND_URL`, so every existing `authFetch('/api/...')` call works unchanged and session cookies stay same-origin (no CORS).
- **Auth no longer touches Supabase from the browser.**
  - `src/lib/auth/clientAuth.ts`: sign-in/sign-up are single calls to the backend, which verifies credentials, sets the httpOnly `optinex_at` / `optinex_rt` cookies and runs the post-login work (analytics + investment catch-up). Sign-up now also signs the user in server-side (`signedIn` flag decides the redirect).
  - `src/lib/auth/proxySession.ts` (new, replaces `src/lib/supabase/proxy.ts`): `proxy.ts` peeks at the cookie expiry and, if lapsed, asks the backend to rotate it, copying the new cookies onto the request and response. Dead refresh token → cookies cleared + redirect to sign-in. Backend outage → session kept (nobody is logged out by an outage). This is a UX gate only; the backend verifies every API call.
  - `src/lib/auth/session.ts`: `getSessionUser()` → `isSignedIn()` (reads cookies, no network) for the landing-page navbar.
  - `src/lib/auth/{cookies,jwt,setCookie}.ts`, `src/lib/api/backend.ts`: small helpers for the above.
- **Uploads:** `src/lib/uploadthing.ts` no longer imports the (deleted) server router type; the router lives in the backend (`paymentReceipt` endpoint). Set `UPLOADTHING_CALLBACK_URL=<this app's domain>/api/uploadthing` on the backend.
- Rewrites are an allow-list, so backend-only surfaces such as `/api/admin/*` are not reachable through this domain.

## Fixes
- `src/components/landing/Testimonials.tsx`: removed a stray `import { s } from "@upstash/redis"` (unused, and `s` is not an export) that pulled a server SDK into a client-facing component and broke the type-check.

## Removed
- `src/app/api/**` (all routes), `src/lib/supabase/**`, `src/lib/db/**`, `src/lib/firebase/admin.ts`, `src/lib/redis.ts`, `src/lib/rateLimit.ts`, `src/lib/paystack.ts`, `src/lib/investmentReturns.ts`, `src/lib/referral.ts`, `src/lib/refGenerator.ts`, `src/lib/analytics.ts`, `src/lib/dicebear.ts`, `src/lib/loans/eligibility.ts`, `src/lib/withdrawal/eligibility.ts`, `src/app/lib/{redis,dicebear}.ts` (dead Spotix leftovers).
- `scripts/` (one-off Firebase→Supabase migration tools) moved to `optinex-backend/scripts/`, which owns those dependencies.
- Dependencies: `@supabase/ssr`, `@supabase/supabase-js`, `@upstash/redis`, `firebase-admin`, `@dicebear/core`, `@dicebear/collection`. (`firebase` stays for browser push registration; `uploadthing` stays for client types.)
- Env: only `BACKEND_URL` (+ the public Firebase messaging keys) remain; see `.env.example`.

## Verified
`tsc --noEmit` and `next build` pass (0 API routes remain). Booted against the real backend: sign-in sets cookies through the rewrite, `/api/user/me` works with them, expired access cookie is rotated by the proxy, dead refresh token clears cookies and redirects, logout invalidates the session.

---

# Changelog — Firebase → Supabase migration (user app)

## What changed
- **Database:** every Firestore read/write in the API routes now goes to Supabase Postgres via `src/lib/supabase/admin.ts` (service-role client; all tables are RLS-locked so only these routes can touch data — same trust model as firebase-admin before).
- **Auth:** Supabase Auth replaces the custom bcrypt + JWT + refresh-token cookies.
  - Sign-in/refresh run in the browser (`src/lib/auth/clientAuth.ts`, `src/lib/supabase/client.ts`) so Supabase's per-IP auth rate limits apply per *user*, not to your one server IP. `POST /api/auth/signin` is now the post-login hook (analytics + investment catch-up).
  - Sign-up is still `POST /api/auth/signup` (creates the Auth user + profile + referral bonus atomically), then the browser signs in.
  - `getSessionUser()` keeps the same return shape, so no other route needed auth changes. JWTs are verified locally (`getClaims`) — no network hop per request.
  - `proxy.ts` now refreshes expired sessions itself via `@supabase/ssr`.
- **Atomic money logic moved into Postgres functions** (row-locked, one round trip each): `create_profile` (signup + referral bonus), `complete_task`, `daily_checkin`, `spin`, `request_withdrawal`, `create_loan`, `credit_investment_returns`, `credit_wallet`, etc. Fewer round trips = lower latency than the old multi-read Firestore transactions.
- **Redis is untouched** (leaderboards, rate limits, investment cursor). **FCM is kept for push delivery only**; device tokens now live in `push_tokens`.
- Wallet history cursor pagination now uses a numeric row id (still opaque to the UI).
- Casino score: the profile high score is only written when the leaderboard score actually improves (fewer writes).
- Removed `bcryptjs`, `jose`, `src/lib/auth/jwt.ts`; added `@supabase/supabase-js`, `@supabase/ssr`.
- Dev/ops: `scripts/migrate-firebase-to-supabase.ts` (resumable data import), `.env.example`.

## Files touched
Added: `src/lib/supabase/*`, `src/lib/db/*`, `src/lib/auth/clientAuth.ts`, `scripts/migrate-firebase-to-supabase.ts`, `.env.example`
Rewritten: `src/proxy.ts`, `src/lib/auth/session.ts`, `src/lib/analytics.ts`, `src/lib/investmentReturns.ts`, `src/lib/referral.ts`, `src/lib/withdrawal/eligibility.ts`, `src/lib/loans/{eligibility,config}.ts`, `src/lib/firebase/{admin,client}.ts`, all `src/app/api/**` routes that touched Firestore/auth, `src/app/auth/{signin,signup}/page.tsx` (call the new auth helpers; UI unchanged), `package.json`
Deleted: `src/lib/auth/jwt.ts`

## Behaviour notes
- Everyone is signed out once at cutover (old cookies are not valid Supabase sessions). Passwords keep working — the bcrypt hashes are imported.
- Auth cookies are now the standard `sb-…` Supabase cookies (readable by JS, as Supabase SSR requires) instead of custom httpOnly cookies.
- `/api/cron/investment-returns` (legacy flat-2% route) is ported as-is; it double-pays alongside the login-time 10% logic, so leave it unscheduled unless intended.
- Loan eligibility is checked just before the atomic one-pending-loan lock instead of inside the same transaction (the lock itself is still atomic).
