'use client';

import { useCallback, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';
import { useCasinoEngine } from '../lib/useCasinoEngine';
import { ReactionTapEngine, type ReactionTapState } from '../lib/games/reactionTap/engine';
import { REACTION_CONFIG } from '../lib/games/reactionTap/config';
import GameCanvas from '../components/GameCanvas';
import GameHud from '../components/GameHud';
import { MainMenu, PauseMenu, GameOverMenu } from '../components/GameMenus';
import Leaderboard from '../components/Leaderboard';

const initialState: ReactionTapState = {
  score: 0,
  lives: REACTION_CONFIG.totalRounds,
  running: false,
  gameOver: false,
  round: 0,
  phase: 'waiting',
  lastReactionMs: null
};

export default function ReactionTapGame() {
  const [bestScore, setBestScore] = useState(0);
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const [screen, setScreen] = useState<'menu' | 'playing' | 'paused' | 'over'>('menu');

  const handleGameOver = useCallback(async (score: number) => {
    setScreen('over');
    setBestScore((b) => Math.max(b, score));
    await authFetch('/api/casino/submit-score', {
      method: 'POST',
      body: JSON.stringify({ score, game: 'reaction-tap' })
    });
    setLeaderboardKey((k) => k + 1);
  }, []);

  const { canvasRef, state, start, pause, resume } = useCasinoEngine(
    ReactionTapEngine,
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
                Round {state.round}/{REACTION_CONFIG.totalRounds}
              </span>
            }
          />
        )}
        {screen === 'menu' && (
          <MainMenu
            title="Reaction Tap"
            subtitle={`Tap the instant the screen flashes green. ${REACTION_CONFIG.totalRounds} rounds, fastest total wins.`}
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
            score={state.score}
            best={bestScore}
            onPlayAgain={() => {
              start();
              setScreen('playing');
            }}
          />
        )}
      </div>

      <Leaderboard gameId="reaction-tap" refreshKey={leaderboardKey} />
    </div>
  );
}
