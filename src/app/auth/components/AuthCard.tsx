export default function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel animate-fade-up rounded-3xl p-7 shadow-glass sm:p-9">
      <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
      <p className="mt-1.5 text-sm text-ink/60">{subtitle}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}
