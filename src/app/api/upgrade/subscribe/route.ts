import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';
import { logAnalyticsEvent } from '@/lib/analytics';

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { receiptUrl } = await req.json();
  if (!receiptUrl) return NextResponse.json({ error: 'A receipt is required.' }, { status: 400 });

  const configSnap = await adminDb.collection('config').doc('upgrade').get();
  if (!configSnap.exists || !configSnap.data()?.price) {
    return NextResponse.json({ error: "Account upgrades aren't available right now." }, { status: 400 });
  }
  const price = configSnap.data()!.price as number;

  const userRef = adminDb.collection('users').doc(session.uid);
  const userSnap = await userRef.get();
  if (userSnap.data()?.accountTier === 'upgraded') {
    return NextResponse.json({ error: 'Your account is already upgraded.' }, { status: 400 });
  }
  if (userSnap.data()?.upgradeStatus === 'pending') {
    return NextResponse.json({ error: 'You already have an upgrade request pending verification.' }, { status: 400 });
  }

  const reference = generateReference();
  const upgradeRef = adminDb.collection('accountUpgrades').doc();

  await upgradeRef.set({
    uid: session.uid,
    amount: price,
    receiptUrl,
    status: 'pending',
    reference,
    createdAt: FieldValue.serverTimestamp()
  });

  await userRef.set({ upgradeStatus: 'pending' }, { merge: true });

  await logAnalyticsEvent('account_upgrade_submitted', price);

  return NextResponse.json({ ok: true, reference, upgradeId: upgradeRef.id });
}
