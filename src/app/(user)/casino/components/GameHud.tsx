import { Heart, Pause } from 'lucide-react';
import type { GameState } from '../lib/engine/types';

export default function GameHud({ state, onPause }: { state: GameState; onPause: () => void }) {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
      <div className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
        {state.score.toLocaleString()} pts
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
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
