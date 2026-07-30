'use client';

import Link from 'next/link';
import { MaskedAmount, BalanceToggleButton, useBalanceVisibility } from '../components/WalletBalance';
import { useWithdrawal } from './lib/useWithdrawal';
import { useCurrentUser } from '../lib/useCurrentUser';
import PayoutMethodForm from './components/PayoutMethodForm';
import WithdrawalForm from './components/WithdrawalForm';

export default function WithdrawalPage() {
  const { status, loading, refresh, requestWithdrawal, savePayoutMethod } = useWithdrawal();
  const { user } = useCurrentUser();
  const { visible, toggle } = useBalanceVisibility();

  return (
    <div className="px-4 pt-4 lg:max-w-3xl lg:px-0 lg:pt-2">
      <h1 className="font-display text-xl font-bold text-ink">Withdrawal</h1>
      <p className="mt-1 text-sm text-ink/60">Cash out your wallet once eligible.</p>

      {user && user.accountTier !== 'upgraded' && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-700">
              <span className="text-xs font-bold">!</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">Upgrade required</p>
              <p className="mt-1 text-xs text-amber-800">
                You&apos;ll need to{' '}
                <Link href="/upgrade" className="font-bold underline hover:text-amber-700">
                  upgrade your account
                </Link>{' '}
                to access withdrawals.
              </p>
            </div>
          </div>
        </div>
      )}

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
