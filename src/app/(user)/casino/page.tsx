'use client';

import { useState } from 'react';
import { GAMES, type GameId } from './games';
import GameTabs from './components/GameTabs';
import BrickSlasherGame from './brick-slasher/BrickSlasherGame';
import ReactionTapGame from './reaction-tap/ReactionTapGame';
import StackTowerGame from './stack-tower/StackTowerGame';
import EndlessRunnerGame from './endless-runner/EndlessRunnerGame';

export default function CasinoPage() {
  const [active, setActive] = useState<GameId>('brick-slasher');
  const activeGame = GAMES.find((g) => g.id === active)!;

  return (
    <div className="px-4 pt-4 lg:max-w-3xl lg:px-0 lg:pt-2">
      <h1 className="font-display text-xl font-bold text-ink">{activeGame.label}</h1>
      <p className="mt-1 text-sm text-ink/60">{activeGame.tagline}</p>

      <GameTabs active={active} onChange={setActive} />

      {active === 'brick-slasher' && <BrickSlasherGame />}
      {active === 'reaction-tap' && <ReactionTapGame />}
      {active === 'stack-tower' && <StackTowerGame />}
      {active === 'endless-runner' && <EndlessRunnerGame />}
    </div>
  );
}
