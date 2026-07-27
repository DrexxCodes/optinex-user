'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

type StreakState = {
  canCheckIn: boolean;
  nextAvailableAt: string | null;
  streakCount: number;
  history: { id: string; date: string; timestamp: string | null }[];
};

export function useStreak() {
  const [state, setState] = useState<StreakState | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reward, setReward] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await authFetch('/api/streak/history');
    if (res.ok) setState(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const checkIn = useCallback(async () => {
    setCheckingIn(true);
    setError(null);
    setReward(null);
    try {
      const res = await authFetch('/api/streak/checkin', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not check in.');
        return;
      }
      setReward(data.reward);
      await load();
    } finally {
      setCheckingIn(false);
    }
  }, [load]);

  return { state, loading, checkingIn, error, reward, checkIn };
}
