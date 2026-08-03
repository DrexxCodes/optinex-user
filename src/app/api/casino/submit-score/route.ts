import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { redis, gameLeaderboardKey, gameLeaderboardNamesKey, CASINO_GAME_IDS, type CasinoGameId } from '@/lib/redis';
import { logAnalyticsEvent } from '@/lib/analytics';

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { score, game } = await req.json();
  if (typeof score !== 'number' || score < 0) {
    return NextResponse.json({ error: 'Invalid score.' }, { status: 400 });
  }
  // Default to brick-slasher so any not-yet-updated client keeps working.
  const gameId: CasinoGameId = CASINO_GAME_IDS.includes(game) ? game : 'brick-slasher';

  const leaderboardKey = gameLeaderboardKey(gameId);
  const namesKey = gameLeaderboardNamesKey(gameId);

  // uid + email(-derived username) are used internally to key the write,
  // but only `username`/`score` are ever surfaced by the leaderboard read.
  const existing = await redis.zscore(leaderboardKey, session.uid);
  if (existing === null || score > Number(existing)) {
    await Promise.all([
      redis.zadd(leaderboardKey, { score, member: session.uid }),
      redis.hset(namesKey, { [session.uid]: session.username })
    ]);
  }

  await logAnalyticsEvent('casino_score_submitted', score);
  await adminDb
    .collection('users')
    .doc(session.uid)
    .set(
      { casinoHighScores: { [gameId]: existing === null ? score : Math.max(Number(existing), score) } },
      { merge: true }
    );

  return NextResponse.json({ ok: true });
}
