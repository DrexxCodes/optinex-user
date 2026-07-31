'use client';

import { useState } from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { useInvestment, type InvestmentPackage } from './lib/useInvestment';
import PackageCard from './components/PackageCard';
import PaymentDialog from './components/PaymentDialog';

export default function InvestmentPage() {
  const { packages, bank, latestRequest, userPackage, canChangePackage, loading, refresh, submitReceipt } =
    useInvestment();
  const [selected, setSelected] = useState<InvestmentPackage | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <div className="px-4 pt-4 lg:max-w-3xl lg:px-0 lg:pt-2">
      <h1 className="font-display text-xl font-bold text-ink">Investment Packages</h1>
      <p className="mt-1 text-sm text-ink/60">Every account starts on Free — subscribe to unlock withdrawals.</p>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-700">
            <span className="text-xs font-bold">!</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">Users Please Note</p>
            <p className="mt-1 text-xs text-amber-800">
              Please do not make payments using fintech apps like Opay, PalmPay, or Paga. Use only traditional banking methods to avoid reversals.
            </p>
          </div>
        </div>
      </div>

      {latestRequest?.status === 'pending' && (
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-amber-700">
            <Clock size={16} />
            <div>
              <p className="text-sm font-semibold">Pending verification</p>
              <p className="text-xs text-amber-600/80">{latestRequest.packageName} — ₦{latestRequest.amount.toLocaleString()}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700"
            aria-label="Refresh status"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {loading &&
          Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-white/40" />)}

        {!loading && packages.length === 0 && (
          <p className="glass-panel rounded-2xl p-4 text-sm text-ink/50">No packages available right now.</p>
        )}

        {packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            onPay={setSelected}
            isCurrentPackage={!!userPackage?.packageId && userPackage.packageId === pkg.id}
            canChange={!!canChangePackage}
          />
        ))}
      </div>

      {selected && (
        <PaymentDialog
          pkg={selected}
          bank={bank}
          onClose={() => setSelected(null)}
          onSubmit={submitReceipt}
        />
      )}
    </div>
  );
}
