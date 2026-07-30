'use client';

import { useStreak } from '../lib/useStreak';
import CheckInButton from './CheckInButton';
import StreakHistory from './StreakHistory';

export default function StreakTab() {
  const { state, loading, checkingIn, error, reward, checkIn } = useStreak();

  return (
    <div>
      <p className="mt-1 text-center text-sm text-ink/60">Check in once every 24 hours for a ₦25.00 reward.</p>

      {loading && <div className="mx-auto mt-10 h-56 w-56 animate-pulse rounded-full bg-white/40" />}

      {state && (
        <>
          <div className="mt-8">
            <CheckInButton
              canCheckIn={state.canCheckIn}
              nextAvailableAt={state.nextAvailableAt}
              checkingIn={checkingIn}
              onCheckIn={checkIn}
            />
          </div>

          <p className="mt-4 text-center text-sm text-ink/60">
            Current streak: <span className="font-semibold text-ink">{state.streakCount} day{state.streakCount === 1 ? '' : 's'}</span>
          </p>

          {reward && (
            <p className="mt-2 text-center text-sm font-semibold text-emerald-600">
              +₦{reward.toFixed(2)} added to your wallet 🎉
            </p>
          )}
          {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}

          <StreakHistory history={state.history} />
        </>
      )}
    </div>
  );
}
