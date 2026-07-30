import { CheckCircle2 } from 'lucide-react';

const POINTS = [
  { title: 'Review rewards', body: 'Earn a fixed payout for every product review you complete.' },
  { title: 'Talent Core', body: 'Turn your voice, ideas, or creative skills into steady income.' },
  { title: 'Real-time tracking', body: 'Watch your balance update live as tasks are approved.' }
];

export default function PlatformShowcase() {
  return (
    <section id="platform" className="py-24 md:py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 lg:grid-cols-2">
        {/* Copy side */}
        <div>
          <span className="font-body text-xs font-semibold uppercase tracking-wide text-brand-500">
            Your dashboard
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
            Manage every earning in one calm view
          </h2>
          <p className="mt-4 max-w-md font-body text-base leading-relaxed text-ink/60">
            One dashboard for reviews, talent tasks, and network earnings — with a running total
            that never leaves you guessing.
          </p>

          <ul className="mt-8 space-y-5">
            {POINTS.map((point) => (
              <li key={point.title} className="flex gap-3.5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-brand-500" />
                <div>
                  <p className="font-display text-sm font-semibold text-ink">{point.title}</p>
                  <p className="mt-0.5 font-body text-sm text-ink/55">{point.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Dashboard mockup */}
        <div className="relative">
          <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-tr from-sky/15 via-brand-100 to-transparent blur-3xl" />

          <div className="glass-panel rounded-3xl p-6 shadow-glass">
            <div className="flex items-center justify-between">
              <span className="font-body text-xs font-medium uppercase tracking-wide text-ink/40">
                Today&apos;s income
              </span>
              <span className="font-display text-sm font-bold text-brand-600">+₦9,400</span>
            </div>

            <div className="mt-4 h-24 rounded-2xl bg-gradient-to-r from-brand-500 to-sky/80 p-4">
              <p className="font-body text-[11px] font-medium uppercase tracking-wide text-white/80">
                Pending task
              </p>
              <p className="mt-1 font-display text-sm font-semibold text-white">
                IdeaVault — Strategy upload
              </p>
              <p className="mt-3 font-body text-xs font-medium text-white/90">₦2,500 reward</p>
            </div>

            <p className="mt-5 font-body text-xs font-medium uppercase tracking-wide text-ink/40">
              Recent activity
            </p>
            <div className="mt-3 space-y-2.5">
              {[
                { label: 'Talent Core', amount: '+₦3,000' },
                { label: 'Referral bonus', amount: '+₦1,200' },
                { label: 'Withdrawal', amount: 'Sent to GTBank' }
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-xl bg-frost px-3.5 py-2.5">
                  <span className="font-body text-sm text-ink/80">{row.label}</span>
                  <span className="font-body text-sm font-semibold text-ink/50">{row.amount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
