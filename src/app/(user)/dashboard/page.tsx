'use client';

import { useCurrentUser } from '../lib/useCurrentUser';
import WalletCard from './components/WalletCard';
import QuickActions from './components/QuickActions';
import RecentActivity from './components/RecentActivity';
import ReferralSummaryCard from './components/ReferralSummaryCard';

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

export default function DashboardPage() {
  const { user, loading } = useCurrentUser();

  return (
    <div className="px-4 pt-4 lg:px-0 lg:pt-2">
      <p className="font-display text-xs font-semibold uppercase tracking-wide text-ink/40 lg:hidden">
        Good {timeOfDay()}
      </p>

      {loading && <div className="mt-4 h-40 animate-pulse rounded-3xl bg-white/40 lg:h-52" />}

      {user && (
        <div className="mt-3 lg:mt-2 lg:grid lg:grid-cols-3 lg:items-start lg:gap-6">
          <div className="lg:col-span-2">
            <WalletCard user={user} />
            <QuickActions />
          </div>
          <div className="lg:col-span-1">
            <RecentActivity />
            <ReferralSummaryCard />
          </div>
        </div>
      )}
    </div>
  );
}
