'use client';

import { GAMES, type GameId } from '../games';

export default function GameTabs({ active, onChange }: { active: GameId; onChange: (id: GameId) => void }) {
  return (
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
      {GAMES.map((g) => (
        <button
          key={g.id}
          onClick={() => onChange(g.id)}
          className={
            active === g.id
              ? 'shrink-0 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white'
              : 'shrink-0 rounded-full bg-white/60 px-4 py-2 text-sm font-medium text-ink/60'
          }
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}
