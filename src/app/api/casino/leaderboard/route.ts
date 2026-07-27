import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { redis, LEADERBOARD_KEY, LEADERBOARD_NAMES_KEY } from '@/lib/redis';

// Top 10 leaderboard, read entirely from Upstash Redis. `uid`/`email` never
// leave the write path — only `username` and `score` are ever rendered here.
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const top = await redis.zrange<string[]>(LEADERBOARD_KEY, 0, 9, { rev: true, withScores: true });

  const entries: { uid: string; score: number }[] = [];
  for (let i = 0; i < top.length; i += 2) {
    entries.push({ uid: String(top[i]), score: Number(top[i + 1]) });
  }

  const uids = entries.map((e) => e.uid);
  const usernames = uids.length ? await redis.hmget<Record<string, string>>(LEADERBOARD_NAMES_KEY, ...uids) : {};

  const leaderboard = entries.map((e, i) => ({
    rank: i + 1,
    username: usernames?.[e.uid] ?? 'Player',
    score: e.score
  }));

  return NextResponse.json({ leaderboard });
}
