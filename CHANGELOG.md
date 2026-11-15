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
