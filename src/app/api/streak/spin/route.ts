import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';
import { logAnalyticsEvent } from '@/lib/analytics';
import { MAX_DAILY_SPINS, pickWeightedPrize } from '@/app/(user)/streak/lib/prizes';

function todayId(now: Date) {
  return now.toISOString().slice(0, 10);
}

export async function POST() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const userRef = adminDb.collection('users').doc(session.uid);

  try {
    const result = await adminDb.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new Error('USER_NOT_FOUND');

      const user = userSnap.data()!;
      const now = new Date();
      const today = todayId(now);

      // Roll over to a fresh allotment of spins if this is the user's first
      // spin of a new day.
      const spinsUsed = user.spinsDate === today ? (user.spinsUsed ?? 0) : 0;
      const spinsLeft = MAX_DAILY_SPINS - spinsUsed;

      if (spinsLeft <= 0) throw new Error('NO_SPINS_LEFT');

      const prize = pickWeightedPrize();
      // "Extra spin" refunds the spin it cost, so it never actually reduces
      // the user's count for the day — everything else consumes one spin.
      const spinsUsedAfter = prize.id === 'extra_spin' ? spinsUsed : spinsUsed + 1;

      const spinRef = userRef.collection('spins').doc();
      tx.set(spinRef, {
        prizeId: prize.id,
        amount: prize.amount,
        timestamp: FieldValue.serverTimestamp()
      });

      const update: Record<string, unknown> = {
        spinsUsed: spinsUsedAfter,
        spinsDate: today
      };

      let txnRef: string | null = null;
      if (prize.amount > 0) {
        txnRef = generateReference();
        tx.set(userRef.collection('walletTransactions').doc(), {
          txnType: 'credit',
          txnName: `spin reward — ${prize.label}`,
          amount: prize.amount,
          timestamp: FieldValue.serverTimestamp(),
          txnRef
        });
        update.walletAmount = FieldValue.increment(prize.amount);
      }

      tx.set(userRef, update, { merge: true });

      return {
        prizeId: prize.id,
        label: prize.label,
        amount: prize.amount,
        spinsLeft: MAX_DAILY_SPINS - spinsUsedAfter,
        txnRef
      };
    });

    await logAnalyticsEvent('spin_reward', result.amount);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    if (err.message === 'NO_SPINS_LEFT') {
      return NextResponse.json({ error: "You're out of spins for today." }, { status: 409 });
    }
    if (err.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    console.error('[streak/spin]', err);
    return NextResponse.json({ error: 'Could not process spin.' }, { status: 500 });
  }
}
