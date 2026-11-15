import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';
import { logAnalyticsEvent } from '@/lib/analytics';
import { fetchBanks, resolveBankAccount } from '@/lib/paystack';
import { getLoanBlock } from '@/lib/loans/eligibility';
import { validateLoanInput } from '@/lib/loans/validation';
import { rateLimit, tooManyRequests } from '@/lib/rateLimit';
import { rpcMessage } from '@/lib/db/format';

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  // 5 submissions per hour per user — plenty for honest retries, and caps how many Paystack
  // lookups a single account can trigger through this route.
  const limit = await rateLimit('loan-apply', session.uid, 5, 60 * 60);
  if (!limit.allowed) return tooManyRequests(limit.retryAfter, 'You have submitted too many loan applications. Please try again later.');

  const body = await req.json().catch(() => ({}));
  const parsed = validateLoanInput(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.value;

  // The account name and bank name are always (re)resolved here, server-side, straight from
  // Paystack — never trusted from the client.
  const [banks, resolved] = await Promise.all([fetchBanks(), resolveBankAccount(input.accountNumber, input.bankCode)]);
  if (!resolved.ok) return NextResponse.json({ error: resolved.error }, { status: resolved.status });

  const bank = banks?.find((b) => b.code === input.bankCode);
  if (!bank) return NextResponse.json({ error: 'That bank is not supported.' }, { status: 400 });

  const { data: user } = await supabaseAdmin
    .from('profiles')
    .select('full_name, email, account_tier')
    .eq('id', session.uid)
    .maybeSingle();
  if (!user) return NextResponse.json({ error: 'Could not submit your loan application.' }, { status: 500 });

  const block = await getLoanBlock(session.uid, user.account_tier);
  if (block) return NextResponse.json({ error: block.message }, { status: 400 });

  const reference = generateReference();

  // The one-pending-application lock, the loan row and its first immutable timeline entry are
  // written atomically (the profile row is locked inside the function).
  const { data: loanId, error } = await supabaseAdmin.rpc('create_loan', {
    p_user: session.uid,
    p_ref: reference,
    p_amount: input.amount,
    p_reason: input.reason,
    // Name and email always come from the account, never from the request.
    p_applicant: {
      fullName: user.full_name ?? '',
      email: user.email ?? '',
      phone: input.phone,
      address: input.address,
      occupation: input.occupation
    },
    p_next_of_kin: { name: input.nextOfKinName, phone: input.nextOfKinPhone },
    p_bank: {
      accountNumber: input.accountNumber,
      bankCode: input.bankCode,
      bankName: bank.name,
      accountName: resolved.accountName
    }
  });

  if (error) {
    if (rpcMessage(error) === 'PENDING_EXISTS') {
      return NextResponse.json(
        { error: 'You already have a pending loan application. Wait for it to be reviewed before applying again.' },
        { status: 400 }
      );
    }
    console.error('[loans/apply]', error);
    return NextResponse.json({ error: 'Could not submit your loan application.' }, { status: 500 });
  }

  await logAnalyticsEvent('loan_requested', input.amount).catch((e) => console.error('[loans/apply] analytics', e));
  return NextResponse.json({ ok: true, reference, loanId });
}
