// Stack Tower — a block slides back and forth above the tower; tap to drop
// it onto the previous layer. Overlap becomes the new layer's width; miss
// entirely and the tower falls (game over). Perfectly-aligned drops keep
// full width and build a combo bonus.
import { BaseCanvasEngine, type TapPoint } from '../../shared/baseEngine';
import type { EngineCallbacks } from '../../engine/types';
import { STACK_CONFIG as CFG } from './config';
import type { PlacedBlock, StackTowerState } from './types';

const initialState: StackTowerState = { score: 0, lives: 1, running: false, gameOver: false, combo: 0 };

export class StackTowerEngine extends BaseCanvasEngine<StackTowerState> {
  private blocks: PlacedBlock[] = [];
  private movingX = 0;
  private movingWidth = 0;
  private movingDir = 1;
  private speed = CFG.speedStart;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    super(canvas, callbacks, { ...initialState });
  }

  protected reset() {
    this.state = { ...initialState };
    this.speed = CFG.speedStart;
    const baseWidth = this.width * CFG.baseWidthRatio;
    this.blocks = [{ index: 0, x: (this.width - baseWidth) / 2, width: baseWidth, color: CFG.colors[0] }];
    this.spawnMovingBlock();
  }

  private spawnMovingBlock() {
    const prev = this.blocks[this.blocks.length - 1];
    this.movingWidth = prev.width;
    this.movingX = 0;
    this.movingDir = 1;
  }

  protected onTapStart(_point: TapPoint) {
    if (!this.state.running) return;
    this.dropBlock();
  }

  private dropBlock() {
    const prev = this.blocks[this.blocks.length - 1];
    const overlapStart = Math.max(prev.x, this.movingX);
    const overlapEnd = Math.min(prev.x + prev.width, this.movingX + this.movingWidth);
    const overlapWidth = overlapEnd - overlapStart;

    if (overlapWidth <= 0) {
      this.endGame();
      return;
    }

    const tolerance = prev.width * CFG.perfectToleranceRatio;
    const isPerfect = Math.abs(overlapWidth - prev.width) <= tolerance;
    const newWidth = isPerfect ? prev.width : overlapWidth;
    const newX = isPerfect ? prev.x : overlapStart;

    const layerIndex = this.blocks.length;
    const color = CFG.colors[layerIndex % CFG.colors.length];
    this.blocks.push({ index: layerIndex, x: newX, width: newWidth, color });

    this.state.combo = isPerfect ? this.state.combo + 1 : 0;
    this.state.score += CFG.baseScore + (isPerfect ? CFG.perfectBonus * (1 + this.state.combo * 0.1) : 0);
    this.emitState();

    this.speed = Math.min(CFG.speedMax, CFG.speedStart + layerIndex * CFG.speedRampPerLayer);
    this.spawnMovingBlock();
  }

  protected tick() {
    this.movingX += this.speed * this.movingDir;
    if (this.movingX <= 0) {
      this.movingX = 0;
      this.movingDir = 1;
    } else if (this.movingX + this.movingWidth >= this.width) {
      this.movingX = this.width - this.movingWidth;
      this.movingDir = -1;
    }

    this.draw();
  }

  private draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0A1F3C';
    ctx.fillRect(0, 0, w, h);

    const H = CFG.blockHeight;
    const visibleRows = Math.floor(h / H);
    const scrollTopIndex = Math.max(0, this.blocks.length - visibleRows + 2);

    const screenY = (layerIndex: number) => h - H * (layerIndex - scrollTopIndex + 1);

    for (const b of this.blocks) {
      const y = screenY(b.index);
      if (y < -H || y > h) continue;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, y, b.width, H - 2);
    }

    // moving block, one layer above the last placed block
    const movingY = screenY(this.blocks.length);
    ctx.fillStyle = CFG.colors[this.blocks.length % CFG.colors.length];
    ctx.globalAlpha = 0.9;
    ctx.fillRect(this.movingX, movingY, this.movingWidth, H - 2);
    ctx.globalAlpha = 1;
  }
}
