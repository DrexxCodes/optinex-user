import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { getDistinctActivePackageCount, MIN_DISTINCT_PACKAGES } from '@/lib/withdrawal/eligibility';

// Encodes the withdrawal gatekeeper rules for the client to render, without
// letting the client decide enforcement — `request/route.ts` re-checks all of this.
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const [userSnap, withdrawalConfigSnap] = await Promise.all([
    adminDb.collection('users').doc(session.uid).get(),
    adminDb.collection('config').doc('withdrawal').get()
  ]);

  const user = userSnap.data() ?? {};
  const config = withdrawalConfigSnap.exists ? withdrawalConfigSnap.data()! : {};
  const enabledDate = config.enabledDate?.toDate?.() ?? null;

  const dateThresholdReached = !!enabledDate && new Date() >= enabledDate;
  const isUpgraded = user.accountTier === 'upgraded';
  const hasPaidPackage = user.packageStatus && user.packageStatus !== 'Free' && user.packageStatus !== 'pending verification';
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
    packageStatus: user.packageStatus ?? 'Free',
    payoutMethod: user.payoutMethod ?? null,
    walletAmount: user.walletAmount ?? 0
  });
}
