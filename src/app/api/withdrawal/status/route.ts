import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

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
  const hasPaidPackage = user.packageStatus && user.packageStatus !== 'Free' && user.packageStatus !== 'pending verification';

  let reason: string | null = null;
  if (!enabledDate) {
    reason = "Withdrawal isn't enabled yet. Check back later.";
  } else if (!dateThresholdReached) {
    reason = "Withdrawal isn't enabled yet. Check back later.";
  } else if (!hasPaidPackage) {
    reason = 'A paid package is required before you can withdraw.';
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
