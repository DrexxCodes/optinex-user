'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type ReferralConnection = {
  uid: string;
  fullName: string;
  username: string;
  joinedAt: string | null;
};

export type ReferralState = {
  referralKey: string | null;
  connections: number;
  totalEarned: number;
  recentConnections: ReferralConnection[];
};

export function useReferral() {
  const [state, setState] = useState<ReferralState | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/referral');
      if (res.ok) setState(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const generate = useCallback(async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await authFetch('/api/referral/generate', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not create your referral link.');
        return false;
      }
      await load();
      return true;
    } finally {
      setGenerating(false);
    }
  }, [load]);

  return { state, loading, generating, error, generate, refresh: load };
}

export type LeaderboardEntry = {
  uid: string;
  fullName: string;
  username: string;
  referrals: number;
  totalEarned: number;
  rank: number;
};

export type LeaderboardState = {
  leaderboard: LeaderboardEntry[];
  you: { rank: number; referrals: number; totalEarned: number } | null;
};

export function useReferralLeaderboard() {
  const [state, setState] = useState<LeaderboardState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/referral/leaderboard');
      const data = await res.json();
      if (res.ok) {
        setState(data);
      } else {
        setError(data.error ?? 'Could not load the leaderboard.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { state, loading, error, refresh: load };
}

export function referralLink(referralKey: string): string {
  if (typeof window === 'undefined') return `https://optinexglobal.com/auth/signup?ref=${referralKey}`;
  return `${window.location.origin}/auth/signup?ref=${referralKey}`;
}
