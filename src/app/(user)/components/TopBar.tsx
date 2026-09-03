'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, User, LogOut } from 'lucide-react';
import { useLogout } from '../lib/useLogout';
import type { CurrentUser } from '../lib/useCurrentUser';

export default function TopBar({ user }: { user: CurrentUser | null }) {
  const [open, setOpen] = useState(false);
  const { logout, loggingOut } = useLogout();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const logoutAndClose = async () => {
    setOpen(false);
    await logout();
  };

  return (
    <header className="relative z-40 flex items-center justify-between px-4 pt-6 lg:px-8 lg:pt-8">
      <Link href="/dashboard" className="lg:hidden">
        <Image src="/logo.png" alt="Incossify Africa" width={140} height={38} priority />
      </Link>
      <div className="hidden lg:block">
        {user && <p className="font-display text-lg font-bold text-ink">Good to see you, {user.username}</p>}
      </div>

      {user && (
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full py-0.5 pl-0.5 pr-2 transition hover:bg-white/50"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <Image
              src={user.avatarUrl}
              alt={user.username}
              width={40}
              height={40}
              className="rounded-full border-2 border-white shadow-card"
              unoptimized
            />
            <ChevronDown size={15} className={`text-ink/40 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div
              role="menu"
              className="glass-panel absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl p-1.5 shadow-glass"
            >
              <p className="truncate px-3 py-2 text-xs font-semibold text-ink/40">@{user.username}</p>
              <Link
                href="/profile"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition hover:bg-white/70"
              >
                <User size={16} className="text-ink/50" /> Profile
              </Link>
              <button
                role="menuitem"
                onClick={logoutAndClose}
                disabled={loggingOut}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut size={16} /> {loggingOut ? 'Logging out…' : 'Logout'}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
