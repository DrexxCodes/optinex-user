// render (draw) — paints targets, particles, and the live slice trail to a
// 2D canvas context. Cubes are drawn as rotated, shaded squares with a
// lighter top-face sliver to fake the 3D look from the original engine
// without carrying a full 3D matrix pipeline into the browser.
import type { Particle, Target, SlicePoint } from './types';

export function clearCanvas(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
}

export function drawTarget(ctx: CanvasRenderingContext2D, target: Target) {
  ctx.save();
  ctx.translate(target.pos.x, target.pos.y);
  ctx.rotate(target.rotation);

  const s = target.size;

  if (target.kind === 'bomb') {
    ctx.fillStyle = target.color;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#C33ED9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.55);
    ctx.lineTo(s * 0.25, -s * 0.95);
    ctx.stroke();
  } else {
    // body
    ctx.fillStyle = target.color;
    ctx.beginPath();
    ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.16);
    ctx.fill();

    // top-face highlight sliver — sells the 3D cube read
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(-s / 2, -s / 2);
    ctx.lineTo(s / 2, -s / 2);
    ctx.lineTo(s / 2 - s * 0.18, -s / 2 + s * 0.18);
    ctx.lineTo(-s / 2 + s * 0.18, -s / 2 + s * 0.18);
    ctx.closePath();
    ctx.fill();

    // edge stroke
    ctx.strokeStyle = 'rgba(31,10,60,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.16);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawParticle(ctx: CanvasRenderingContext2D, p: Particle, now: number) {
  const lifeRatio = 1 - (now - p.bornAt) / p.lifeMs;
  ctx.save();
  ctx.globalAlpha = Math.max(0, lifeRatio);
  ctx.fillStyle = p.color;
  ctx.beginPath();
  ctx.arc(p.pos.x, p.pos.y, p.size * Math.max(0.3, lifeRatio), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawTrail(ctx: CanvasRenderingContext2D, trail: SlicePoint[]) {
  if (trail.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 1; i < trail.length; i++) {
    const ratio = i / trail.length;
    ctx.strokeStyle = `rgba(245, 79, 245, ${0.15 + ratio * 0.6})`;
    ctx.lineWidth = 2 + ratio * 6;
    ctx.beginPath();
    ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
    ctx.lineTo(trail[i].x, trail[i].y);
    ctx.stroke();
  }
  ctx.restore();
}
