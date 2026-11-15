// Daily investment returns — runs inline whenever a user logs in (or their session is refreshed),
// so there's no external scheduler to babysit.
//
// Flow for a given user:
//   1. Bail out fast if they're on the Free plan or have no package.
//   2. Look up the package's price to get the 10%/day return amount.
//   3. Figure out where we left off — Redis first (fast path). If Redis has nothing (cold cache,
//      expired TTL, first run ever), fall back to `last_investment_return_at` on the profile (or
//      `package_started_at` for a brand new package) and write it back to Redis.
//   4. Credit one wallet transaction per missed day, capped at MAX_BACKLOG_DAYS (10) and at the
//      package's own expiry — whichever is sooner. Older backlog is forfeited, not paid.
//   5. If the package has expired, flip the user back to the Free plan.
import { supabaseAdmin } from '@/lib/supabase/admin';
import { cacheGet, cacheSet } from '@/app/lib/redis';
import type { Row } from '@/lib/db/format';

const DAILY_RETURN_PERCENTAGE = 10; // 10% of the package price, per day
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30;
const MAX_BACKLOG_DAYS = 10;

function lastReturnCacheKey(uid: string) {
  return `investment:lastReturn:${uid}`;
}

export type SyncResult =
  | { status: 'no-package' }
  | { status: 'up-to-date' }
  | { status: 'credited'; days: number; totalCredited: number }
  | { status: 'expired'; daysCredited: number; totalCredited: number };

/**
 * `preloadedUser` is the caller's already-fetched `profiles` row (signin and refresh both have
 * one) — pass it to skip a second read. Omit it to fetch fresh.
 */
export async function syncInvestmentOnLogin(uid: string, preloadedUser?: Row): Promise<SyncResult> {
  let user: Row;
  if (preloadedUser) {
    user = preloadedUser;
  } else {
    const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (!data) return { status: 'no-package' };
    user = data;
  }

  if (!user.package_id || user.package_status === 'Free') return { status: 'no-package' };

  const { data: pkg } = await supabaseAdmin.from('packages').select('price').eq('id', user.package_id).maybeSingle();
  if (!pkg) return { status: 'no-package' };

  const cost = Number(pkg.price ?? 0);
  const dailyReturn = Math.round(((cost * DAILY_RETURN_PERCENTAGE) / 100) * 100) / 100;
  if (dailyReturn <= 0) return { status: 'no-package' };

  const now = Date.now();
  const expiresAt: number | null = user.package_expires_at ?? null;
  const isExpired = expiresAt !== null && now >= expiresAt;
  const effectiveEnd = expiresAt !== null ? Math.min(now, expiresAt) : now;

  const cachedLast = await cacheGet<number>(lastReturnCacheKey(uid));
  let lastReturnAt: number;
  if (cachedLast != null) {
    lastReturnAt = cachedLast;
  } else {
    lastReturnAt = user.last_investment_return_at ?? user.package_started_at ?? now;
    await cacheSet(lastReturnCacheKey(uid), lastReturnAt, CACHE_TTL_SECONDS);
  }

  let daysElapsed = Math.floor((effectiveEnd - lastReturnAt) / MS_PER_DAY);
  if (daysElapsed > MAX_BACKLOG_DAYS) {
    const forfeitedDays = daysElapsed - MAX_BACKLOG_DAYS;
    lastReturnAt += forfeitedDays * MS_PER_DAY;
    daysElapsed = MAX_BACKLOG_DAYS;
  }

  let totalCredited = 0;

  if (daysElapsed > 0) {
    // One atomic Postgres call writes every backlog entry + the wallet bump + the cursor.
    const { data, error } = await supabaseAdmin.rpc('credit_investment_returns', {
      p_user: uid,
      p_days: daysElapsed,
      p_daily: dailyReturn,
      p_last_ms: Math.round(lastReturnAt),
      p_package_id: user.package_id
    });
    if (error) throw new Error(error.message);

    totalCredited = Number(data ?? Math.round(dailyReturn * daysElapsed * 100) / 100);
    await cacheSet(lastReturnCacheKey(uid), lastReturnAt + daysElapsed * MS_PER_DAY, CACHE_TTL_SECONDS);
  }

  if (isExpired) {
    const { error } = await supabaseAdmin.rpc('expire_package', { p_user: uid });
    if (error) throw new Error(error.message);
    return { status: 'expired', daysCredited: daysElapsed, totalCredited };
  }

  return daysElapsed > 0 ? { status: 'credited', days: daysElapsed, totalCredited } : { status: 'up-to-date' };
}
