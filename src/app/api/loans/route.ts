import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { getLoanBlock } from '@/lib/loans/eligibility';
import { rateLimit, tooManyRequests } from '@/lib/rateLimit';
import { buildLoanTimeline, MAX_LOAN_AMOUNT, MIN_LOAN_AMOUNT } from '@/lib/loans/config';
import { iso, num } from '@/lib/db/format';

// Everything the loans page needs in one call: whether the user may apply (enforcement is
// re-checked in /api/loans/apply), and their applications with the full four-step timeline.
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const limit = await rateLimit('loan-list', session.uid, 30, 60);
  if (!limit.allowed) return tooManyRequests(limit.retryAfter);

  const [profile, loansRes] = await Promise.all([
    supabaseAdmin.from('profiles').select('account_tier').eq('id', session.uid).maybeSingle(),
    // Loans and their timeline rows come back in a single round trip.
    supabaseAdmin
      .from('loans')
      .select('id, amount, status, reference, bank_account, created_at, loan_timeline(status, at, by)')
      .eq('user_id', session.uid)
      .order('created_at', { ascending: false })
      .limit(20)
  ]);

  const block = await getLoanBlock(session.uid, profile.data?.account_tier);

  const loans = (loansRes.data ?? []).map((l: any) => ({
    id: l.id,
    amount: num(l.amount),
    status: l.status,
    reference: l.reference,
    bankAccount: l.bank_account,
    createdAt: iso(l.created_at),
    timeline: buildLoanTimeline(l.loan_timeline ?? [])
  }));

  return NextResponse.json({
    allowed: !block,
    blockCode: block?.code ?? null,
    reason: block?.message ?? null,
    hasPending: loans.some((l) => l.status === 'pending'),
    limits: { min: MIN_LOAN_AMOUNT, max: MAX_LOAN_AMOUNT },
    loans
  });
}
