'use client';

import type { RefObject } from 'react';

export default function GameCanvas({ canvasRef }: { canvasRef: RefObject<HTMLCanvasElement | null> }) {
  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full touch-none rounded-3xl bg-gradient-to-b from-ink to-brand-900"
    />
  );
}
