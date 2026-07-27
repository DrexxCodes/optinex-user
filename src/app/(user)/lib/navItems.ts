import { Home, Flame, ListChecks, TrendingUp, Wallet, Gamepad2 } from 'lucide-react';

export const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/streak', label: 'Streak', icon: Flame },
  { href: '/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/investment', label: 'Invest', icon: TrendingUp },
  { href: '/withdrawal', label: 'Payout', icon: Wallet },
  { href: '/casino', label: 'Casino', icon: Gamepad2 }
] as const;
