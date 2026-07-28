'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type UpgradeBank = { bankName: string; accountNumber: string; accountName: string };
export type LatestUpgradeRequest = { id: string; amount: number; status: 'pending' | 'active' | 'failed'; reference: string } | null;

export function useUpgrade() {
  const [price, setPrice] = useState<number | null>(null);
  const [bank, setBank] = useState<UpgradeBank | null>(null);
  const [accountTier, setAccountTier] = useState<'standard' | 'upgraded'>('standard');
  const [upgradeStatus, setUpgradeStatus] = useState<'none' | 'pending' | 'active'>('none');
  const [latestRequest, setLatestRequest] = useState<LatestUpgradeRequest>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/upgrade/status');
      if (res.ok) {
        const data = await res.json();
        setPrice(data.price);
        setBank(data.bank);
        setAccountTier(data.accountTier);
        setUpgradeStatus(data.upgradeStatus);
        setLatestRequest(data.latestRequest);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submitReceipt = useCallback(
    async (receiptUrl: string) => {
      const res = await authFetch('/api/upgrade/subscribe', { method: 'POST', body: JSON.stringify({ receiptUrl }) });
      const data = await res.json();
      if (res.ok) await load();
      return { ok: res.ok, error: data.error };
    },
    [load]
  );

  return { price, bank, accountTier, upgradeStatus, latestRequest, loading, refresh: load, submitReceipt };
}
