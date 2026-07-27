'use client';

import { useCallback, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';
import { useMenjaGame } from './lib/useMenjaGame';
import GameCanvas from './components/GameCanvas';
import GameHud from './components/GameHud';
import { MainMenu, PauseMenu, GameOverMenu } from './components/GameMenus';
import Leaderboard from './components/Leaderboard';

export default function CasinoPage() {
  const [bestScore, setBestScore] = useState(0);
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const [screen, setScreen] = useState<'menu' | 'playing' | 'paused' | 'over'>('menu');

  const handleGameOver = useCallback(
    async (score: number) => {
      setScreen('over');
      setBestScore((b) => Math.max(b, score));
      await authFetch('/api/casino/submit-score', { method: 'POST', body: JSON.stringify({ score }) });
      setLeaderboardKey((k) => k + 1);
    },
    []
  );

  const { canvasRef, state, start, pause, resume } = useMenjaGame(handleGameOver);

  return (
    <div className="px-4 pt-4 lg:max-w-3xl lg:px-0 lg:pt-2">
      <h1 className="font-display text-xl font-bold text-ink">Brick Slasher</h1>
      <p className="mt-1 text-sm text-ink/60">Swipe to slice cubes, dodge the bombs, and top the leaderboard.</p>

      <div className="relative mt-4 aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-glass">
        <GameCanvas canvasRef={canvasRef} />
        {screen === 'playing' && <GameHud state={state} onPause={() => { pause(); setScreen('paused'); }} />}
        {screen === 'menu' && <MainMenu onStart={() => { start(); setScreen('playing'); }} />}
        {screen === 'paused' && <PauseMenu onResume={() => { resume(); setScreen('playing'); }} />}
        {screen === 'over' && (
          <GameOverMenu
            score={state.score}
            best={bestScore}
            onPlayAgain={() => {
              start();
              setScreen('playing');
            }}
          />
        )}
      </div>

      <Leaderboard refreshKey={leaderboardKey} />
    </div>
  );
}
