'use client';

import { useUpgrade } from './lib/useUpgrade';
import UpgradeStatusCard from './components/UpgradeStatusCard';
import UpgradePaymentPanel from './components/UpgradePaymentPanel';

export default function UpgradePage() {
  const { price, bank, accountTier, upgradeStatus, latestRequest, loading, submitReceipt } = useUpgrade();

  return (
    <div className="px-4 pt-4 lg:max-w-3xl lg:px-0 lg:pt-2">
      <h1 className="font-display text-xl font-bold text-ink">Upgrade Account</h1>
      <p className="mt-1 text-sm text-ink/60">Unlock the full Optinex Africa experience with an upgraded account.</p>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-700">
            <span className="text-xs font-bold">!</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-900">Time-sensitive submission</p>
            <p className="mt-1 text-xs text-amber-800">
              You have 30 minutes to upload your payment receipt after initiating an upgrade. If you don&apos;t upload within this time, you&apos;ll need to wait 1 hour before trying again.
            </p>
          </div>
        </div>
      </div>

      {loading && <div className="mt-5 h-40 animate-pulse rounded-3xl bg-white/40" />}

      {!loading && (
        <>
          <div className="mt-4">
            <UpgradeStatusCard accountTier={accountTier} upgradeStatus={upgradeStatus} amount={latestRequest?.amount} />
          </div>

          {accountTier !== 'upgraded' && upgradeStatus !== 'pending' && (
            <UpgradePaymentPanel price={price} bank={bank} onSubmit={submitReceipt} />
          )}
        </>
      )}
    </div>
  );
}
