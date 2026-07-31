import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

// Bank details the payment dialog displays, plus the user's latest
// investment request so the UI can show a "pending verification" badge.
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const [bankSnap, latestSnap, userSnap] = await Promise.all([
    adminDb.collection('config').doc('bank').get(),
    adminDb
      .collection('investments')
      .where('uid', '==', session.uid)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get(),
    adminDb.collection('users').doc(session.uid).get()
  ]);

  const bank = bankSnap.exists ? bankSnap.data() : null;
  const latest = latestSnap.empty ? null : { id: latestSnap.docs[0].id, ...latestSnap.docs[0].data() };
  const user = userSnap.exists ? userSnap.data() ?? {} : {};

  return NextResponse.json({
    bank: bank ? { bankName: bank.bankName, accountNumber: bank.accountNumber, accountName: bank.accountName } : null,
    latestRequest: latest,
    packageStatus: user.packageStatus ?? 'Free',
    packageId: user.packageId ?? null,
    packageName: user.packageName,
    isChangingPackage: user.isChangingPackage ?? false
  });
}
