import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const userSnap = await adminDb.collection('users').doc(session.uid).get();
  if (!userSnap.exists) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const user = userSnap.data()!;
  const referralKey: string | null = user.referralKey ?? null;

  let connections = 0;
  let recentConnections: { uid: string; fullName: string; username: string; joinedAt: string | null }[] = [];

  if (referralKey) {
    const referredSnap = await adminDb.collection('users').where('referredBy', '==', session.uid).get();

    connections = referredSnap.size;
    recentConnections = referredSnap.docs
      .map((d) => {
        const r = d.data();
        return {
          uid: d.id,
          fullName: r.fullName ?? 'Optinex user',
          username: r.username ?? '',
          joinedAt: r.createdAt?.toDate?.()?.toISOString?.() ?? null,
          _sortMs: r.createdAt?.toDate?.()?.getTime?.() ?? 0
        };
      })
      .sort((a, b) => b._sortMs - a._sortMs)
      .slice(0, 8)
      .map(({ _sortMs, ...rest }) => rest);
  }

  return NextResponse.json({
    referralKey,
    connections,
    totalEarned: user.referralEarnings ?? 0,
    recentConnections
  });
}
