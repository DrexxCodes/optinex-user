import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

const CYCLE_MS = 1000 * 60 * 60 * 24;

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const userRef = adminDb.collection('users').doc(session.uid);
  const [userSnap, checkinsSnap] = await Promise.all([
    userRef.get(),
    userRef.collection('checkins').orderBy('timestamp', 'desc').limit(30).get()
  ]);

  const user = userSnap.data() ?? {};
  const lastCheckinAt = user.lastCheckinAt?.toDate?.() as Date | undefined;
  const now = new Date();
  const canCheckIn = !lastCheckinAt || now.getTime() - lastCheckinAt.getTime() >= CYCLE_MS;
  const nextAvailableAt = lastCheckinAt ? new Date(lastCheckinAt.getTime() + CYCLE_MS) : null;

  return NextResponse.json({
    canCheckIn,
    nextAvailableAt,
    streakCount: user.streakCount ?? 0,
    history: checkinsSnap.docs.map((d) => ({
      id: d.id,
      date: d.data().date,
      timestamp: d.data().timestamp?.toDate?.() ?? null
    }))
  });
}
