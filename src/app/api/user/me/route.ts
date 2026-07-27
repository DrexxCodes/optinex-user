import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { avatarPath } from '@/lib/dicebear';

// Returns the authenticated user's profile. This is the single fetch the
// dashboard shell needs — wallet, package, and payout status all live here.
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const snap = await adminDb.collection('users').doc(session.uid).get();
  if (!snap.exists) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const user = snap.data()!;
  return NextResponse.json({
    uid: snap.id,
    fullName: user.fullName,
    email: user.email,
    username: user.username,
    walletAmount: user.walletAmount ?? 0,
    packageStatus: user.packageStatus ?? 'Free',
    payoutMethod: user.payoutMethod ?? null,
    admin: !!user.admin,
    avatarUrl: avatarPath(user.email)
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const body = await req.json();
  const allowed = ['fullName'] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  await adminDb.collection('users').doc(session.uid).set(update, { merge: true });
  return NextResponse.json({ ok: true });
}
