import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 50);
  const cursor = searchParams.get('cursor'); // id of the last transaction from the previous page

  const txnsCollection = adminDb.collection('users').doc(session.uid).collection('walletTransactions');
  const baseQuery = txnsCollection.orderBy('timestamp', 'desc');

  let query = baseQuery.limit(limit + 1); // fetch one extra to know if there's a next page
  if (cursor) {
    const cursorSnap = await txnsCollection.doc(cursor).get();
    if (cursorSnap.exists) query = baseQuery.startAfter(cursorSnap).limit(limit + 1);
  }

  const snap = await query.get();
  const docs = snap.docs.slice(0, limit);
  const hasMore = snap.docs.length > limit;

  return NextResponse.json({
    transactions: docs.map((d) => {
      const t = d.data();
      return {
        id: d.id,
        txnType: t.txnType,
        txnName: t.txnName,
        amount: t.amount,
        txnRef: t.txnRef,
        timestamp: t.timestamp?.toDate?.() ?? null
      };
    }),
    hasMore,
    nextCursor: hasMore ? docs[docs.length - 1].id : null
  });
}
