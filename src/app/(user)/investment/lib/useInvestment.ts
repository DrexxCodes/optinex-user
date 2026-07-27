'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type InvestmentPackage = {
  id: string;
  name: string;
  price: number;
  duration: string;
  details: string[];
};

export type LatestRequest = {
  id: string;
  packageName: string;
  amount: number;
  status: 'pending' | 'active' | 'failed';
  reference: string;
} | null;

export function useInvestment() {
  const [packages, setPackages] = useState<InvestmentPackage[]>([]);
  const [bank, setBank] = useState<{ bankName: string; accountNumber: string; accountName: string } | null>(null);
  const [latestRequest, setLatestRequest] = useState<LatestRequest>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [packagesRes, statusRes] = await Promise.all([
      authFetch('/api/investment/packages'),
      authFetch('/api/investment/status')
    ]);
    if (packagesRes.ok) setPackages((await packagesRes.json()).packages);
    if (statusRes.ok) {
      const data = await statusRes.json();
      setBank(data.bank);
      setLatestRequest(data.latestRequest);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submitReceipt = useCallback(async (packageId: string, receiptUrl: string) => {
    const res = await authFetch('/api/investment/subscribe', {
      method: 'POST',
      body: JSON.stringify({ packageId, receiptUrl })
    });
    const data = await res.json();
    if (res.ok) await load();
    return { ok: res.ok, error: data.error };
  }, [load]);

  return { packages, bank, latestRequest, loading, refresh: load, submitReceipt };
}
