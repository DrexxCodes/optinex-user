import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';
import { logAnalyticsEvent } from '@/lib/analytics';

// Allows a user with an active investment to change their package.
// Creates a new investment request and marks the user as changing package.
export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { packageId, receiptUrl } = await req.json();
  if (!packageId || !receiptUrl) {
    return NextResponse.json({ error: 'A package and receipt are required.' }, { status: 400 });
  }

  // Check if user has an active package
  const userSnap = await adminDb.collection('users').doc(session.uid).get();
  if (!userSnap.exists) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const user = userSnap.data()!;
  if (user.packageStatus === 'Free' || !user.packageStatus || user.packageStatus === 'pending verification') {
    return NextResponse.json(
      { error: 'You must have an active package to change packages.' },
      { status: 400 }
    );
  }

  const packageSnap = await adminDb.collection('packages').doc(packageId).get();
  if (!packageSnap.exists) return NextResponse.json({ error: 'Package not found.' }, { status: 404 });
  const pkg = packageSnap.data()!;

  const reference = generateReference();
  const invRef = adminDb.collection('investments').doc();

  await invRef.set({
    uid: session.uid,
    packageId,
    packageName: pkg.name,
    amount: pkg.price,
    receiptUrl,
    status: 'pending',
    reference,
    isPackageChange: true,
    previousPackageId: user.packageId,
    createdAt: FieldValue.serverTimestamp()
  });

  await adminDb
    .collection('users')
    .doc(session.uid)
    .set({ packageStatus: 'pending verification', isChangingPackage: true }, { merge: true });

  await logAnalyticsEvent('package_change_submitted' as Parameters<typeof logAnalyticsEvent>[0], pkg.price);

  return NextResponse.json({ ok: true, reference, investmentId: invRef.id });
}
