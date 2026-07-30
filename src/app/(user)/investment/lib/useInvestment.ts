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

export type UserPackageStatus = {
  packageStatus: string;
  packageName?: string;
  isChangingPackage?: boolean;
} | null;

export function useInvestment() {
  const [packages, setPackages] = useState<InvestmentPackage[]>([]);
  const [bank, setBank] = useState<{ bankName: string; accountNumber: string; accountName: string } | null>(null);
  const [latestRequest, setLatestRequest] = useState<LatestRequest>(null);
  const [userPackage, setUserPackage] = useState<UserPackageStatus>(null);
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
      setUserPackage({
        packageStatus: data.packageStatus,
        packageName: data.packageName,
        isChangingPackage: data.isChangingPackage
      });
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

  const changePackage = useCallback(async (packageId: string, receiptUrl: string) => {
    const res = await authFetch('/api/investment/change-package', {
      method: 'POST',
      body: JSON.stringify({ packageId, receiptUrl })
    });
    const data = await res.json();
    if (res.ok) await load();
    return { ok: res.ok, error: data.error };
  }, [load]);

  const canChangePackage = userPackage && userPackage.packageStatus !== 'Free' && !userPackage.isChangingPackage;

  return { packages, bank, latestRequest, userPackage, loading, refresh: load, submitReceipt, changePackage, canChangePackage };
}
