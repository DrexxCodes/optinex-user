// Upstash Redis — used for the Brick Slasher (casino) leaderboard cache.
// A REST-based client so it works from serverless/edge route handlers with no TCP connection.
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

// Sorted set of all-time high scores: member = uid, score = high score.
export const LEADERBOARD_KEY = 'casino:leaderboard';
// Hash mapping uid -> username, kept in sync so the leaderboard never needs a Firestore join.
export const LEADERBOARD_NAMES_KEY = 'casino:usernames';

// Sorted set of referral counts: member = uid (the referrer), score = number of
// successful referrals. Incremented once per valid referral at signup time.
export const REFERRAL_LEADERBOARD_KEY = 'referral:leaderboard';
// Hash mapping uid -> JSON.stringify({ fullName, username }), kept in sync so the
// leaderboard never needs a Firestore join to render names.
export const REFERRAL_LEADERBOARD_NAMES_KEY = 'referral:names';
