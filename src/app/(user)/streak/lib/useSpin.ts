'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';
import type { PrizeId } from './prizes';

export type SpinResult = {
  prizeId: PrizeId;
  label: string;
  amount: number;
};

export function useSpin() {
  const [spinsLeft, setSpinsLeft] = useState(0);
  const [maxSpins, setMaxSpins] = useState(3);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpinResult | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    const res = await authFetch('/api/streak/spin/status');
    if (res.ok) {
      const data = await res.json();
      setSpinsLeft(data.spinsLeft);
      setMaxSpins(data.maxSpins);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Resolves with the prize so the wheel component can animate to the
  // correct segment before updating spins-left / showing the banner.
  const spin = useCallback(async (): Promise<SpinResult | null> => {
    setError(null);
    setSpinning(true);
    try {
      const res = await authFetch('/api/streak/spin', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not spin right now.');
        return null;
      }
      setSpinsLeft(data.spinsLeft);
      const prizeResult: SpinResult = { prizeId: data.prizeId, label: data.label, amount: data.amount };
      setResult(prizeResult);
      return prizeResult;
    } finally {
      setSpinning(false);
    }
  }, []);

  return { spinsLeft, maxSpins, loading, spinning, error, result, spin };
}
