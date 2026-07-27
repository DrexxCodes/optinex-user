'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useWalletTransactions } from '../lib/useWalletTransactions';
import TransactionRow from '../../transactions/components/TransactionRow';

export default function RecentActivity() {
  const { transactions, loading } = useWalletTransactions();

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold text-ink">Recent Activity</h2>
        <Link href="/transactions" className="flex items-center gap-1 text-xs font-semibold text-brand-500">
          View All <ArrowRight size={12} />
        </Link>
      </div>

      <div className="mt-3 space-y-2">
        {loading && <p className="text-sm text-ink/40">Loading…</p>}
        {!loading && transactions.length === 0 && (
          <p className="glass-panel rounded-2xl p-4 text-sm text-ink/50">No transactions yet — go earn something!</p>
        )}
        {transactions.map((t) => (
          <TransactionRow key={t.id} transaction={t} />
        ))}
      </div>
    </div>
  );
}
