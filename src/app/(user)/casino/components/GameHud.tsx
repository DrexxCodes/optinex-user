import type { ReactNode } from 'react';
import { Heart, Pause } from 'lucide-react';
import type { GameState } from '../lib/engine/types';

type GameHudProps = {
  state: GameState;
  onPause: () => void;
  /** Overrides the default hearts readout — e.g. "Round 2/5" or a combo streak. */
  centerContent?: ReactNode;
  /** Number of heart slots to render when `centerContent` isn't provided. */
  livesMax?: number;
};

export default function GameHud({ state, onPause, centerContent, livesMax = 3 }: GameHudProps) {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
      <div className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
        {state.score.toLocaleString()} pts
      </div>
      <div className="flex items-center gap-1">
        {centerContent ??
          Array.from({ length: livesMax }).map((_, i) => (
            <Heart
              key={i}
              size={18}
              className={i < state.lives ? 'fill-red-500 text-red-500' : 'text-white/25'}
            />
          ))}
      </div>
      <button
        onClick={onPause}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm"
        aria-label="Pause"
      >
        <Pause size={16} />
      </button>
    </div>
  );
}
