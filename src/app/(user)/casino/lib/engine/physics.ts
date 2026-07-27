// physics (tick) — advances target motion under gravity and resolves
// slice-vs-target collisions against the current pointer trail.
import { CONFIG } from './config';
import { pointSegmentDistance } from './utils';
import type { Target, SlicePoint } from './types';

export function stepTarget(target: Target): Target {
  return {
    ...target,
    pos: { x: target.pos.x + target.vel.x, y: target.pos.y + target.vel.y },
    vel: { x: target.vel.x, y: target.vel.y + CONFIG.gravity },
    rotation: target.rotation + target.spin
  };
}

export function partitionTargets(targets: Target[], canvasHeight: number) {
  const alive: Target[] = [];
  const missed: Target[] = [];
  for (const t of targets) {
    if (t.sliced) continue; // already resolved this frame, drop it
    if (t.pos.y - t.size > canvasHeight + 40) {
      missed.push(t);
    } else {
      alive.push(t);
    }
  }
  return { alive, missed };
}

/** A target counts as sliced if any consecutive pair of trail points passes
 * within its radius, and the swipe speed between those points clears the
 * minimum slice speed (so a stationary tap doesn't slice anything). */
export function resolveSlices(targets: Target[], trail: SlicePoint[]) {
  if (trail.length < 2) return { hits: [] as Target[], remaining: targets };

  const hits: Target[] = [];
  const remaining: Target[] = [];

  for (const target of targets) {
    let wasHit = false;
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1];
      const b = trail[i];
      const dt = Math.max(1, b.t - a.t);
      const speed = Math.hypot(b.x - a.x, b.y - a.y) / (dt / 16.6);
      if (speed < CONFIG.sliceMinSpeed) continue;

      if (pointSegmentDistance(target.pos, a, b) <= target.size * 0.9) {
        wasHit = true;
        break;
      }
    }
    if (wasHit) hits.push(target);
    else remaining.push(target);
  }

  return { hits, remaining };
}
