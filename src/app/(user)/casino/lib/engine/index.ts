// Engine — the public surface that ties config/spawner/physics/particles/render
// together into a single running game bound to one <canvas>. This replaces the
// original single-file main.js: DOM-based HUD/menu manipulation is gone,
// replaced by the `onStateChange`/`onGameOver` callbacks so React owns all UI.
import { CONFIG } from './config';
import { createTarget, nextSpawnInterval } from './spawner';
import { createBurst, createSparks, updateParticles } from './particles';
import { stepTarget, partitionTargets, resolveSlices } from './physics';
import { clearCanvas, drawTarget, drawParticle, drawTrail } from './render';
import type { Target, Particle, SlicePoint, GameState, EngineCallbacks } from './types';

export class MenjaEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;

  private targets: Target[] = [];
  private particles: Particle[] = [];
  private trail: SlicePoint[] = [];

  private spawnCount = 0;
  private lastSpawnAt = 0;
  private rafId: number | null = null;
  private pointerDown = false;

  private state: GameState = { score: 0, lives: CONFIG.livesStart, running: false, gameOver: false };

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable.');
    this.ctx = ctx;
    this.callbacks = callbacks;

    this.resize();
    window.addEventListener('resize', this.resize);
    this.bindPointerEvents();
  }

  private resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  private get width() {
    return this.canvas.getBoundingClientRect().width;
  }
  private get height() {
    return this.canvas.getBoundingClientRect().height;
  }

  private bindPointerEvents() {
    const getPoint = (e: PointerEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, t: performance.now() };
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      this.pointerDown = true;
      this.trail = [getPoint(e)];
    });
    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.pointerDown) return;
      this.trail.push(getPoint(e));
      if (this.trail.length > CONFIG.sliceTrailPoints) this.trail.shift();
      this.particles.push(...createSparks(getPoint(e)));
    });
    const endSlice = () => {
      this.pointerDown = false;
      this.trail = [];
    };
    this.canvas.addEventListener('pointerup', endSlice);
    this.canvas.addEventListener('pointerleave', endSlice);
    this.canvas.addEventListener('pointercancel', endSlice);
  }

  private emitState() {
    this.callbacks.onStateChange?.({ ...this.state });
  }

  start() {
    this.targets = [];
    this.particles = [];
    this.trail = [];
    this.spawnCount = 0;
    this.lastSpawnAt = performance.now();
    this.state = { score: 0, lives: CONFIG.livesStart, running: true, gameOver: false };
    this.emitState();
    this.loop();
  }

  pause() {
    this.state.running = false;
    this.emitState();
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  resume() {
    if (this.state.gameOver) return;
    this.state.running = true;
    this.emitState();
    this.loop();
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.resize);
  }

  private loop = () => {
    if (!this.state.running) return;
    const now = performance.now();

    // Spawn new targets on an interval that ramps with difficulty.
    if (now - this.lastSpawnAt > nextSpawnInterval(this.spawnCount)) {
      this.targets.push(createTarget(this.width, this.height, this.spawnCount));
      this.spawnCount += 1;
      this.lastSpawnAt = now;
    }

    // Advance physics.
    this.targets = this.targets.map(stepTarget);

    // Resolve slices against the live pointer trail.
    if (this.trail.length >= 2) {
      const { hits, remaining } = resolveSlices(this.targets, this.trail);
      for (const hit of hits) {
        this.particles.push(...createBurst(hit));
        if (hit.kind === 'bomb') {
          this.endGame();
          return;
        }
        this.state.score += 10;
      }
      this.targets = remaining;
      if (hits.length) this.emitState();
    }

    // Drop offscreen targets; missed cubes cost a life, missed bombs are free.
    const { alive, missed } = partitionTargets(this.targets, this.height);
    this.targets = alive;
    const missedCubes = missed.filter((t) => t.kind === 'cube').length;
    if (missedCubes > 0) {
      this.state.lives -= missedCubes;
      this.emitState();
      if (this.state.lives <= 0) {
        this.endGame();
        return;
      }
    }

    this.particles = updateParticles(this.particles, now);

    // Render frame.
    clearCanvas(this.ctx, this.width, this.height);
    for (const p of this.particles) drawParticle(this.ctx, p, now);
    for (const t of this.targets) drawTarget(this.ctx, t);
    drawTrail(this.ctx, this.trail);

    this.rafId = requestAnimationFrame(this.loop);
  };

  private endGame() {
    this.state.running = false;
    this.state.gameOver = true;
    this.emitState();
    this.callbacks.onGameOver?.(this.state.score);
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
}
