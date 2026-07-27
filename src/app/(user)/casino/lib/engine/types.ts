export type Vec2 = { x: number; y: number };

export type TargetKind = 'cube' | 'bomb';

export type Target = {
  id: number;
  kind: TargetKind;
  pos: Vec2;
  vel: Vec2;
  rotation: number;
  spin: number;
  size: number;
  color: string;
  sliced: boolean;
  bornAt: number;
};

export type Particle = {
  pos: Vec2;
  vel: Vec2;
  color: string;
  size: number;
  bornAt: number;
  lifeMs: number;
};

export type SlicePoint = Vec2 & { t: number };

export type GameState = {
  score: number;
  lives: number;
  running: boolean;
  gameOver: boolean;
};

export type EngineCallbacks = {
  onStateChange?: (state: GameState) => void;
  onGameOver?: (finalScore: number) => void;
};
