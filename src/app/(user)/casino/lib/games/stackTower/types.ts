import type { GameState } from '../../engine/types';

export type PlacedBlock = {
  index: number; // layer number, 0 = base
  x: number; // left edge, world coords
  width: number;
  color: string;
};

export type StackTowerState = GameState & { combo: number };
