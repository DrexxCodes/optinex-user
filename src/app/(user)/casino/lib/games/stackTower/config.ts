export const STACK_CONFIG = {
  blockHeight: 34,
  baseWidthRatio: 0.55, // first block's width, relative to canvas width
  speedStart: 2.0,
  speedRampPerLayer: 0.06,
  speedMax: 6.5,
  perfectToleranceRatio: 0.06, // overlap-vs-previous-width tolerance counted as a "perfect" drop
  baseScore: 10,
  perfectBonus: 15,
  colors: ['#9D0EB3', '#C33ED9', '#61086C', '#22C55E', '#F59E0B']
} as const;
