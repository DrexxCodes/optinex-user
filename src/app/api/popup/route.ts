import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

// Admin-configured welcome dialog shown on dashboard load.
// Firestore doc: config/popup { title, body, actionLabel, actionLink, enabled }
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const snap = await adminDb.collection('config').doc('popup').get();
  if (!snap.exists || snap.data()?.enabled === false) {
    return NextResponse.json({ enabled: false });
  }
  const data = snap.data()!;
  return NextResponse.json({
    enabled: true,
    title: data.title ?? '',
    body: data.body ?? '',
    actionLabel: data.actionLabel ?? null,
    actionLink: data.actionLink ?? null
  });
}
