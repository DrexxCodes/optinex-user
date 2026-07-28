import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateUniqueReferralKey } from '@/lib/referral';

export async function POST() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const userRef = adminDb.collection('users').doc(session.uid);
  const snap = await userRef.get();
  if (!snap.exists) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  // Idempotency cos if a link already exists, just hand it back instead of
  // minting a second one.
  const existing = snap.data()!.referralKey;
  if (existing) return NextResponse.json({ referralKey: existing });

  const referralKey = await generateUniqueReferralKey();
  await userRef.set({ referralKey }, { merge: true });

  return NextResponse.json({ referralKey });
}
