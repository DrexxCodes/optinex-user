import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';
import { logAnalyticsEvent } from '@/lib/analytics';
import { MIN_DISTINCT_PACKAGES } from '@/lib/withdrawal/eligibility';
import { rpcMessage } from '@/lib/db/format';

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { amount } = await req.json();
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Enter a valid amount.' }, { status: 400 });
  }

  // Every gatekeeper rule, the balance check, the withdrawal row, the wallet debit and its
  // transaction record run atomically inside one Postgres function (profile row locked).
  const { data: reference, error } = await supabaseAdmin.rpc('request_withdrawal', {
    p_user: session.uid,
    p_amount: Number(amount),
    p_ref: generateReference(),
    p_min_packages: MIN_DISTINCT_PACKAGES
  });

  if (error) {
    const messages: Record<string, string> = {
      WITHDRAWAL_NOT_ENABLED: "Withdrawal isn't enabled yet. Check back later.",
      UPGRADE_REQUIRED: 'You must upgrade your account to access withdrawals.',
      PACKAGE_REQUIRED: 'A paid package is required before you can withdraw.',
      MULTIPLE_PACKAGES_REQUIRED: `You need at least ${MIN_DISTINCT_PACKAGES} different packages before you can withdraw.`,
      NO_PAYOUT_METHOD: 'Add your payout details before requesting a withdrawal.',
      INSUFFICIENT_BALANCE: 'Your wallet balance is too low for this amount.'
    };
    const message = messages[rpcMessage(error)] ?? 'Could not process your withdrawal request.';
    console.error('[withdrawal/request]', error);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await logAnalyticsEvent('withdrawal_requested', Number(amount)).catch((e) => console.error('[withdrawal] analytics', e));
  return NextResponse.json({ ok: true, reference });
}
