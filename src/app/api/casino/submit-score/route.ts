import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
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

  // uid + username key the write, but only `username`/`score` are ever surfaced by the leaderboard read.
  const existing = await redis.zscore(leaderboardKey, session.uid);
  if (existing === null || score > Number(existing)) {
    await Promise.all([
      redis.zadd(leaderboardKey, { score, member: session.uid }),
      redis.hset(namesKey, { [session.uid]: session.username })
    ]);
    // The profile's high score only ever changes when the leaderboard score does, so skip the
    // database write for non-record scores.
    await supabaseAdmin.rpc('set_casino_high_score', { p_user: session.uid, p_game: gameId, p_score: score });
  }

  await logAnalyticsEvent('casino_score_submitted', score).catch((e) => console.error('[casino] analytics', e));
  return NextResponse.json({ ok: true });
}
