'use client';

import { useReferral } from './lib/useReferral';
import ReferralKeyCard from './components/ReferralKeyCard';
import ReferralStats from './components/ReferralStats';
import ReferredUsersList from './components/ReferredUsersList';
import ReferralLeaderboard from './components/ReferralLeaderboard';

export default function ReferralPage() {
  const { state, loading, generating, error, generate } = useReferral();

  return (
    <div className="px-4 pt-4 lg:max-w-3xl lg:px-0 lg:pt-2">
      <h1 className="font-display text-xl font-bold text-ink">Referral</h1>
      <p className="mt-1 text-sm text-ink/60">Invite friends and grow your network on Optinex Africa.</p>

      {loading && <div className="mt-5 h-40 animate-pulse rounded-3xl bg-white/40" />}

      {!loading && state && (
        <>
          <div className="mt-5">
            <ReferralKeyCard referralKey={state.referralKey} generating={generating} error={error} onGenerate={generate} />
          </div>

          {state.referralKey && (
            <>
              <ReferralStats connections={state.connections} totalEarned={state.totalEarned} />
              <ReferredUsersList connections={state.recentConnections} />
            </>
          )}
        </>
      )}

      <ReferralLeaderboard />
    </div>
  );
}
