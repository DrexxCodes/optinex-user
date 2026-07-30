import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { MAX_DAILY_SPINS } from '@/app/(user)/streak/lib/prizes';

function todayId(now: Date) {
  return now.toISOString().slice(0, 10);
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const userRef = adminDb.collection('users').doc(session.uid);
  const userSnap = await userRef.get();
  const user = userSnap.data() ?? {};

  const now = new Date();
  const today = todayId(now);
  // Spins reset every day — if the stored date isn't today, the user has
  // their full allotment (this is read-only; the actual reset write happens
  // lazily on the next POST /spin so we don't need a write here).
  const spinsUsed = user.spinsDate === today ? (user.spinsUsed ?? 0) : 0;
  const spinsLeft = Math.max(0, MAX_DAILY_SPINS - spinsUsed);

  return NextResponse.json({ spinsLeft, maxSpins: MAX_DAILY_SPINS });
}
