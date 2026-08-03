'use client';

// Generic version of useMenjaGame for the new (BaseCanvasEngine-based) games,
// so Reaction Tap / Stack Tower / Endless Runner don't each need their own
// copy of the same ref/state wiring.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { EngineCallbacks, GameState } from './engine/types';

type EngineLike = {
  start(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
};

export function useCasinoEngine<TState extends GameState, TEngine extends EngineLike>(
  EngineCtor: new (canvas: HTMLCanvasElement, callbacks: EngineCallbacks) => TEngine,
  onGameOver: (score: number) => void,
  initialState: TState
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<TEngine | null>(null);
  const [state, setState] = useState<TState>(initialState);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new EngineCtor(canvasRef.current, {
      onStateChange: (s) => setState(s as TState),
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
