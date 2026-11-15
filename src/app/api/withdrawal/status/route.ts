import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { getConfig } from '@/lib/db/config';
import { getDistinctActivePackageCount, MIN_DISTINCT_PACKAGES } from '@/lib/withdrawal/eligibility';
import { num } from '@/lib/db/format';

// Encodes the withdrawal gatekeeper rules for the client to render, without letting the client
// decide enforcement — the request function re-checks all of this atomically.
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const [userRes, config] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('account_tier, package_status, payout_method, wallet_amount')
      .eq('id', session.uid)
      .maybeSingle(),
    getConfig('withdrawal')
  ]);

  const user = userRes.data;
  const enabledDate = config?.enabledDate ? new Date(config.enabledDate) : null;

  const dateThresholdReached = !!enabledDate && new Date() >= enabledDate;
  const isUpgraded = user?.account_tier === 'upgraded';
  const hasPaidPackage = !!user?.package_status && user.package_status !== 'Free' && user.package_status !== 'pending verification';
  const distinctPackageCount = hasPaidPackage ? await getDistinctActivePackageCount(session.uid) : 0;
  const hasEnoughPackages = distinctPackageCount >= MIN_DISTINCT_PACKAGES;

  let reason: string | null = null;
  if (!enabledDate) {
    reason = "Withdrawal isn't enabled yet. Check back later.";
  } else if (!dateThresholdReached) {
    reason = "Withdrawal isn't enabled yet. Check back later.";
  } else if (!isUpgraded) {
    reason = 'You must upgrade your account to access withdrawals.';
  } else if (!hasPaidPackage) {
    reason = 'A paid package is required before you can withdraw.';
  } else if (!hasEnoughPackages) {
    reason = `You need at least ${MIN_DISTINCT_PACKAGES} different packages before you can withdraw.`;
  }

  return NextResponse.json({
    allowed: !reason,
    reason,
    enabledDate,
    packageStatus: user?.package_status ?? 'Free',
    payoutMethod: user?.payout_method ?? null,
    walletAmount: num(user?.wallet_amount)
  });
}
