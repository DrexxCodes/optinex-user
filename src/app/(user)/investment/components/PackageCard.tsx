import { Check } from 'lucide-react';
import type { InvestmentPackage } from '../lib/useInvestment';

export default function PackageCard({
  pkg,
  onPay
}: {
  pkg: InvestmentPackage;
  onPay: (pkg: InvestmentPackage) => void;
}) {
  return (
    <div className="glass-panel animate-fade-up rounded-2xl p-5 shadow-card">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-base font-bold text-ink">{pkg.name}</h3>
        <span className="text-xs text-ink/50">{pkg.duration}</span>
      </div>
      <p className="mt-1 font-display text-2xl font-bold text-brand-500">₦{pkg.price.toLocaleString()}</p>

      {pkg.details?.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {pkg.details.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-ink/70">
              <Check size={14} className="mt-0.5 shrink-0 text-emerald-500" /> {d}
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => onPay(pkg)}
        className="mt-4 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
      >
        Pay & Subscribe
      </button>
    </div>
  );
}
