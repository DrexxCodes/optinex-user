'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type WithdrawalStatus = {
  allowed: boolean;
  reason: string | null;
  enabledDate: string | null;
  packageStatus: string;
  payoutMethod: {
    accountNumber: string;
    bankCode: string;
    bankName: string;
    accountName: string;
  } | null;
  walletAmount: number;
};

export function useWithdrawal() {
  const [status, setStatus] = useState<WithdrawalStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await authFetch('/api/withdrawal/status');
    if (res.ok) setStatus(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const requestWithdrawal = useCallback(
    async (amount: number) => {
      const res = await authFetch('/api/withdrawal/request', {
        method: 'POST',
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (res.ok) await load();
      return { ok: res.ok, error: data.error, reference: data.reference };
    },
    [load]
  );

  const savePayoutMethod = useCallback(
    async (payload: { accountNumber: string; bankCode: string; bankName: string; accountName: string }) => {
      const res = await authFetch('/api/withdrawal/payout-method', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.ok) await load();
      return res.ok;
    },
    [load]
  );

  return { status, loading, refresh: load, requestWithdrawal, savePayoutMethod };
}
