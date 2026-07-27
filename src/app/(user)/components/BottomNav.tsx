'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { NAV_ITEMS } from '../lib/navItems';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] lg:hidden">
      <ul className="glass-nav flex items-center gap-1 rounded-full px-2 py-2 shadow-glass">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + '/');
          return (
            <li key={href}>
              <Link
                href={href}
                aria-label={label}
                title={label}
                className={clsx(
                  'flex h-11 w-11 items-center justify-center rounded-full transition-all',
                  active ? 'bg-brand-500 text-white shadow-card' : 'text-ink/45 hover:bg-white/50 hover:text-ink/70'
                )}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 2} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
