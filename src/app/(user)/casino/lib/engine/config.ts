// globalConfig — tunable constants for the Brick Slasher engine.
// Split out from the original monolithic main.js so difficulty/feel can be
// tuned in one place without touching physics or render code.
export const CONFIG = {
  gravity: 0.32,
  spawnIntervalStartMs: 1100,
  spawnIntervalMinMs: 480,
  spawnIntervalRampMs: 22, // interval shrinks by this much per target spawned
  targetSpeedMin: 9.5,
  targetSpeedMax: 13.5,
  targetSpinMin: 0.02,
  targetSpinMax: 0.06,
  targetSize: 46,
  bombChance: 0.12,
  livesStart: 3,
  sliceTrailPoints: 14,
  sliceMinSpeed: 6, // px/frame — below this a swipe doesn't count as a slice
  burstParticleCount: 16,
  sparkParticleCount: 6,
  sparkLifeMs: 260,
  burstLifeMs: 520,
  colors: {
    cube: ['#1C54F5', '#4FD1F5', '#0E30A0'],
    bomb: '#0A1F3C',
    burst: ['#FFFFFF', '#4FD1F5', '#1C54F5'],
    spark: '#FFFFFF'
  }
} as const;
