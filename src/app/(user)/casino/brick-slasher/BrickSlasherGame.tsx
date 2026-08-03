'use client';

import { useCallback, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';
import { useMenjaGame } from '../lib/useMenjaGame';
import GameCanvas from '../components/GameCanvas';
import GameHud from '../components/GameHud';
import { MainMenu, PauseMenu, GameOverMenu } from '../components/GameMenus';
import Leaderboard from '../components/Leaderboard';

export default function BrickSlasherGame() {
  const [bestScore, setBestScore] = useState(0);
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const [screen, setScreen] = useState<'menu' | 'playing' | 'paused' | 'over'>('menu');

  const handleGameOver = useCallback(
    async (score: number) => {
      setScreen('over');
      setBestScore((b) => Math.max(b, score));
      await authFetch('/api/casino/submit-score', {
        method: 'POST',
        body: JSON.stringify({ score, game: 'brick-slasher' })
      });
      setLeaderboardKey((k) => k + 1);
    },
    []
  );

  const { canvasRef, state, start, pause, resume } = useMenjaGame(handleGameOver);

  return (
    <div>
      <div className="relative mt-4 aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-glass">
        <GameCanvas canvasRef={canvasRef} />
        {screen === 'playing' && <GameHud state={state} onPause={() => { pause(); setScreen('paused'); }} />}
        {screen === 'menu' && (
          <MainMenu
            title="Brick Slasher"
            subtitle="Swipe across the cubes and avoid the bombs!"
            onStart={() => { start(); setScreen('playing'); }}
          />
        )}
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

      <Leaderboard gameId="brick-slasher" refreshKey={leaderboardKey} />
    </div>
  );
}
