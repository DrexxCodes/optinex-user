import { Check } from 'lucide-react';
import clsx from 'clsx';
import { LOAN_STAGE_HINTS, type LoanTimelineStep } from '@/lib/loans/config';

function formatReached(iso: string) {
  return new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Linear, vertical timeline: every stage the application has reached (with
// the exact time it got there), the stage it is in right now, and the stages
// still ahead. The current stage is simply the last one with a timestamp.
export default function LoanTimeline({ steps }: { steps: LoanTimelineStep[] }) {
  const currentIndex = steps.reduce((acc, s, i) => (s.reachedAt ? i : acc), -1);
  const finished = currentIndex === steps.length - 1;

  return (
    <ol className="relative">
      {steps.map((step, i) => {
        const reached = !!step.reachedAt;
        const isCurrent = i === currentIndex && !finished;
        const isLast = i === steps.length - 1;
        // The connector below a step is "filled" only if the next step has also been reached.
        const connectorFilled = !isLast && !!steps[i + 1].reachedAt;

        return (
          <li key={step.status} className="relative flex gap-3 pb-5 last:pb-0">
            {!isLast && (
              <span
                aria-hidden
                className={clsx('absolute left-[13px] top-7 h-[calc(100%-1.75rem)] w-0.5 rounded-full', connectorFilled ? 'bg-brand-500' : 'bg-ink/10')}
              />
            )}

            <span
              className={clsx(
                'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold',
                reached && !isCurrent && 'border-brand-500 bg-brand-500 text-white',
                isCurrent && 'border-brand-500 bg-white text-brand-500 ring-4 ring-brand-100',
                !reached && 'border-ink/15 bg-white text-ink/30'
              )}
            >
              {reached && !isCurrent ? <Check size={14} strokeWidth={3} /> : i + 1}
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2">
                <p className={clsx('text-sm font-semibold', reached ? 'text-ink' : 'text-ink/40')}>{step.label}</p>
                {isCurrent && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-600">Current</span>
                )}
              </div>
              <p className={clsx('mt-0.5 text-xs', reached ? 'text-ink/50' : 'text-ink/30')}>
                {reached ? formatReached(step.reachedAt!) : 'Not reached yet'}
              </p>
              {(isCurrent || (reached && isLast)) && <p className="mt-1 text-xs text-ink/60">{LOAN_STAGE_HINTS[step.status]}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
