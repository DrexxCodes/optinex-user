import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';
import { logAnalyticsEvent } from '@/lib/analytics';

// Called after the receipt has been uploaded via UploadThing. Creates a
// pending investment request and flips the user's package status so the
// withdrawal gatekeeper and dashboard badge both reflect "pending verification".
export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { packageId, receiptUrl } = await req.json();
  if (!packageId || !receiptUrl) {
    return NextResponse.json({ error: 'A package and receipt are required.' }, { status: 400 });
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
    createdAt: FieldValue.serverTimestamp()
  });

  await adminDb.collection('users').doc(session.uid).set({ packageStatus: 'pending verification' }, { merge: true });

  await logAnalyticsEvent('investment_submitted', pkg.price);

  return NextResponse.json({ ok: true, reference, investmentId: invRef.id });
}
