'use client';

import { useEffect, useState } from 'react';
import { Flame, Check } from 'lucide-react';

function formatCountdown(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${h}h ${m}m ${s}s`;
}

export default function CheckInButton({
  canCheckIn,
  nextAvailableAt,
  checkingIn,
  onCheckIn
}: {
  canCheckIn: boolean;
  nextAvailableAt: string | null;
  checkingIn: boolean;
  onCheckIn: () => void;
}) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (canCheckIn) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [canCheckIn]);

  const remaining = nextAvailableAt ? new Date(nextAvailableAt).getTime() - now : 0;

  return (
    <div className="relative mx-auto flex h-56 w-56 items-center justify-center">
      <div className={`absolute inset-0 rounded-full bg-brand-500/10 ${canCheckIn ? 'animate-pulse' : ''}`} />
      <button
        onClick={onCheckIn}
        disabled={!canCheckIn || checkingIn}
        className="relative flex h-44 w-44 flex-col items-center justify-center gap-2 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-glass transition active:scale-95 disabled:from-ink/20 disabled:to-ink/20 disabled:text-ink/40"
      >
        {canCheckIn ? <Flame size={34} /> : <Check size={34} />}
        <span className="font-display text-lg font-bold">{canCheckIn ? (checkingIn ? 'Checking in…' : 'Check In') : 'Checked In'}</span>
        {!canCheckIn && remaining > 0 && <span className="text-xs opacity-70">{formatCountdown(remaining)}</span>}
      </button>
    </div>
  );
}
