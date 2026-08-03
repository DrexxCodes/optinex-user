'use client';

import { useCallback, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';
import { useCasinoEngine } from '../lib/useCasinoEngine';
import { StackTowerEngine } from '../lib/games/stackTower/engine';
import type { StackTowerState } from '../lib/games/stackTower/types';
import GameCanvas from '../components/GameCanvas';
import GameHud from '../components/GameHud';
import { MainMenu, PauseMenu, GameOverMenu } from '../components/GameMenus';
import Leaderboard from '../components/Leaderboard';

const initialState: StackTowerState = { score: 0, lives: 1, running: false, gameOver: false, combo: 0 };

export default function StackTowerGame() {
  const [bestScore, setBestScore] = useState(0);
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const [screen, setScreen] = useState<'menu' | 'playing' | 'paused' | 'over'>('menu');

  const handleGameOver = useCallback(async (score: number) => {
    const finalScore = Math.round(score);
    setScreen('over');
    setBestScore((b) => Math.max(b, finalScore));
    await authFetch('/api/casino/submit-score', {
      method: 'POST',
      body: JSON.stringify({ score: finalScore, game: 'stack-tower' })
    });
    setLeaderboardKey((k) => k + 1);
  }, []);

  const { canvasRef, state, start, pause, resume } = useCasinoEngine(
    StackTowerEngine,
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
            centerContent={
              <span className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
                🔥 {state.combo} combo
              </span>
            }
          />
        )}
        {screen === 'menu' && (
          <MainMenu
            title="Stack Tower"
            subtitle="Tap to drop the block. Line it up with the layer below to keep width."
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

      <Leaderboard gameId="stack-tower" refreshKey={leaderboardKey} />
    </div>
  );
}
