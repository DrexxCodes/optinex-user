import Image from 'next/image';
import RetryButton from './RetryButton';

export default function MaintenanceCard() {
  return (
    <section className="glass-panel w-full max-w-xl rounded-3xl p-6 text-center shadow-glass animate-fade-up sm:p-10">
      <Image
        src="/maintenance.svg"
        alt="Illustration of a maintenance team working on the platform"
        width={800}
        height={661}
        priority
        unoptimized
        className="mx-auto h-auto w-full max-w-sm"
      />

      <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75 motion-safe:animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
        </span>
        Scheduled maintenance
      </span>

      <h1 className="mt-4 font-display text-2xl font-bold text-ink sm:text-3xl">
        We&rsquo;re upgrading Incossify
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink/70 sm:text-base">
        We&rsquo;re upgrading and maintaining certain essential services to make your experience
        better. We&rsquo;ll be back soon &mdash; thank you for your patience.
      </p>

      <div className="mt-6">
        <RetryButton />
      </div>
    </section>
  );
}
