'use client';

import { useEffect, useRef, useState } from 'react';
import { PRIZES, type PrizeId } from '../../lib/prizes';

const SEGMENT_ANGLE = 360 / PRIZES.length;
const LABEL_RADIUS = 88; // px from wheel center — keeps labels inside the 128px wheel radius

function buildConicGradient() {
  const stops = PRIZES.map((p, i) => `${p.color} ${i * SEGMENT_ANGLE}deg ${(i + 1) * SEGMENT_ANGLE}deg`);
  return `conic-gradient(${stops.join(', ')})`;
}

// Position for a label at the middle of segment `i`, measured clockwise from
// the top (12 o'clock = 0deg), same convention as the conic-gradient and the
// landing-rotation math below.
function labelPosition(i: number) {
  const angleDeg = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
  const rad = (angleDeg * Math.PI) / 180;
  const x = LABEL_RADIUS * Math.sin(rad);
  const y = -LABEL_RADIUS * Math.cos(rad);
  return { x, y };
}

export default function SpinWheel({
  spinning,
  landOnPrizeId,
  onSpinEnd
}: {
  spinning: boolean;
  // Set the instant the server responds with a result; the wheel animates
  // to this prize's segment then calls onSpinEnd.
  landOnPrizeId: PrizeId | null;
  onSpinEnd: () => void;
}) {
  const [rotation, setRotation] = useState(0);
  const spinCountRef = useRef(0);

  useEffect(() => {
    if (!landOnPrizeId) return;
    const index = PRIZES.findIndex((p) => p.id === landOnPrizeId);
    if (index === -1) return;

    spinCountRef.current += 1;
    // Land the pointer (fixed at the top, 0deg) in the middle of the target
    // segment. Add several full turns so every spin feels like a real spin,
    // and nudge with a tiny random offset within the segment for realism.
    const segmentMiddle = index * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const jitter = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.5);
    const fullTurns = 5 * 360;
    const target = fullTurns + (360 - segmentMiddle + jitter);

    setRotation((prev) => prev - (prev % 360) + target);

    const timeout = setTimeout(onSpinEnd, 4200);
    return () => clearTimeout(timeout);
  }, [landOnPrizeId, onSpinEnd]);

  return (
    <div className="relative mx-auto flex h-72 w-72 items-center justify-center">
      {/* Pointer */}
      <div className="absolute top-0 z-10 h-0 w-0 -translate-y-1 border-x-[10px] border-t-[18px] border-x-transparent border-t-brand-700" />

      <div
        className="relative h-64 w-64 rounded-full border-4 border-white shadow-glass transition-transform duration-[4000ms] ease-out"
        style={{ background: buildConicGradient(), transform: `rotate(${rotation}deg)` }}
      >
        {PRIZES.map((p, i) => {
          const { x, y } = labelPosition(i);
          return (
            <div
              key={p.id}
              className="absolute flex w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-center text-[11px] font-bold leading-tight text-white drop-shadow"
              style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
            >
              {p.label}
            </div>
          );
        })}
      </div>

      <div className="absolute h-10 w-10 rounded-full border-2 border-brand-500 bg-white shadow-card" />
      {spinning && (
        <div className="absolute inset-0 rounded-full bg-black/5" aria-hidden />
      )}
    </div>
  );
}
