// spawner — creates new targets (cubes / bombs) arcing up from the bottom of
// the canvas, with difficulty (speed + spawn rate) ramping as targets spawn.
import { CONFIG } from './config';
import { randRange, nextId } from './utils';
import type { Target } from './types';

export function createTarget(canvasWidth: number, canvasHeight: number, spawnCount: number): Target {
  const isBomb = Math.random() < CONFIG.bombChance;
  const size = CONFIG.targetSize * randRange(0.85, 1.25);
  const x = randRange(size, canvasWidth - size);

  const speed = randRange(CONFIG.targetSpeedMin, CONFIG.targetSpeedMax) + Math.min(spawnCount * 0.03, 4);
  const vy = -speed;
  const vx = randRange(-2.2, 2.2);

  const color = isBomb
    ? CONFIG.colors.bomb
    : CONFIG.colors.cube[Math.floor(Math.random() * CONFIG.colors.cube.length)];

  return {
    id: nextId(),
    kind: isBomb ? 'bomb' : 'cube',
    pos: { x, y: canvasHeight + size },
    vel: { x: vx, y: vy },
    rotation: randRange(0, Math.PI * 2),
    spin: randRange(CONFIG.targetSpinMin, CONFIG.targetSpinMax) * (Math.random() < 0.5 ? -1 : 1),
    size,
    color,
    sliced: false,
    bornAt: performance.now()
  };
}

export function nextSpawnInterval(spawnCount: number) {
  const interval = CONFIG.spawnIntervalStartMs - spawnCount * CONFIG.spawnIntervalRampMs;
  return Math.max(CONFIG.spawnIntervalMinMs, interval);
}
