// baseEngine — shared canvas lifecycle (dpr-aware resize, rAF loop, tap input)
// extracted so Reaction Tap / Stack Tower / Endless Runner don't each
// reimplement the same resize + loop plumbing that MenjaEngine (Brick
// Slasher) already has inline. Brick Slasher itself is left untouched to
// avoid touching a game players already rely on.
import type { EngineCallbacks, GameState } from '../engine/types';

export type TapPoint = { x: number; y: number; t: number };

export abstract class BaseCanvasEngine<TState extends GameState> {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected callbacks: EngineCallbacks;
  protected state: TState;

  private rafId: number | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks, initialState: TState) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable.');
    this.ctx = ctx;
    this.callbacks = callbacks;
    this.state = initialState;

    this.resize();
    window.addEventListener('resize', this.resize);
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
  }

  protected get width() {
    return this.canvas.getBoundingClientRect().width;
  }

  protected get height() {
    return this.canvas.getBoundingClientRect().height;
  }

  private resize = () => {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  private handlePointerDown = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.onTapStart({ x: e.clientX - rect.left, y: e.clientY - rect.top, t: performance.now() });
  };

  private handlePointerUp = (e: PointerEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    this.onTapEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top, t: performance.now() });
  };

  /** Override in subclasses that care about tap-down (most of them). */
  protected onTapStart(_point: TapPoint) {}
  /** Override in subclasses that care about tap-up. */
  protected onTapEnd(_point: TapPoint) {}

  protected emitState() {
    this.callbacks.onStateChange?.({ ...this.state });
  }

  protected endGame() {
    this.state.running = false;
    this.state.gameOver = true;
    this.emitState();
    this.callbacks.onGameOver?.(this.state.score);
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  /** Reset all per-run mutable fields; called at the start of every run. */
  protected abstract reset(): void;
  /** Advance + draw one frame. Call `this.endGame()` when the run ends. */
  protected abstract tick(now: number): void;

  start() {
    this.reset();
    this.state.running = true;
    this.state.gameOver = false;
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
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
  }

  private loop = () => {
    if (!this.state.running) return;
    this.tick(performance.now());
    if (this.state.running) {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };
}
