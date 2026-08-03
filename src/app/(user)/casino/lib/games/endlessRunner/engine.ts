// Endless Runner — tap to jump over incoming obstacles; one hit ends the
// run. Score is distance survived (ramps with speed), speed ramps up as
// more obstacles are cleared.
import { BaseCanvasEngine, type TapPoint } from '../../shared/baseEngine';
import type { EngineCallbacks, GameState } from '../../engine/types';
import { RUNNER_CONFIG as CFG } from './config';
import type { Obstacle } from './types';

const initialState: GameState = { score: 0, lives: 1, running: false, gameOver: false };

export class EndlessRunnerEngine extends BaseCanvasEngine<GameState> {
  private obstacles: Obstacle[] = [];
  private charY = 0;
  private vy = 0;
  private grounded = true;
  private speed: number = CFG.speedStart;
  private obstaclesPassed = 0;
  private nextSpawnAt = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    super(canvas, callbacks, { ...initialState });
  }

  private get groundY() {
    return this.height * CFG.groundRatio;
  }

  protected reset() {
    this.state = { ...initialState };
    this.obstacles = [];
    this.charY = this.groundY;
    this.vy = 0;
    this.grounded = true;
    this.speed = CFG.speedStart;
    this.obstaclesPassed = 0;
    this.nextSpawnAt = performance.now() + CFG.obstacleMinGapMs;
  }

  protected onTapStart(_point: TapPoint) {
    if (!this.state.running || !this.grounded) return;
    this.vy = CFG.jumpVelocity;
    this.grounded = false;
  }

  protected tick(now: number) {
    // Jump physics.
    this.vy += CFG.gravity;
    this.charY += this.vy;
    if (this.charY >= this.groundY) {
      this.charY = this.groundY;
      this.vy = 0;
      this.grounded = true;
    }

    // Spawn obstacles, faster as the run goes on.
    if (now >= this.nextSpawnAt) {
      const height = CFG.obstacleHeightMin + Math.random() * (CFG.obstacleHeightMax - CFG.obstacleHeightMin);
      this.obstacles.push({ x: this.width + CFG.obstacleWidth, width: CFG.obstacleWidth, height, passed: false });
      const gapShrink = Math.min(1, this.speed / CFG.speedMax);
      const gap = CFG.obstacleMaxGapMs - gapShrink * (CFG.obstacleMaxGapMs - CFG.obstacleMinGapMs);
      this.nextSpawnAt = now + gap * (0.7 + Math.random() * 0.6);
    }

    // Advance + cull obstacles, track how many we've cleared for the speed ramp.
    const runnerLeft = CFG.runnerX - CFG.runnerSize / 2;
    const runnerRight = CFG.runnerX + CFG.runnerSize / 2;
    const runnerTop = this.charY - CFG.runnerSize;
    const runnerBottom = this.charY;

    const survivors: Obstacle[] = [];
    for (const o of this.obstacles) {
      o.x -= this.speed;
      if (o.x + o.width < 0) continue;

      if (!o.passed && o.x + o.width < runnerLeft) {
        o.passed = true;
        this.obstaclesPassed += 1;
        this.speed = Math.min(CFG.speedMax, CFG.speedStart + this.obstaclesPassed * CFG.speedRampPerObstacle);
      }

      const obTop = this.groundY - o.height;
      const overlapsX = o.x < runnerRight && o.x + o.width > runnerLeft;
      const overlapsY = obTop < runnerBottom && this.groundY > runnerTop;
      if (overlapsX && overlapsY) {
        this.endGame();
        return;
      }

      survivors.push(o);
    }
    this.obstacles = survivors;

    this.state.score += this.speed * CFG.scorePerFrame;
    this.emitState();

    this.draw();
  }

  private draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0A1F3C';
    ctx.fillRect(0, 0, w, h);

    // Ground line.
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(w, this.groundY);
    ctx.stroke();

    // Runner.
    ctx.fillStyle = '#4FD1F5';
    ctx.beginPath();
    ctx.roundRect(
      CFG.runnerX - CFG.runnerSize / 2,
      this.charY - CFG.runnerSize,
      CFG.runnerSize,
      CFG.runnerSize,
      6
    );
    ctx.fill();

    // Obstacles.
    ctx.fillStyle = '#22C55E';
    for (const o of this.obstacles) {
      ctx.fillRect(o.x, this.groundY - o.height, o.width, o.height);
    }
  }
}
