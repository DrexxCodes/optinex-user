'use client';

import { useCallback, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';
import { useCasinoEngine } from '../lib/useCasinoEngine';
import { EndlessRunnerEngine } from '../lib/games/endlessRunner/engine';
import type { GameState } from '../lib/engine/types';
import GameCanvas from '../components/GameCanvas';
import GameHud from '../components/GameHud';
import { MainMenu, PauseMenu, GameOverMenu } from '../components/GameMenus';
import Leaderboard from '../components/Leaderboard';

const initialState: GameState = { score: 0, lives: 1, running: false, gameOver: false };

export default function EndlessRunnerGame() {
  const [bestScore, setBestScore] = useState(0);
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const [screen, setScreen] = useState<'menu' | 'playing' | 'paused' | 'over'>('menu');

  const handleGameOver = useCallback(async (score: number) => {
    const finalScore = Math.round(score);
    setScreen('over');
    setBestScore((b) => Math.max(b, finalScore));
    await authFetch('/api/casino/submit-score', {
      method: 'POST',
      body: JSON.stringify({ score: finalScore, game: 'endless-runner' })
    });
    setLeaderboardKey((k) => k + 1);
  }, []);

  const { canvasRef, state, start, pause, resume } = useCasinoEngine(
    EndlessRunnerEngine,
    handleGameOver,
    initialState
  );

  return (
    <div>
      <div className="relative mt-4 aspect-[3/4] w-full overflow-hidden rounded-3xl shadow-glass">
        <GameCanvas canvasRef={canvasRef} />
        {screen === 'playing' && (
          <GameHud
            state={state}
            onPause={() => {
              pause();
              setScreen('paused');
            }}
            livesMax={1}
          />
        )}
        {screen === 'menu' && (
          <MainMenu
            title="Endless Runner"
            subtitle="Tap to jump. Clear the obstacles and survive as long as you can."
            onStart={() => {
              start();
              setScreen('playing');
            }}
          />
        )}
        {screen === 'paused' && (
          <PauseMenu
            onResume={() => {
              resume();
              setScreen('playing');
            }}
          />
        )}
        {screen === 'over' && (
          <GameOverMenu
            score={Math.round(state.score)}
            best={Math.round(bestScore)}
            onPlayAgain={() => {
              start();
              setScreen('playing');
            }}
          />
        )}
      </div>

      <Leaderboard gameId="endless-runner" refreshKey={leaderboardKey} />
    </div>
  );
}
