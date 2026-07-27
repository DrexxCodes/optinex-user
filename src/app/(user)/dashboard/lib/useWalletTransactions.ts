'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';
import type { WalletTransaction } from '../../transactions/lib/useTransactions';

export type { WalletTransaction };

// Dashboard only ever needs a quick glance — five most recent transactions.
// The full, paginated history lives on the /transactions page.
const DASHBOARD_LIMIT = 5;

export function useWalletTransactions() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`/api/wallet/transactions?limit=${DASHBOARD_LIMIT}`)
      .then((res) => (res.ok ? res.json() : { transactions: [] }))
      .then((data) => setTransactions(data.transactions))
      .finally(() => setLoading(false));
  }, []);

  return { transactions, loading };
}
