'use client';

import { useTransactions } from './lib/useTransactions';
import TransactionRow from './components/TransactionRow';

export default function TransactionsPage() {
  const { transactions, loading, loadingMore, hasMore, loadMore } = useTransactions();

  return (
    <div className="px-4 pt-4 lg:max-w-3xl lg:px-0 lg:pt-2">
      <h1 className="font-display text-xl font-bold text-ink">Transaction History</h1>
      <p className="mt-1 text-sm text-ink/60">Every credit and debit to your wallet, most recent first.</p>

      <div className="mt-5 space-y-2">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/40" />)}

        {!loading && transactions.length === 0 && (
          <p className="glass-panel rounded-2xl p-4 text-sm text-ink/50">No transactions yet — go earn something!</p>
        )}

        {transactions.map((t) => (
          <TransactionRow key={t.id} transaction={t} />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="mt-4 w-full rounded-xl bg-white/70 py-3 text-sm font-semibold text-ink/70 shadow-card transition hover:bg-white disabled:opacity-60"
        >
          {loadingMore ? 'Loading…' : 'Load More'}
        </button>
      )}
    </div>
  );
}
