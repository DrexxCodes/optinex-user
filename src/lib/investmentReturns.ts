// Daily investment returns — used to live behind a `/api/cron/investment-returns`
// endpoint polled by an external monitor. It now runs inline whenever a user logs
// in (or their session is refreshed), so there's no external scheduler to babysit.
//
// Flow for a given user:
//   1. Bail out fast if they're on the Free plan or have no package.
//   2. Look up the package's price to get the 10%/day return amount.
//   3. Figure out where we left off — Redis first (fast path). If Redis has
//      nothing (cold cache, expired TTL, first run ever), fall back to the
//      `lastInvestmentReturnAt` field on the user doc (or `packageStartedAt`
//      for a brand new package), and immediately write that value back to
//      Redis so the cache is warm again regardless of whether there's any
//      backlog to pay this run.
//   4. Credit one walletTransactions entry per missed day, capped at
//      MAX_BACKLOG_DAYS (10) and at the package's own expiry — whichever is
//      sooner. Backlog older than 10 days is forfeited, not paid.
//   5. If the package has expired, flip the user back to the Free plan.
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { generateReference } from '@/lib/refGenerator';
import { cacheGet, cacheSet } from '@/app/lib/redis';

const DAILY_RETURN_PERCENTAGE = 10; // 10% of the package price, per day
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days — comfortably longer than any realistic backlog
const MAX_BACKLOG_DAYS = 10; // any backlog beyond this is forfeited, not paid

function lastReturnCacheKey(uid: string) {
  return `investment:lastReturn:${uid}`;
}

export type SyncResult =
  | { status: 'no-package' }
  | { status: 'up-to-date' }
  | { status: 'credited'; days: number; totalCredited: number }
  | { status: 'expired'; daysCredited: number; totalCredited: number };

/**
 * Call this whenever we know a user is actively using the app — right after
 * sign-in, and again on access-token refresh so returning users who kept a
 * session open get caught up too. Safe to call often; it's a no-op once a
 * user is already paid up to date.
 *
 * `preloadedUser` is an optional escape hatch: if the caller already fetched
 * this user's doc moments ago (signin and refresh both do, to check the
 * password/token), pass that data in here to skip a second, redundant
 * Firestore read of the same doc. Only safe when nothing has written to the
 * user doc between that fetch and this call — which holds for signin and
 * refresh today. Omit it (or call with just `uid`) to fetch fresh, e.g. from
 * a cron job or admin tool where no recent read exists to reuse.
 */
export async function syncInvestmentOnLogin(
  uid: string,
  preloadedUser?: FirebaseFirestore.DocumentData
): Promise<SyncResult> {
  const userRef = adminDb.collection('users').doc(uid);

  let user: FirebaseFirestore.DocumentData;
  if (preloadedUser) {
    user = preloadedUser;
  } else {
    const userSnap = await userRef.get();
    if (!userSnap.exists) return { status: 'no-package' };
    user = userSnap.data()!;
  }

  if (!user.packageId || user.packageStatus === 'Free') {
    return { status: 'no-package' };
  }

  const packageSnap = await adminDb.collection('packages').doc(user.packageId).get();
  if (!packageSnap.exists) return { status: 'no-package' };
  const pkg = packageSnap.data()!;

  const cost: number = pkg.price ?? 0;
  const dailyReturn = Math.round(((cost * DAILY_RETURN_PERCENTAGE) / 100) * 100) / 100;
  if (dailyReturn <= 0) return { status: 'no-package' };

  const now = Date.now();
  const expiresAt: number | null = user.packageExpiresAt ?? null;
  const isExpired = expiresAt !== null && now >= expiresAt;
  // Never credit returns past the package's own expiry date.
  const effectiveEnd = expiresAt !== null ? Math.min(now, expiresAt) : now;

  // Where did we last leave off? Redis first (fast path). If Redis has
  // nothing for this user — cold cache, expired TTL, or Redis hiccup — fall
  // back to Firestore, which we already confirmed above has an active
  // package. Whatever we resolve from Firestore gets written straight back
  // to Redis so the fast path is warm again for the next call, independent
  // of whether there's any backlog to actually pay out this run.
  const cachedLast = await cacheGet<number>(lastReturnCacheKey(uid));
  let lastReturnAt: number;
  if (cachedLast != null) {
    lastReturnAt = cachedLast;
  } else {
    lastReturnAt = user.lastInvestmentReturnAt ?? user.packageStartedAt ?? now;
    await cacheSet(lastReturnCacheKey(uid), lastReturnAt, CACHE_TTL_SECONDS);
  }

  // Backlog is capped at MAX_BACKLOG_DAYS — anything older than that is
  // forfeited (not paid), and lastReturnAt is fast-forwarded to match so we
  // don't keep re-evaluating the forfeited days on every future call.
  let daysElapsed = Math.floor((effectiveEnd - lastReturnAt) / MS_PER_DAY);
  if (daysElapsed > MAX_BACKLOG_DAYS) {
    const forfeitedDays = daysElapsed - MAX_BACKLOG_DAYS;
    lastReturnAt += forfeitedDays * MS_PER_DAY;
    daysElapsed = MAX_BACKLOG_DAYS;
  }

  let totalCredited = 0;

  if (daysElapsed > 0) {
    const batch = adminDb.batch();
    const walletTxnsRef = userRef.collection('walletTransactions');

    for (let i = 1; i <= daysElapsed; i++) {
      const txnDate = new Date(lastReturnAt + i * MS_PER_DAY);
      const txnRef = walletTxnsRef.doc();
      batch.set(txnRef, {
        txnType: 'credit',
        txnName: 'Daily investment return',
        amount: dailyReturn,
        txnRef: generateReference(),
        packageId: user.packageId,
        timestamp: FieldValue.serverTimestamp(),
        // Kept alongside the server timestamp so a batch of backlogged
        // entries still shows the correct day in the activity feed rather
        // than every backlog entry showing "just now".
        forDate: txnDate.toISOString().slice(0, 10)
      });
    }

    totalCredited = Math.round(dailyReturn * daysElapsed * 100) / 100;
    const newLastReturnAt = lastReturnAt + daysElapsed * MS_PER_DAY;

    const userUpdate: Record<string, unknown> = {
      walletAmount: FieldValue.increment(totalCredited),
      lastInvestmentReturnAt: newLastReturnAt
    };

    batch.set(userRef, userUpdate, { merge: true });
    await batch.commit();

    await cacheSet(lastReturnCacheKey(uid), newLastReturnAt, CACHE_TTL_SECONDS);
  }

  if (isExpired) {
    // Package has run its course — drop the user back to Free on this login.
    await userRef.set(
      {
        packageStatus: 'Free',
        packageId: null,
        packageName: null,
        packageStartedAt: null,
        packageExpiresAt: null,
        isChangingPackage: false
      },
      { merge: true }
    );
    return { status: 'expired', daysCredited: daysElapsed, totalCredited };
  }

  return daysElapsed > 0 ? { status: 'credited', days: daysElapsed, totalCredited } : { status: 'up-to-date' };
}
