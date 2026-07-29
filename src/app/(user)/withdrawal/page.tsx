'use client';

import { MaskedAmount, BalanceToggleButton, useBalanceVisibility } from '../components/WalletBalance';
import { useWithdrawal } from './lib/useWithdrawal';
import PayoutMethodForm from './components/PayoutMethodForm';
import WithdrawalForm from './components/WithdrawalForm';

export default function WithdrawalPage() {
  const { status, loading, refresh, requestWithdrawal, savePayoutMethod } = useWithdrawal();
  const { visible, toggle } = useBalanceVisibility();

  return (
    <div className="px-4 pt-4 lg:max-w-3xl lg:px-0 lg:pt-2">
      <h1 className="font-display text-xl font-bold text-ink">Withdrawal</h1>
      <p className="mt-1 text-sm text-ink/60">Cash out your wallet once eligible.</p>

      {loading && <div className="mt-5 h-40 animate-pulse rounded-2xl bg-white/40" />}

      {status && (
        <>
          <div className="mt-5 flex items-center justify-between rounded-2xl bg-ink px-5 py-4 text-white shadow-card">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/60">Available Balance</p>
              <p className="font-display text-xl font-bold">
                <MaskedAmount amount={status.walletAmount} visible={visible} />
              </p>
            </div>
            <BalanceToggleButton visible={visible} onToggle={toggle} />
          </div>

          <div className="mt-5 space-y-4">
            {!status.payoutMethod && <PayoutMethodForm onSaved={savePayoutMethod} />}
            <WithdrawalForm status={status} onRequest={requestWithdrawal} onRefresh={refresh} />
          </div>
        </>
      )}
    </div>
  );
}
