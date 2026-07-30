'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowDownToLine, TrendingUp, Clock, ChevronsUp } from 'lucide-react';
import { MaskedAmount, BalanceToggleButton, useBalanceVisibility } from '../../components/WalletBalance';
import { formatTimeRemaining } from '@/lib/timerUtils';
import type { CurrentUser } from '../../lib/useCurrentUser';

export default function WalletCard({ user }: { user: CurrentUser }) {
  const { visible, toggle } = useBalanceVisibility();
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!user.packageExpiresAt || user.packageStatus === 'Free') return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = user.packageExpiresAt! - now;
      if (remaining > 0) {
        setTimeRemaining(formatTimeRemaining(remaining));
      } else {
        setTimeRemaining(null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [user.packageExpiresAt, user.packageStatus]);

  return (
    <div className="animate-fade-up rounded-3xl bg-gradient-to-br from-brand-500 to-brand-800 p-6 text-white shadow-glass">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-white/70">Wallet Balance</span>
        <BalanceToggleButton visible={visible} onToggle={toggle} />
      </div>
      <p className="mt-2 font-display text-3xl font-bold">
        <MaskedAmount amount={user.walletAmount} visible={visible} />
      </p>
      <div className="mt-3 space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
          {user.packageStatus}
        </div>
        {timeRemaining && user.packageStatus !== 'Free' && (
          <div className="ml-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold">
            <Clock size={12} /> {timeRemaining}
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Link
          href="/investment"
          className="flex items-center justify-center gap-2 rounded-xl bg-white/15 py-3 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/25"
        >
          <TrendingUp size={16} /> Invest
        </Link>
        <Link
          href="/withdrawal"
          className="flex items-center justify-center gap-2 rounded-xl bg-white text-brand-600 py-3 text-sm font-semibold transition hover:bg-white/90"
        >
          <ArrowDownToLine size={16} /> Withdraw
        </Link>
      </div>

      {user.packageStatus === 'Free' && (
        <Link
          href="/upgrade"
          className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
        >
          <ChevronsUp size={16} />
          {user.upgradeStatus === 'pending' ? 'Upgrade Pending Verification' : 'Upgrade Account'}
        </Link>
      )}
    </div>
  );
}
