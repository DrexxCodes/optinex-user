// Upstash Redis — used for the Brick Slasher (casino) leaderboard cache.
// A REST-based client so it works from serverless/edge route handlers with no TCP connection.
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

// Casino now hosts 4 games, each with its own leaderboard. Keys are namespaced
// per game so scores never mix across games.
export const CASINO_GAME_IDS = ['brick-slasher', 'reaction-tap', 'stack-tower', 'endless-runner'] as const;
export type CasinoGameId = (typeof CASINO_GAME_IDS)[number];

// Sorted set of all-time high scores for one game: member = uid, score = high score.
export function gameLeaderboardKey(gameId: CasinoGameId) {
  return `casino:leaderboard:${gameId}`;
}
// Hash mapping uid -> username for one game, kept in sync so the leaderboard
// never needs a Firestore join.
export function gameLeaderboardNamesKey(gameId: CasinoGameId) {
  return `casino:usernames:${gameId}`;
}

// Pre-refactor keys — Brick Slasher was the only game and used these
// unnamespaced keys directly. Kept only so the one-off migration script
// (scripts/migrate-casino-leaderboard.ts) can move existing players' scores
// onto `gameLeaderboardKey('brick-slasher')` without losing them. Don't read
// or write these directly anywhere else.
export const LEGACY_LEADERBOARD_KEY = 'casino:leaderboard';
export const LEGACY_LEADERBOARD_NAMES_KEY = 'casino:usernames';

// Sorted set of referral counts: member = uid (the referrer), score = number of
// successful referrals. Incremented once per valid referral at signup time.
export const REFERRAL_LEADERBOARD_KEY = 'referral:leaderboard';
// Same idea, but scoped to the current week only: zeroed out (via del) by the
// admin's weekly referral reset, while REFERRAL_LEADERBOARD_KEY above keeps
// counting forever. The admin Referrals page reads this one for weekly rank.
export const REFERRAL_WEEKLY_LEADERBOARD_KEY = 'referral:weekly:leaderboard';
// Hash mapping uid -> JSON.stringify({ fullName, username }), kept in sync so the
// leaderboard never needs a Firestore join to render names.
export const REFERRAL_LEADERBOARD_NAMES_KEY = 'referral:names';
