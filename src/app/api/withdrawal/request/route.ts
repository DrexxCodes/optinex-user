import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';
import { logAnalyticsEvent } from '@/lib/analytics';

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { amount } = await req.json();
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Enter a valid amount.' }, { status: 400 });
  }

  const userRef = adminDb.collection('users').doc(session.uid);

  try {
    const reference = await adminDb.runTransaction(async (tx) => {
      const [userSnap, configSnap] = await Promise.all([
        tx.get(userRef),
        tx.get(adminDb.collection('config').doc('withdrawal'))
      ]);
      if (!userSnap.exists) throw new Error('USER_NOT_FOUND');

      const user = userSnap.data()!;
      const config = configSnap.exists ? configSnap.data()! : {};
      const enabledDate = config.enabledDate?.toDate?.() ?? null;
      const dateThresholdReached = !!enabledDate && new Date() >= enabledDate;
      const hasPaidPackage = user.packageStatus && user.packageStatus !== 'Free' && user.packageStatus !== 'pending verification';

      if (!dateThresholdReached) throw new Error('WITHDRAWAL_NOT_ENABLED');
      if (!hasPaidPackage) throw new Error('PACKAGE_REQUIRED');
      if (!user.payoutMethod) throw new Error('NO_PAYOUT_METHOD');
      if ((user.walletAmount ?? 0) < amount) throw new Error('INSUFFICIENT_BALANCE');

      const reference = generateReference();
      const withdrawalRef = adminDb.collection('withdrawals').doc();

      tx.set(withdrawalRef, {
        uid: session.uid,
        amount,
        payoutMethod: user.payoutMethod,
        status: 'pending',
        reference,
        createdAt: FieldValue.serverTimestamp()
      });
      tx.set(
        userRef.collection('walletTransactions').doc(),
        {
          txnType: 'debit',
          txnName: 'withdrawal request',
          amount,
          timestamp: FieldValue.serverTimestamp(),
          txnRef: reference
        }
      );
      tx.set(userRef, { walletAmount: FieldValue.increment(-amount) }, { merge: true });

      return reference;
    });

    await logAnalyticsEvent('withdrawal_requested', amount);
    return NextResponse.json({ ok: true, reference });
  } catch (err: any) {
    const messages: Record<string, string> = {
      WITHDRAWAL_NOT_ENABLED: "Withdrawal isn't enabled yet. Check back later.",
      PACKAGE_REQUIRED: 'A paid package is required before you can withdraw.',
      NO_PAYOUT_METHOD: 'Add your payout details before requesting a withdrawal.',
      INSUFFICIENT_BALANCE: 'Your wallet balance is too low for this amount.'
    };
    const message = messages[err.message] ?? 'Could not process your withdrawal request.';
    console.error('[withdrawal/request]', err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
