import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { redis, REFERRAL_LEADERBOARD_KEY, REFERRAL_LEADERBOARD_NAMES_KEY } from '@/lib/redis';

export type LeaderboardEntry = {
  uid: string;
  fullName: string;
  username: string;
  referrals: number;
  rank: number;
};

// Upstash's zrange with withScores returns a flat array: [member, score, member, score, ...]
function parseFlatScored(flat: (string | number)[]): { member: string; score: number }[] {
  const out: { member: string; score: number }[] = [];
  for (let i = 0; i < flat.length; i += 2) {
    out.push({ member: String(flat[i]), score: Number(flat[i + 1]) });
  }
  return out;
}

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  try {
    // Top 10, highest referral count first.
    const raw = await redis.zrange(REFERRAL_LEADERBOARD_KEY, 0, 9, { rev: true, withScores: true });
    const top = parseFlatScored(raw as (string | number)[]);

    const uids = top.map((t) => t.member);
    const names =
      uids.length > 0 ? await redis.hmget<Record<string, string>>(REFERRAL_LEADERBOARD_NAMES_KEY, ...uids) : {};

    const leaderboard: LeaderboardEntry[] = top.map((entry, i) => {
      let fullName = 'Optinex user';
      let username = '';
      const raw = names?.[entry.member];
      if (raw) {
        try {
          const parsed = JSON.parse(raw as string);
          fullName = parsed.fullName ?? fullName;
          username = parsed.username ?? username;
        } catch {
          // ignore malformed cache entries
        }
      }
      return { uid: entry.member, fullName, username, referrals: entry.score, rank: i + 1 };
    });

    // Where does the logged-in user sit? Only meaningful if they've made at
    // least one referral (otherwise they're not on the sorted set at all).
    const [yourRank, yourScore] = await Promise.all([
      redis.zrevrank(REFERRAL_LEADERBOARD_KEY, session.uid),
      redis.zscore(REFERRAL_LEADERBOARD_KEY, session.uid)
    ]);

    const you =
      yourRank !== null && yourRank !== undefined
        ? { rank: yourRank + 1, referrals: yourScore ?? 0 }
        : null;

    return NextResponse.json({ leaderboard, you });
  } catch (err) {
    console.error('[referral/leaderboard]', err);
    return NextResponse.json({ error: 'Could not load the leaderboard right now.' }, { status: 500 });
  }
}
