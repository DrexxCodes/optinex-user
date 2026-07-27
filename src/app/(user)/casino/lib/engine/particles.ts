// particles — burst (on-slice confetti) + spark (slice-trail glow) systems.
import { CONFIG } from './config';
import { randRange } from './utils';
import type { Particle, Target, SlicePoint } from './types';

export function createBurst(target: Target): Particle[] {
  const particles: Particle[] = [];
  const now = performance.now();
  for (let i = 0; i < CONFIG.burstParticleCount; i++) {
    const angle = (i / CONFIG.burstParticleCount) * Math.PI * 2 + randRange(-0.2, 0.2);
    const speed = randRange(2, 7);
    particles.push({
      pos: { ...target.pos },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed - 2 },
      color: CONFIG.colors.burst[Math.floor(Math.random() * CONFIG.colors.burst.length)],
      size: randRange(2, 5),
      bornAt: now,
      lifeMs: CONFIG.burstLifeMs * randRange(0.7, 1.2)
    });
  }
  return particles;
}

export function createSparks(point: SlicePoint): Particle[] {
  const particles: Particle[] = [];
  const now = performance.now();
  for (let i = 0; i < CONFIG.sparkParticleCount; i++) {
    const angle = randRange(0, Math.PI * 2);
    const speed = randRange(0.5, 2.2);
    particles.push({
      pos: { x: point.x, y: point.y },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      color: CONFIG.colors.spark,
      size: randRange(1, 3),
      bornAt: now,
      lifeMs: CONFIG.sparkLifeMs
    });
  }
  return particles;
}

export function updateParticles(particles: Particle[], now: number): Particle[] {
  return particles
    .map((p) => ({
      ...p,
      pos: { x: p.pos.x + p.vel.x, y: p.pos.y + p.vel.y },
      vel: { x: p.vel.x * 0.96, y: p.vel.y * 0.96 + 0.12 }
    }))
    .filter((p) => now - p.bornAt < p.lifeMs);
}
