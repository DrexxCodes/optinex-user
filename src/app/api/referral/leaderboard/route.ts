import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { redis, REFERRAL_LEADERBOARD_KEY, REFERRAL_LEADERBOARD_NAMES_KEY } from '@/lib/redis';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { UUID_RE, num } from '@/lib/db/format';

export type LeaderboardEntry = {
  uid: string;
  fullName: string;
  username: string;
  referrals: number;
  totalEarned: number;
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

    // The Redis name cache is best-effort, so any uid missing a usable entry falls back to the
    // database (the source of truth) and backfills the cache so it self-heals.
    const missingUids = uids.filter((uid) => {
      const cached = names?.[uid];
      if (!cached) return true;
      try {
        return !JSON.parse(cached as string).fullName;
      } catch {
        return true;
      }
    });

    // One query covers both the missing names and everyone's earnings (the logged-in user is
    // included for `you`, whether or not they're in the current top 10).
    const lookupIds = Array.from(new Set([...uids, session.uid])).filter((id) => UUID_RE.test(id));
    const { data: rows } = lookupIds.length
      ? await supabaseAdmin.from('profiles').select('id, full_name, username, referral_earnings').in('id', lookupIds)
      : { data: [] as any[] };
    const byId = new Map((rows ?? []).map((r) => [r.id as string, r]));

    const fetchedNames = new Map<string, { fullName: string; username: string }>();
    for (const uid of missingUids) {
      const r = byId.get(uid);
      if (r) fetchedNames.set(uid, { fullName: r.full_name || 'Incossify user', username: r.username ?? '' });
    }
    if (fetchedNames.size > 0) {
      try {
        const hsetPayload: Record<string, string> = {};
        for (const [uid, entry] of fetchedNames) hsetPayload[uid] = JSON.stringify(entry);
        await redis.hset(REFERRAL_LEADERBOARD_NAMES_KEY, hsetPayload);
      } catch (err) {
        console.error('[referral/leaderboard] name cache backfill failed:', err);
      }
    }

    const earningsOf = (uid: string) => num(byId.get(uid)?.referral_earnings);

    const leaderboard: LeaderboardEntry[] = top.map((entry, i) => {
      let fullName = 'Incossify user';
      let username = '';
      const cached = names?.[entry.member];
      if (cached) {
        try {
          const parsed = JSON.parse(cached as string);
          if (parsed.fullName) {
            fullName = parsed.fullName;
            username = parsed.username ?? username;
          }
        } catch {
          // ignore malformed cache entries, fall through to the database lookup above
        }
      }
      const fetched = fetchedNames.get(entry.member);
      if (fetched) {
        fullName = fetched.fullName;
        username = fetched.username;
      }
      return { uid: entry.member, fullName, username, referrals: entry.score, totalEarned: earningsOf(entry.member), rank: i + 1 };
    });

    const [yourRank, yourScore] = await Promise.all([
      redis.zrevrank(REFERRAL_LEADERBOARD_KEY, session.uid),
      redis.zscore(REFERRAL_LEADERBOARD_KEY, session.uid)
    ]);

    const you =
      yourRank !== null && yourRank !== undefined
        ? { rank: yourRank + 1, referrals: yourScore ?? 0, totalEarned: earningsOf(session.uid) }
        : null;

    return NextResponse.json({ leaderboard, you });
  } catch (err) {
    console.error('[referral/leaderboard]', err);
    return NextResponse.json({ error: 'Could not load the leaderboard right now.' }, { status: 500 });
  }
}
