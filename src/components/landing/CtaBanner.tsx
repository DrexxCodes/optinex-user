import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function CtaBanner() {
  return (
    <section className="px-6 py-10">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-600 via-brand-500 to-sky/70 px-8 py-16 text-center sm:px-16">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-ink/10 blur-3xl" />

        <h2 className="relative font-display text-3xl font-bold text-white sm:text-4xl">
          Start your own earning strategy
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg font-body text-base leading-relaxed text-white/80">
          Set up your profile, take on your first task, and watch your balance move — in under
          five minutes.
        </p>
        <Link
          href="/auth/signup"
          className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 font-body text-sm font-semibold text-brand-600 shadow-glass transition-transform hover:-translate-y-0.5"
        >
          Create your account
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
