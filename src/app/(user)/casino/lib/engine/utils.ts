// utils — small math/vector helpers shared across the engine modules.
import type { Vec2 } from './types';

export function randRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function dist(a: Vec2, b: Vec2) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function pointSegmentDistance(p: Vec2, a: Vec2, b: Vec2) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;
  let t = lenSq === 0 ? 0 : ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: a.x + abx * t, y: a.y + aby * t };
  return dist(p, proj);
}

let idCounter = 0;
export function nextId() {
  idCounter += 1;
  return idCounter;
}
