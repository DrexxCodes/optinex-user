# Cutover guide — Firebase → Supabase

Supabase project: **Incossify** (`uzcvawwvcexoienzxkai`). Schema, RLS lockdown and all functions are already applied.

## 1. Supabase dashboard (2 min)
1. **Authentication → Providers/Sign In:** turn **off** "Allow new users to sign up" (accounts are created only by the server via the admin API). Email confirmation can stay on — the server creates users pre-confirmed.
2. **Project Settings → JWT Keys:** confirm an asymmetric signing key (ES256/RS256) is active (default on new projects). That is what lets `getClaims()` verify tokens locally with zero network calls.
3. **Authentication → Rate Limits:** raise token/refresh limits for your expected traffic (and consider JWT expiry of a few hours instead of 1h) — Pro plan unlocks the higher ceilings.
4. **Project Settings → API Keys:** copy the **service_role / secret** key into `SUPABASE_SERVICE_ROLE_KEY` (both apps + migration script).

## 2. Env vars
Copy `.env.example` in each app. Delete `JWT_ACCESS_SECRET`. Keep only the FCM-related Firebase vars.

## 3. Move the data
```bash
pnpm install
export $(grep -v '^#' .env.migration | xargs)   # Firebase svc account, Supabase url + service key, Upstash
npx tsx scripts/migrate-firebase-to-supabase.ts --dry-run   # reads only
npx tsx scripts/migrate-firebase-to-supabase.ts             # real run
```
- Resumable and idempotent (progress in `migration_state`). Re-running only copies what's missing.
- **Firestore quota:** the import reads your whole DB. If the free quota runs out it stops with exit code 2 — re-run after the daily reset, or switch to Blaze for the day (cents).
- It imports bcrypt password hashes into Supabase Auth, so **passwords keep working**. It re-keys Redis leaderboards/referral sets from old Firestore ids to new user uuids.
- The script prints a verification table (row counts + total wallet balance) at the end.

## 4. Order of operations (avoid losing writes)
Firestore changes made *after* the import are not carried over (existing users' balances are not re-synced). So: pick a quiet window → put the old apps in maintenance (or just deploy fast) → run the import → deploy the new user + admin apps. If you must run it live first, run it once ahead of time, then re-run at cutover only for newly-created users.

## 5. After deploy
- Everyone signs in once (old sessions are invalid). Passwords unchanged.
- Smoke test: sign up (with and without a referral key), sign in, check-in, spin, task, investment → admin approve, withdrawal request → admin reject (wallet refunded), loan apply → stage moves, admin overview.
- When happy: `drop table public.migration_state;`, remove Firebase client/Firestore env, and disable Firestore.

## Notes
- The browser never queries Supabase tables (RLS denies anon/authenticated); it only uses Supabase Auth.
- Analytics day/month/year keys still use the server's local date, same as before.
