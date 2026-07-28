import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const [configSnap, userSnap, latestSnap] = await Promise.all([
    adminDb.collection('config').doc('upgrade').get(),
    adminDb.collection('users').doc(session.uid).get(),
    adminDb.collection('accountUpgrades').where('uid', '==', session.uid).orderBy('createdAt', 'desc').limit(1).get()
  ]);

  const config = configSnap.exists ? configSnap.data()! : null;
  const user = userSnap.exists ? userSnap.data()! : {};
  const latest = latestSnap.empty
    ? null
    : (() => {
        const d = latestSnap.docs[0];
        const r = d.data();
        return { id: d.id, amount: r.amount, status: r.status, reference: r.reference };
      })();

  return NextResponse.json({
    price: config?.price ?? null,
    bank: config ? { bankName: config.bankName, accountNumber: config.accountNumber, accountName: config.accountName } : null,
    accountTier: user.accountTier ?? 'standard',
    upgradeStatus: user.upgradeStatus ?? 'none',
    latestRequest: latest
  });
}
