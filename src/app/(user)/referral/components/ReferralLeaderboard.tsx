'use client';

import { Trophy } from 'lucide-react';
import { useReferralLeaderboard } from '../lib/useReferral';

const MEDAL_COLORS: Record<number, string> = {
  1: 'bg-amber-100 text-amber-600',
  2: 'bg-slate-100 text-slate-500',
  3: 'bg-orange-100 text-orange-600'
};

export default function ReferralLeaderboard() {
  const { state, loading, error } = useReferralLeaderboard();

  if (loading) {
    return <div className="mt-6 h-56 animate-pulse rounded-3xl bg-white/40" />;
  }

  if (error || !state) {
    return null;
  }

  const { leaderboard, you } = state;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2">
        <Trophy size={16} className="text-brand-500" />
        <h2 className="font-display text-sm font-bold text-ink">Top Referrers</h2>
      </div>

      {you && (
        <p className="mt-1 text-xs text-ink/60">
          Your rank is <span className="font-semibold text-brand-500">#{you.rank}</span> with {you.referrals}{' '}
          {you.referrals === 1 ? 'referral' : 'referrals'} · ₦{you.totalEarned.toLocaleString('en-NG')} earned.
        </p>
      )}

      {leaderboard.length === 0 ? (
        <p className="glass-panel mt-3 rounded-2xl p-4 text-sm text-ink/50">
          No referrals yet — be the first to top the board!
        </p>
      ) : (
        <div className="glass-panel mt-3 divide-y divide-ink/5 rounded-2xl shadow-card">
          {leaderboard.map((entry) => (
            <div key={entry.uid} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    MEDAL_COLORS[entry.rank] ?? 'bg-ink/5 text-ink/50'
                  }`}
                >
                  {entry.rank}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{entry.fullName}</p>
                  {entry.username && <p className="text-xs text-ink/50">@{entry.username}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-brand-500">{entry.referrals}</p>
                <p className="text-xs text-ink/45">₦{entry.totalEarned.toLocaleString('en-NG')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
