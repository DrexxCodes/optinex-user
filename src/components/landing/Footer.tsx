import Link from 'next/link';
import { Twitter, Instagram, Facebook, Linkedin } from 'lucide-react';

const PLATFORM_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Ecosystem', href: '#ecosystem' },
  { label: 'Platform', href: '#platform' },
  { label: 'Reviews', href: '#reviews' }
];

const COMPANY_LINKS = [
  { label: 'About us', href: '#' },
  { label: 'Careers', href: '#' },
  { label: 'Blog', href: '#' },
  { label: 'Contact', href: '#' }
];

const SOCIALS = [Twitter, Instagram, Facebook, Linkedin];

export default function Footer() {
  return (
    <footer className="border-t border-ink/5 bg-white/50 backdrop-blur-xs">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="#home" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-500 font-display text-sm font-bold text-white">
                O
              </span>
              <span className="font-display text-lg font-bold text-ink">Optinex</span>
            </Link>
            <p className="mt-4 max-w-xs font-body text-sm leading-relaxed text-ink/50">
              Earn from reviews, connections, and talent sharing — and withdraw straight to your
              bank, on your schedule.
            </p>
            <div className="mt-6 flex gap-3">
              {SOCIALS.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink/50 transition-colors hover:bg-brand-500 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="font-display text-sm font-semibold text-ink">Platform</p>
            <ul className="mt-4 space-y-3">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="font-body text-sm text-ink/50 hover:text-brand-600">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-display text-sm font-semibold text-ink">Company</p>
            <ul className="mt-4 space-y-3">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="font-body text-sm text-ink/50 hover:text-brand-600">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ink/5 pt-8 sm:flex-row">
          <p className="font-body text-xs text-ink/40">
            &copy; {new Date().getFullYear()} Optinex Africa. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="font-body text-xs text-ink/40 hover:text-brand-600">
              Terms
            </a>
            <a href="#" className="font-body text-xs text-ink/40 hover:text-brand-600">
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
