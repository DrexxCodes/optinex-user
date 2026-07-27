'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MenjaEngine } from './engine';
import type { GameState } from './engine/types';

export function useMenjaGame(onGameOver: (score: number) => void) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<MenjaEngine | null>(null);
  const [state, setState] = useState<GameState>({ score: 0, lives: 3, running: false, gameOver: false });

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new MenjaEngine(canvasRef.current, {
      onStateChange: setState,
      onGameOver
    });
    engineRef.current = engine;
    return () => engine.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(() => engineRef.current?.start(), []);
  const pause = useCallback(() => engineRef.current?.pause(), []);
  const resume = useCallback(() => engineRef.current?.resume(), []);

  return { canvasRef, state, start, pause, resume };
}
