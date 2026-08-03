export const RUNNER_CONFIG = {
  gravity: 0.9,
  jumpVelocity: -14,
  groundRatio: 0.82, // ground line, as a fraction of canvas height
  speedStart: 4.5,
  speedMax: 11,
  speedRampPerObstacle: 0.15,
  obstacleMinGapMs: 700,
  obstacleMaxGapMs: 1500,
  obstacleWidth: 22,
  obstacleHeightMin: 30,
  obstacleHeightMax: 55,
  runnerSize: 30,
  runnerX: 50,
  scorePerFrame: 0.15
} as const;
