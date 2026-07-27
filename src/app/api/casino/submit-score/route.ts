import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { redis, LEADERBOARD_KEY, LEADERBOARD_NAMES_KEY } from '@/lib/redis';
import { logAnalyticsEvent } from '@/lib/analytics';

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { score } = await req.json();
  if (typeof score !== 'number' || score < 0) {
    return NextResponse.json({ error: 'Invalid score.' }, { status: 400 });
  }

  // uid + email(-derived username) are used internally to key the write,
  // but only `username`/`score` are ever surfaced by the leaderboard read.
  const existing = await redis.zscore(LEADERBOARD_KEY, session.uid);
  if (existing === null || score > Number(existing)) {
    await Promise.all([
      redis.zadd(LEADERBOARD_KEY, { score, member: session.uid }),
      redis.hset(LEADERBOARD_NAMES_KEY, { [session.uid]: session.username })
    ]);
  }

  await logAnalyticsEvent('casino_score_submitted', score);
  await adminDb
    .collection('users')
    .doc(session.uid)
    .set({ highScore: existing === null ? score : Math.max(Number(existing), score) }, { merge: true });

  return NextResponse.json({ ok: true });
}
