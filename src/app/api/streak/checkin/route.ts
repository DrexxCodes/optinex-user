import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';
import { logAnalyticsEvent } from '@/lib/analytics';

const CHECKIN_REWARD = 1000;
const CYCLE_MS = 1000 * 60 * 60 * 24;

export async function POST() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const userRef = adminDb.collection('users').doc(session.uid);

  try {
    const result = await adminDb.runTransaction(async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists) throw new Error('USER_NOT_FOUND');

      const user = userSnap.data()!;
      const lastCheckinAt = user.lastCheckinAt?.toDate?.() as Date | undefined;
      const now = new Date();

      if (lastCheckinAt && now.getTime() - lastCheckinAt.getTime() < CYCLE_MS) {
        const nextAvailableAt = new Date(lastCheckinAt.getTime() + CYCLE_MS);
        return { alreadyCheckedIn: true, nextAvailableAt };
      }

      const txnRef = generateReference();
      const checkinRef = userRef.collection('checkins').doc();
      const walletTxnRef = userRef.collection('walletTransactions').doc();

      tx.set(checkinRef, {
        timestamp: FieldValue.serverTimestamp(),
        date: now.toISOString().slice(0, 10)
      });

      tx.set(walletTxnRef, {
        txnType: 'credit',
        txnName: 'check-in reward',
        amount: CHECKIN_REWARD,
        timestamp: FieldValue.serverTimestamp(),
        txnRef
      });

      tx.set(
        userRef,
        {
          walletAmount: FieldValue.increment(CHECKIN_REWARD),
          lastCheckinAt: FieldValue.serverTimestamp(),
          streakCount: FieldValue.increment(1)
        },
        { merge: true }
      );

      return { alreadyCheckedIn: false, reward: CHECKIN_REWARD, txnRef };
    });

    if (result.alreadyCheckedIn) {
      return NextResponse.json(
        { error: 'Already checked in.', nextAvailableAt: result.nextAvailableAt },
        { status: 409 }
      );
    }

    await logAnalyticsEvent('checkin', CHECKIN_REWARD);
    return NextResponse.json({ ok: true, reward: result.reward, txnRef: result.txnRef });
  } catch (err) {
    console.error('[streak/checkin]', err);
    return NextResponse.json({ error: 'Could not process check-in.' }, { status: 500 });
  }
}
