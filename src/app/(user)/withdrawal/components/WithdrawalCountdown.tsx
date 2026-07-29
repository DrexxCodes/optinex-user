'use client';

import { Clock } from 'lucide-react';
import { useCountdown } from '../lib/useCountdown';

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-white/80 px-3 py-2 shadow-sm">
      <span className="font-display text-lg font-bold tabular-nums text-ink">{String(value).padStart(2, '0')}</span>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-ink/40">{label}</span>
    </div>
  );
}

export default function WithdrawalCountdown({ targetDate, onExpire }: { targetDate: string; onExpire?: () => void }) {
  const parts = useCountdown(targetDate, onExpire);

  if (!parts) return null;

  // The tick that reaches zero calls onExpire, which re-fetches withdrawal
  // status — this just avoids flashing a stale "00:00:00:00" in the gap
  // before that fresh status lands.
  if (parts.expired) {
    return <p className="mt-3 text-sm font-medium text-emerald-600">Withdrawals are unlocking…</p>;
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink/50">
        <Clock size={13} />
        Withdrawals unlock in
      </div>
      <div className="mt-2 flex gap-2">
        <TimeBlock value={parts.days} label="Days" />
        <TimeBlock value={parts.hours} label="Hrs" />
        <TimeBlock value={parts.minutes} label="Min" />
        <TimeBlock value={parts.seconds} label="Sec" />
      </div>
      <p className="mt-2 text-xs text-ink/40">
        Unlocks {new Date(targetDate).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
      </p>
    </div>
  );
}
