'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type WalletTransaction = {
  id: string;
  txnType: 'credit' | 'debit';
  txnName: string;
  amount: number;
  txnRef: string;
  timestamp: string | null;
};

const PAGE_SIZE = 20;

export function useTransactions() {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/wallet/transactions?limit=${PAGE_SIZE}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions);
        setHasMore(data.hasMore);
        setCursor(data.nextCursor);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await authFetch(`/api/wallet/transactions?limit=${PAGE_SIZE}&cursor=${cursor}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions((prev) => [...prev, ...data.transactions]);
        setHasMore(data.hasMore);
        setCursor(data.nextCursor);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore]);

  return { transactions, loading, loadingMore, hasMore, loadMore };
}
