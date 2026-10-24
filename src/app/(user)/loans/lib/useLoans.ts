'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';
import type { LoanStage, LoanTimelineStep } from '@/lib/loans/config';
import type { LoanApplicationInput } from '@/lib/loans/validation';

export type Loan = {
  id: string;
  amount: number;
  status: LoanStage;
  reference: string;
  bankAccount: { accountNumber: string; bankCode: string; bankName: string; accountName: string };
  createdAt: string | null;
  timeline: LoanTimelineStep[];
};

export type LoansState = {
  allowed: boolean;
  blockCode: 'UPGRADE_REQUIRED' | 'PACKAGE_REQUIRED' | 'MORE_PACKAGES_REQUIRED' | null;
  reason: string | null;
  hasPending: boolean;
  limits: { min: number; max: number };
  loans: Loan[];
};

export type ApplyPayload = LoanApplicationInput;

export function useLoans() {
  const [state, setState] = useState<LoansState | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/loans');
      if (res.ok) setState(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const apply = useCallback(
    async (payload: ApplyPayload) => {
      const res = await authFetch('/api/loans/apply', { method: 'POST', body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) await load();
      return { ok: res.ok, error: data.error as string | undefined, reference: data.reference as string | undefined };
    },
    [load]
  );

  return { state, loading, refresh: load, apply };
}
