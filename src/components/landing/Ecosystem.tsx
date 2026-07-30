import { Sparkles, Bell, Wallet, Globe2, type LucideIcon } from 'lucide-react';

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Sparkles,
    title: 'Engage & earn',
    body: 'Complete product reviews and short talent tasks that match your profile — every task shows its payout upfront.'
  },
  {
    icon: Bell,
    title: 'Live activity',
    body: 'Get an instant alert the moment a task is approved, and see your full earnings history in one place.'
  },
  {
    icon: Wallet,
    title: 'Fast withdrawals',
    body: 'Move funds to your bank account whenever you like — no minimum balance, no waiting on admin approval.'
  },
  {
    icon: Globe2,
    title: 'Wider network',
    body: 'Connect with opportunities from earners and partners across the continent as the platform grows.'
  }
];

export default function Ecosystem() {
  return (
    <section id="ecosystem" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-xl">
          <span className="font-body text-xs font-semibold uppercase tracking-wide text-brand-500">
            What we provide
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
            An ecosystem built around your time
          </h2>
          <p className="mt-4 font-body text-base leading-relaxed text-ink/60">
            Every part of Optinex is designed to turn small, everyday effort into earnings you
            can actually see and use.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <div
              key={title}
              className="group rounded-2xl border border-ink/5 bg-white/60 p-6 shadow-card backdrop-blur-xs transition-all hover:-translate-y-1 hover:shadow-glass animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/10 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-base font-semibold text-ink">{title}</h3>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink/55">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
