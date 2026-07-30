'use client';

import { useCallback, useRef, useState } from 'react';
import { useSpin, type SpinResult } from '../../lib/useSpin';
import SpinWheel from './SpinWheel';
import type { PrizeId } from '../../lib/prizes';

export default function SpinTab() {
  const { spinsLeft, maxSpins, loading, spinning, error, spin } = useSpin();
  const [landOnPrizeId, setLandOnPrizeId] = useState<PrizeId | null>(null);
  const [banner, setBanner] = useState<{ label: string; amount: number } | null>(null);
  const [animating, setAnimating] = useState(false);
  const pendingResultRef = useRef<SpinResult | null>(null);

  const handleSpin = useCallback(async () => {
    setBanner(null);
    const result = await spin();
    if (result) {
      pendingResultRef.current = result;
      setAnimating(true);
      setLandOnPrizeId(result.prizeId);
    }
  }, [spin]);

  const handleSpinEnd = useCallback(() => {
    setAnimating(false);
    setLandOnPrizeId(null);
    if (pendingResultRef.current) {
      setBanner({ label: pendingResultRef.current.label, amount: pendingResultRef.current.amount });
      pendingResultRef.current = null;
    }
  }, []);

  return (
    <div>
      <p className="mt-1 text-center text-sm text-ink/60">
        {loading ? 'Loading your spins…' : `${spinsLeft} of ${maxSpins} spins left today`}
      </p>

      <div className="mt-6">
        <SpinWheel spinning={animating} landOnPrizeId={landOnPrizeId} onSpinEnd={handleSpinEnd} />
      </div>

      <button
        onClick={handleSpin}
        disabled={loading || spinning || animating || spinsLeft <= 0}
        className="mx-auto mt-6 flex items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 px-8 py-3 text-sm font-bold text-white shadow-glass transition active:scale-95 disabled:from-ink/20 disabled:to-ink/20 disabled:text-ink/40"
      >
        {spinning || animating ? 'Spinning…' : spinsLeft > 0 ? 'Spin the Wheel' : 'No Spins Left'}
      </button>

      {banner && (
        <p className="mt-4 text-center text-sm font-semibold text-emerald-600">
          {banner.amount > 0
            ? `🎉 You won ${banner.label} — added to your wallet!`
            : banner.label === 'Extra Spin'
              ? '🎁 Extra spin! Go again.'
              : 'No win this time — try again tomorrow!'}
        </p>
      )}
      {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}
    </div>
  );
}
