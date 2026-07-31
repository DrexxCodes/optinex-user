'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useLogout } from '@/lib/auth/useLogout';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Ecosystem', href: '#ecosystem' },
  { label: 'Platform', href: '#platform' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'FAQ', href: '#faq' }
];

export default function Navbar({ authenticated }: { authenticated: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { logout, loggingOut } = useLogout();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-shadow ${
        scrolled ? 'glass-nav shadow-card' : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="#home" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Optinex Africa" width={140} height={38} priority />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="font-body text-sm font-medium text-ink/70 transition-colors hover:text-brand-600"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {authenticated ? (
            <>
              <button
                onClick={logout}
                disabled={loggingOut}
                className="font-body text-sm font-medium text-ink/70 transition-colors hover:text-brand-600 disabled:opacity-50"
              >
                {loggingOut ? 'Logging out…' : 'Logout'}
              </button>
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-5 py-2.5 font-body text-sm font-semibold text-white shadow-card transition-transform hover:-translate-y-0.5"
              >
                Dashboard
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="font-body text-sm font-medium text-ink/70 transition-colors hover:text-brand-600"
              >
                Log in
              </Link>
              <Link
                href="/auth/signup"
                className="group inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-5 py-2.5 font-body text-sm font-semibold text-white shadow-card transition-transform hover:-translate-y-0.5"
              >
                Get started
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </>
          )}
        </div>

        <button
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-xl text-ink md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="glass-nav mx-4 mb-4 rounded-2xl px-5 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="font-body text-sm font-medium text-ink/80"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-1 flex flex-col gap-2 border-t border-ink/10 pt-4">
              {authenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setOpen(false)}
                    className="rounded-full bg-brand-500 px-5 py-2.5 text-center font-body text-sm font-semibold text-white"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                    disabled={loggingOut}
                    className="font-body text-sm font-medium text-ink/70 disabled:opacity-50"
                  >
                    {loggingOut ? 'Logging out…' : 'Logout'}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/signin" className="font-body text-sm font-medium text-ink/70">
                    Log in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="rounded-full bg-brand-500 px-5 py-2.5 text-center font-body text-sm font-semibold text-white"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
