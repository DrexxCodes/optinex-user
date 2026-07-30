const STATS = [
  { value: '2.1M+', label: 'Tasks completed' },
  { value: '99.8%', label: 'Payout uptime' },
  { value: '₦180M+', label: 'Paid out in 2026' },
  { value: '14k+', label: 'Active earners' }
];

export default function TrustBar() {
  return (
    <section className="border-y border-ink/5 bg-white/40 backdrop-blur-xs">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center sm:text-left">
            <p className="font-display text-2xl font-bold text-ink sm:text-3xl">{stat.value}</p>
            <p className="mt-1 font-body text-xs text-ink/50 sm:text-sm">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
