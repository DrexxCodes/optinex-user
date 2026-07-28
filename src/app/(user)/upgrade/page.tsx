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
