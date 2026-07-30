import Link from 'next/link';
import { ArrowUpRight, TrendingUp, Zap } from 'lucide-react';

export default function Hero() {
  return (
    <section id="home" className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-2">
        {/* Copy */}
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3.5 py-1.5 font-body text-xs font-semibold uppercase tracking-wide text-brand-600">
            <Zap className="h-3.5 w-3.5" />
            Now live across Nigeria
          </span>

          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.08] text-ink sm:text-5xl lg:text-[3.4rem]">
            Turn everyday tasks into steady{' '}
            <span className="text-brand-500">Naira earnings</span>
          </h1>

          <p className="mt-6 max-w-md font-body text-base leading-relaxed text-ink/60 sm:text-lg">
            Review products, share your skills, and connect with opportunities — track every
            kobo in real time and withdraw straight to your bank, whenever you want.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-7 py-3.5 font-body text-sm font-semibold text-white shadow-glass transition-transform hover:-translate-y-0.5"
            >
              Start earning today
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <a
              href="#ecosystem"
              className="inline-flex items-center justify-center rounded-full border border-ink/10 bg-white/60 px-7 py-3.5 font-body text-sm font-semibold text-ink backdrop-blur-xs transition-colors hover:bg-white"
            >
              See how it works
            </a>
          </div>

          <p className="mt-8 font-body text-xs text-ink/40">
            Free to join · No hidden charges · Withdraw any amount, any time
          </p>
        </div>

        {/* Balance card */}
        <div className="relative animate-fade-up [animation-delay:150ms]">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-100 via-sky/20 to-transparent blur-2xl" />

          <div className="glass-panel mx-auto max-w-sm rounded-3xl p-6 shadow-glass">
            <div className="flex items-center justify-between">
              <span className="font-body text-xs font-medium uppercase tracking-wide text-ink/40">
                Available balance
              </span>
              <span className="flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-1 font-body text-[11px] font-semibold text-brand-600">
                <TrendingUp className="h-3 w-3" />
                +12.4%
              </span>
            </div>

            <p className="mt-2 font-display text-4xl font-bold text-ink">₦482,600</p>

            <div className="relative mt-5 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-500 to-brand-700 p-4">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.25),transparent)] bg-[length:200%_100%]" />
              <div className="relative flex items-center justify-between text-white">
                <div>
                  <p className="font-body text-[11px] font-medium uppercase tracking-wide text-white/70">
                    IdeaVault task
                  </p>
                  <p className="mt-0.5 font-display text-sm font-semibold">Strategy write-up</p>
                </div>
                <span className="font-display text-base font-bold">₦2,500</span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {[
                { label: 'Review Rewards', amount: '+₦1,800', time: '2 min ago' },
                { label: 'Talent Core', amount: '+₦4,200', time: '1 hr ago' }
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-xl bg-frost px-3.5 py-2.5">
                  <div>
                    <p className="font-body text-sm font-medium text-ink">{row.label}</p>
                    <p className="font-body text-[11px] text-ink/40">{row.time}</p>
                  </div>
                  <span className="font-body text-sm font-semibold text-brand-600">{row.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
