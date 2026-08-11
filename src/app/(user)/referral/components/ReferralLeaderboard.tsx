'use client';

import { Crown, Trophy } from 'lucide-react';
import type { LeaderboardEntry } from '../lib/useReferral';
import { useReferralLeaderboard } from '../lib/useReferral';

const MEDAL_COLORS: Record<number, string> = {
  1: 'bg-amber-100 text-amber-600',
  2: 'bg-slate-100 text-slate-500',
  3: 'bg-orange-100 text-orange-600'
};

const PODIUM_RING: Record<number, string> = {
  1: 'ring-amber-300',
  2: 'ring-slate-300',
  3: 'ring-orange-300'
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function PodiumCard({ entry, variant }: { entry: LeaderboardEntry; variant: 'first' | 'second' | 'third' }) {
  const isFirst = variant === 'first';
  const avatarSize = isFirst ? 'h-16 w-16 text-lg' : 'h-12 w-12 text-sm';

  return (
    <div className={`flex flex-col items-center ${isFirst ? '' : 'mt-6'}`}>
      {isFirst && <Crown size={20} className="mb-1 fill-amber-400 text-amber-500" />}
      <div
        className={`flex ${avatarSize} items-center justify-center rounded-full font-bold ring-4 ${
          PODIUM_RING[entry.rank] ?? 'ring-ink/10'
        } ${MEDAL_COLORS[entry.rank] ?? 'bg-ink/5 text-ink/50'}`}
      >
        {initials(entry.fullName) || entry.rank}
      </div>
      <p className={`mt-2 max-w-[6.5rem] truncate text-center font-semibold text-ink ${isFirst ? 'text-sm' : 'text-xs'}`}>
        {entry.fullName}
      </p>
      {entry.username && <p className="max-w-[6.5rem] truncate text-center text-[11px] text-ink/50">@{entry.username}</p>}
      <span
        className={`mt-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
          MEDAL_COLORS[entry.rank] ?? 'bg-ink/5 text-ink/50'
        }`}
      >
        #{entry.rank}
      </span>
      <p className="mt-1 text-xs font-semibold text-brand-500">
        {entry.referrals} {entry.referrals === 1 ? 'referral' : 'referrals'}
      </p>
      <p className="text-[11px] text-ink/45">₦{entry.totalEarned.toLocaleString('en-NG')}</p>
    </div>
  );
}

export default function ReferralLeaderboard() {
  const { state, loading, error } = useReferralLeaderboard();

  if (loading) {
    return <div className="mt-6 h-56 animate-pulse rounded-3xl bg-white/40" />;
  }

  if (error || !state) {
    return null;
  }

  const { leaderboard, you } = state;
  const [first, second, third, ...rest] = leaderboard;

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
        <>
          {first && (
            <div className="glass-panel mt-3 rounded-2xl px-4 pb-5 pt-4 shadow-card">
              <div className="flex items-start justify-center gap-6">
                {second && <PodiumCard entry={second} variant="second" />}
                <PodiumCard entry={first} variant="first" />
                {third && <PodiumCard entry={third} variant="third" />}
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div className="glass-panel mt-3 divide-y divide-ink/5 rounded-2xl shadow-card">
              {rest.map((entry) => (
                <div key={entry.uid} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-xs font-bold text-ink/50">
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
        </>
      )}
    </div>
  );
}
