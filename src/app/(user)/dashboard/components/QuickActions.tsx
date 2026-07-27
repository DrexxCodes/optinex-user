import Link from 'next/link';
import { Flame, ListChecks, Gamepad2, TrendingUp } from 'lucide-react';

const ACTIONS = [
  { href: '/streak', label: 'Daily Check-in', hint: '+₦25 today', icon: Flame, tint: 'bg-orange-50 text-orange-500' },
  { href: '/tasks', label: 'Tasks', hint: 'Earn more', icon: ListChecks, tint: 'bg-brand-50 text-brand-500' },
  { href: '/casino', label: 'Brick Slasher', hint: 'Play & rank', icon: Gamepad2, tint: 'bg-sky-50 text-sky-500' },
  { href: '/investment', label: 'Packages', hint: 'Grow faster', icon: TrendingUp, tint: 'bg-emerald-50 text-emerald-500' }
];

export default function QuickActions() {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3">
      {ACTIONS.map(({ href, label, hint, icon: Icon, tint }) => (
        <Link
          key={href}
          href={href}
          className="glass-panel flex flex-col gap-2 rounded-2xl p-4 shadow-card transition active:scale-[0.98]"
        >
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tint}`}>
            <Icon size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">{label}</p>
            <p className="text-xs text-ink/50">{hint}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
