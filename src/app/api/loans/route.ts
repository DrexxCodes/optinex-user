import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { getLoanBlock, LOAN_BLOCK_MESSAGES } from '@/lib/loans/eligibility';
import { buildLoanTimeline, MAX_LOAN_AMOUNT, MIN_LOAN_AMOUNT } from '@/lib/loans/config';

// Everything the loans page needs in one call: whether the user may apply
// (enforcement is re-checked in /api/loans/apply), and their applications
// with the full four-step timeline for each.
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const [userSnap, loansSnap] = await Promise.all([
    adminDb.collection('users').doc(session.uid).get(),
    // Single-field filter only (no orderBy) so no composite index is needed;
    // a user has few applications, so sorting in memory is fine.
    adminDb.collection('loans').where('uid', '==', session.uid).get()
  ]);

  const user = userSnap.data() ?? {};
  const block = await getLoanBlock(session.uid, user);

  const docs = loansSnap.docs
    .sort((a, b) => (b.data().createdAt?.toMillis?.() ?? 0) - (a.data().createdAt?.toMillis?.() ?? 0))
    .slice(0, 20);

  const loans = await Promise.all(
    docs.map(async (d) => {
      const l = d.data();
      const timelineSnap = await d.ref.collection('timeline').get();
      return {
        id: d.id,
        amount: l.amount,
        status: l.status,
        reference: l.reference,
        bankAccount: l.bankAccount,
        createdAt: l.createdAt?.toDate?.()?.toISOString?.() ?? null,
        timeline: buildLoanTimeline(timelineSnap.docs.map((t) => t.data()))
      };
    })
  );

  return NextResponse.json({
    allowed: !block,
    blockCode: block,
    reason: block ? LOAN_BLOCK_MESSAGES[block] : null,
    hasPending: loans.some((l) => l.status === 'pending'),
    limits: { min: MIN_LOAN_AMOUNT, max: MAX_LOAN_AMOUNT },
    loans
  });
}
