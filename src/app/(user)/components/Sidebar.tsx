'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { NAV_ITEMS } from '../lib/navItems';

// Large-screen companion to BottomNav — a fixed left rail so the app reads
// as a real desktop layout instead of a phone screen stretched into empty
// space. Hidden below the lg breakpoint, where BottomNav takes over.
export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 shrink-0 flex-col border-r border-white/60 bg-white/50 px-5 py-7 backdrop-blur-xl lg:flex">
      <Link href="/dashboard" className="px-1">
        <Image src="/logo.jpg" alt="Optinex Africa" width={148} height={40} priority />
      </Link>

      <nav className="mt-10 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
                active ? 'bg-brand-500 text-white shadow-card' : 'text-ink/55 hover:bg-white/70 hover:text-ink'
              )}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="glass-panel rounded-2xl p-4 text-xs leading-relaxed text-ink/60">
        Optimise your wealth — earn daily, complete tasks, and grow with Optinex Africa.
      </div>
    </aside>
  );
}
