// Reaction Tap — after a random delay the canvas flashes green; tap as fast
// as possible. Tapping early costs the round (0 pts, no game-over — this is
// a reflex test, not a survival game). Score = sum of per-round points,
// higher for a faster reaction. Runs REACTION_CONFIG.totalRounds rounds
// then ends.
import { BaseCanvasEngine, type TapPoint } from '../../shared/baseEngine';
import type { EngineCallbacks, GameState } from '../../engine/types';
import { REACTION_CONFIG as CFG } from './config';

type Phase = 'waiting' | 'ready' | 'early' | 'result';

export type ReactionTapState = GameState & { round: number; phase: Phase; lastReactionMs: number | null };

const initialState: ReactionTapState = {
  score: 0,
  lives: CFG.totalRounds,
  running: false,
  gameOver: false,
  round: 0,
  phase: 'waiting',
  lastReactionMs: null
};

export class ReactionTapEngine extends BaseCanvasEngine<ReactionTapState> {
  private waitUntil = 0;
  private readyAt = 0;
  private phaseEndsAt = 0; // for 'early' / 'result' pauses before the next round

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    super(canvas, callbacks, { ...initialState });
  }

  protected reset() {
    this.state = { ...initialState, lives: CFG.totalRounds };
    this.beginRound(0);
  }

  private beginRound(roundIndex: number) {
    this.state.round = roundIndex + 1;
    this.state.lives = CFG.totalRounds - roundIndex;
    this.state.phase = 'waiting';
    this.waitUntil = performance.now() + CFG.minDelayMs + Math.random() * (CFG.maxDelayMs - CFG.minDelayMs);
    this.emitState();
  }

  protected onTapStart(_point: TapPoint) {
    if (!this.state.running) return;

    if (this.state.phase === 'waiting') {
      this.state.phase = 'early';
      this.state.lastReactionMs = null;
      this.phaseEndsAt = performance.now() + CFG.earlyPauseMs;
      this.emitState();
      return;
    }

    if (this.state.phase === 'ready') {
      const reactionMs = performance.now() - this.readyAt;
      const points = Math.round(
        Math.max(CFG.minRoundScore, CFG.maxRoundScore - reactionMs)
      );
      this.state.score += points;
      this.state.lastReactionMs = Math.round(reactionMs);
      this.state.phase = 'result';
      this.phaseEndsAt = performance.now() + CFG.resultPauseMs;
      this.emitState();
    }
  }

  protected tick(now: number) {
    if (this.state.phase === 'waiting' && now >= this.waitUntil) {
      this.state.phase = 'ready';
      this.readyAt = now;
      this.emitState();
    } else if ((this.state.phase === 'early' || this.state.phase === 'result') && now >= this.phaseEndsAt) {
      if (this.state.round >= CFG.totalRounds) {
        this.endGame();
        return;
      }
      this.beginRound(this.state.round);
    }

    this.draw();
  }

  private draw() {
    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;
    ctx.clearRect(0, 0, width, height);

    const bg =
      this.state.phase === 'ready'
        ? '#22C55E'
        : this.state.phase === 'early'
          ? '#EF4444'
          : this.state.phase === 'result'
            ? '#9D0EB3'
            : '#1A0533';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 22px system-ui, sans-serif';

    let label = 'Wait for it…';
    if (this.state.phase === 'ready') label = 'TAP NOW!';
    else if (this.state.phase === 'early') label = 'Too soon!';
    else if (this.state.phase === 'result') label = `${this.state.lastReactionMs} ms`;

    ctx.fillText(label, width / 2, height / 2);
  }
}
