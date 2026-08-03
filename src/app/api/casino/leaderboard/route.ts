import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { redis, gameLeaderboardKey, gameLeaderboardNamesKey, CASINO_GAME_IDS, type CasinoGameId } from '@/lib/redis';

// Top 10 leaderboard for one game, read entirely from Upstash Redis. `uid`/`email`
// never leave the write path — only `username` and `score` are ever rendered here.
export async function GET(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const gameParam = req.nextUrl.searchParams.get('game');
  const gameId: CasinoGameId = CASINO_GAME_IDS.includes(gameParam as CasinoGameId)
    ? (gameParam as CasinoGameId)
    : 'brick-slasher';

  const leaderboardKey = gameLeaderboardKey(gameId);
  const namesKey = gameLeaderboardNamesKey(gameId);

  const top = await redis.zrange<string[]>(leaderboardKey, 0, 9, { rev: true, withScores: true });

  const entries: { uid: string; score: number }[] = [];
  for (let i = 0; i < top.length; i += 2) {
    entries.push({ uid: String(top[i]), score: Number(top[i + 1]) });
  }

  const uids = entries.map((e) => e.uid);
  const usernames = uids.length ? await redis.hmget<Record<string, string>>(namesKey, ...uids) : {};

  const leaderboard = entries.map((e, i) => ({
    rank: i + 1,
    username: usernames?.[e.uid] ?? 'Player',
    score: e.score
  }));

  return NextResponse.json({ leaderboard });
}
