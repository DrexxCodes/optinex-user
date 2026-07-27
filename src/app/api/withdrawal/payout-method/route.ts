import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { accountNumber, bankCode, bankName, accountName } = await req.json();
  if (!accountNumber || !bankCode || !bankName || !accountName) {
    return NextResponse.json({ error: 'Complete bank details are required.' }, { status: 400 });
  }

  await adminDb.collection('users').doc(session.uid).set(
    { payoutMethod: { accountNumber, bankCode, bankName, accountName } },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
