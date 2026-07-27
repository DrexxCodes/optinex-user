import { Play, RotateCcw } from 'lucide-react';

export function MainMenu({ onStart }: { onStart: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-3xl bg-ink/70 backdrop-blur-sm">
      <h2 className="font-display text-2xl font-bold text-white">Brick Slasher</h2>
      <p className="max-w-[220px] text-center text-sm text-white/70">Swipe across the cubes — avoid the bombs!</p>
      <button
        onClick={onStart}
        className="flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white"
      >
        <Play size={16} /> Play
      </button>
    </div>
  );
}

export function PauseMenu({ onResume }: { onResume: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 rounded-3xl bg-ink/70 backdrop-blur-sm">
      <h2 className="font-display text-xl font-bold text-white">Paused</h2>
      <button onClick={onResume} className="rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white">
        Resume
      </button>
    </div>
  );
}

export function GameOverMenu({ score, best, onPlayAgain }: { score: number; best: number; onPlayAgain: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-3xl bg-ink/70 backdrop-blur-sm">
      <h2 className="font-display text-xl font-bold text-white">Game Over</h2>
      <p className="font-display text-3xl font-bold text-brand-300">{score.toLocaleString()} pts</p>
      <p className="text-xs text-white/60">Best: {best.toLocaleString()} pts</p>
      <button
        onClick={onPlayAgain}
        className="mt-2 flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white"
      >
        <RotateCcw size={16} /> Play Again
      </button>
    </div>
  );
}
