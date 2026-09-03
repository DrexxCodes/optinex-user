import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { redis, REFERRAL_LEADERBOARD_KEY, REFERRAL_LEADERBOARD_NAMES_KEY } from '@/lib/redis';
import { adminDb } from '@/lib/firebase/admin';

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

    // The Redis name cache is best-effort (written at signup time, and only
    // going back to when that caching was added), so any uid missing a
    // usable entry there falls back to Firestore — the actual source of
    // truth for a user's name — instead of a generic placeholder. This is
    // also what backfills the cache for next time, so it self-heals.
    const missingUids = uids.filter((uid) => {
      const cached = names?.[uid];
      if (!cached) return true;
      try {
        const parsed = JSON.parse(cached as string);
        return !parsed.fullName;
      } catch {
        return true;
      }
    });

    const fetchedNames = new Map<string, { fullName: string; username: string }>();
    if (missingUids.length > 0) {
      const snaps = await Promise.all(missingUids.map((uid) => adminDb.collection('users').doc(uid).get()));
      for (const snap of snaps) {
        if (!snap.exists) continue;
        const d = snap.data()!;
        const entry = { fullName: d.fullName ?? 'Incossify user', username: d.username ?? '' };
        fetchedNames.set(snap.id, entry);
      }
      // Backfill the cache so we don't have to hit Firestore for these again.
      if (fetchedNames.size > 0) {
        try {
          const hsetPayload: Record<string, string> = {};
          for (const [uid, entry] of fetchedNames) hsetPayload[uid] = JSON.stringify(entry);
          await redis.hset(REFERRAL_LEADERBOARD_NAMES_KEY, hsetPayload);
        } catch (err) {
          console.error('[referral/leaderboard] name cache backfill failed:', err);
        }
      }
    }

    // How much each referrer has actually earned from people using their key.
    // Not cacheable like names (it changes on every new signup), so every uid
    // on the board gets a read here — plus the logged-in user, for `you`,
    // whether or not they're in the current top 10.
    const earningsUids = Array.from(new Set(session.uid ? [...uids, session.uid] : uids));
    const earningsMap = new Map<string, number>();
    if (earningsUids.length > 0) {
      const earningsSnaps = await adminDb.getAll(...earningsUids.map((uid) => adminDb.collection('users').doc(uid)));
      for (const snap of earningsSnaps) {
        if (snap.exists) earningsMap.set(snap.id, snap.data()?.referralEarnings ?? 0);
      }
    }

    const leaderboard: LeaderboardEntry[] = top.map((entry, i) => {
      let fullName = 'Incossify user';
      let username = '';
      const raw = names?.[entry.member];
      if (raw) {
        try {
          const parsed = JSON.parse(raw as string);
          if (parsed.fullName) {
            fullName = parsed.fullName;
            username = parsed.username ?? username;
          }
        } catch {
          // ignore malformed cache entries, fall through to Firestore lookup below
        }
      }
      const fetched = fetchedNames.get(entry.member);
      if (fetched) {
        fullName = fetched.fullName;
        username = fetched.username;
      }
      return {
        uid: entry.member,
        fullName,
        username,
        referrals: entry.score,
        totalEarned: earningsMap.get(entry.member) ?? 0,
        rank: i + 1
      };
    });

    // Where does the logged-in user sit? Only meaningful if they've made at
    // least one referral (otherwise they're not on the sorted set at all).
    const [yourRank, yourScore] = await Promise.all([
      redis.zrevrank(REFERRAL_LEADERBOARD_KEY, session.uid),
      redis.zscore(REFERRAL_LEADERBOARD_KEY, session.uid)
    ]);

    const you =
      yourRank !== null && yourRank !== undefined
        ? { rank: yourRank + 1, referrals: yourScore ?? 0, totalEarned: earningsMap.get(session.uid) ?? 0 }
        : null;

    return NextResponse.json({ leaderboard, you });
  } catch (err) {
    console.error('[referral/leaderboard]', err);
    return NextResponse.json({ error: 'Could not load the leaderboard right now.' }, { status: 500 });
  }
}
