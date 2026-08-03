// games — the single source of truth for which games exist in the casino
// tab bar. `id` doubles as the `game` query/body param the leaderboard API
// keys on, so it must stay in sync with GAME_IDS in src/lib/redis.ts.
export const GAME_IDS = ['brick-slasher', 'reaction-tap', 'stack-tower', 'endless-runner'] as const;

export type GameId = (typeof GAME_IDS)[number];

export const GAMES: { id: GameId; label: string; tagline: string }[] = [
  { id: 'brick-slasher', label: 'Brick Slasher', tagline: 'Swipe to slice cubes, dodge the bombs.' },
  { id: 'reaction-tap', label: 'Reaction Tap', tagline: 'Tap the instant it flashes green.' },
  { id: 'stack-tower', label: 'Stack Tower', tagline: 'Time your drop to build the tallest stack.' },
  { id: 'endless-runner', label: 'Endless Runner', tagline: 'Jump the obstacles, survive as long as you can.' }
];
