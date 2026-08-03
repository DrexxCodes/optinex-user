// One-off migration: run this ONCE before/at deploy of the multi-game casino
// refactor. It renames the old unnamespaced Brick Slasher leaderboard keys
// onto the new per-game keys, so existing players keep their scores.
//
// Safe to re-run: if the legacy keys are already gone (because this already
// ran), it just logs that there's nothing to do.
//
// Usage:
//   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... npx tsx scripts/migrate-casino-leaderboard.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
});

const LEGACY_LEADERBOARD_KEY = 'casino:leaderboard';
const LEGACY_LEADERBOARD_NAMES_KEY = 'casino:usernames';
const NEW_LEADERBOARD_KEY = 'casino:leaderboard:brick-slasher';
const NEW_LEADERBOARD_NAMES_KEY = 'casino:usernames:brick-slasher';

async function migrateKey(from: string, to: string) {
  const exists = await redis.exists(from);
  if (!exists) {
    console.log(`[migrate] "${from}" doesn't exist — nothing to migrate.`);
    return;
  }

  const targetExists = await redis.exists(to);
  if (targetExists) {
    console.log(`[migrate] "${to}" already exists — skipping to avoid clobbering it. Check manually.`);
    return;
  }

  await redis.rename(from, to);
  console.log(`[migrate] renamed "${from}" -> "${to}"`);
}

async function main() {
  await migrateKey(LEGACY_LEADERBOARD_KEY, NEW_LEADERBOARD_KEY);
  await migrateKey(LEGACY_LEADERBOARD_NAMES_KEY, NEW_LEADERBOARD_NAMES_KEY);
  console.log('[migrate] done.');
}

main().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
