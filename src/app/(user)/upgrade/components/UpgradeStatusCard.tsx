import { ShieldCheck, Clock } from 'lucide-react';

export default function UpgradeStatusCard({
  accountTier,
  upgradeStatus,
  amount
}: {
  accountTier: 'standard' | 'upgraded';
  upgradeStatus: 'none' | 'pending' | 'active';
  amount?: number;
}) {
  if (accountTier === 'upgraded') {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3.5">
        <ShieldCheck size={18} className="text-emerald-500" />
        <div>
          <p className="text-sm font-semibold text-emerald-700">Your account is upgraded</p>
          <p className="text-xs text-emerald-600/80">You have full access to every upgraded-account benefit.</p>
        </div>
      </div>
    );
  }

  if (upgradeStatus === 'pending') {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-amber-50 px-4 py-3.5">
        <Clock size={18} className="text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-700">Pending verification</p>
          <p className="text-xs text-amber-600/80">
            {amount ? `₦${amount.toLocaleString()} — ` : ''}We'll upgrade your account once your receipt is verified.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
