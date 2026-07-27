import { Users, Wallet } from 'lucide-react';

export default function ReferralStats({ connections, totalEarned }: { connections: number; totalEarned: number }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="glass-panel rounded-2xl p-4 shadow-card">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
          <Users size={16} />
        </span>
        <p className="mt-2.5 font-display text-xl font-bold text-ink">{connections}</p>
        <p className="text-xs text-ink/50">Connections</p>
      </div>
      <div className="glass-panel rounded-2xl p-4 shadow-card">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
          <Wallet size={16} />
        </span>
        <p className="mt-2.5 font-display text-xl font-bold text-ink">
          ₦{totalEarned.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-ink/50">Earned</p>
      </div>
    </div>
  );
}
