'use client';

import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { Lock, Clock } from 'lucide-react';
import { useLoans, type ApplyPayload, type LoansState } from './lib/useLoans';
import { useCurrentUser } from '../lib/useCurrentUser';
import LoanApplyForm from './components/LoanApplyForm';
import LoanCard from './components/LoanCard';

const LOCK_ACTIONS: Record<string, { href: string; label: string }> = {
  UPGRADE_REQUIRED: { href: '/upgrade', label: 'Upgrade your account' },
  PACKAGE_REQUIRED: { href: '/investment', label: 'Browse packages' },
  MORE_PACKAGES_REQUIRED: { href: '/investment', label: 'Browse packages' }
};

type Tab = 'apply' | 'applications';

function EligibilityNotice({ state }: { state: LoansState }) {
  if (!state.allowed) {
    return (
      <div className="glass-panel flex items-start gap-3 rounded-2xl p-4 shadow-card">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Lock size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">You can&apos;t submit yet</p>
          <p className="mt-0.5 text-sm text-ink/60">{state.reason}</p>
          {state.blockCode && (
            <Link href={LOCK_ACTIONS[state.blockCode].href} className="mt-2 inline-block text-sm font-bold text-brand-500 underline">
              {LOCK_ACTIONS[state.blockCode].label}
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (state.hasPending) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <Clock size={18} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-900">Application pending</p>
          <p className="mt-0.5 text-xs text-amber-800">
            You can only have one pending application at a time. You can apply again once this one moves past pending.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

export default function LoansPage() {
  const { state, loading, apply } = useLoans();
  const { user } = useCurrentUser();
  const [tab, setTab] = useState<Tab>('apply');

  // After a successful submit, jump to the applications tab so the user
  // immediately sees their new application and its timeline.
  const submit = async (payload: ApplyPayload) => {
    const res = await apply(payload);
    if (res.ok) setTab('applications');
    return res;
  };

  // The form is always visible; this is only about whether it can be submitted.
  const submitBlock = state ? (!state.allowed ? state.reason : state.hasPending ? 'You already have a pending application.' : null) : null;

  return (
    <div className="px-4 pt-4 lg:px-0 lg:pt-2">
      <h1 className="font-display text-xl font-bold text-ink">Loans</h1>
      <p className="mt-1 text-sm text-ink/60">Apply for a loan and follow it from application to disbursement.</p>

      {loading && !state && <div className="mt-5 h-40 animate-pulse rounded-2xl bg-white/40" />}

      {state && (
        <>
          {/* Tabs only below xl; from xl up both panels sit side by side. */}
          <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-white/50 p-1 xl:hidden">
            {(
              [
                ['apply', 'Apply'],
                ['applications', `My Applications (${state.loans.length})`]
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={clsx(
                  'rounded-xl py-2 text-sm font-semibold transition',
                  tab === key ? 'bg-brand-500 text-white shadow-card' : 'text-ink/55 hover:text-ink'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 xl:mt-5 xl:grid xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start xl:gap-6">
            <section className={clsx('space-y-4', tab !== 'apply' && 'hidden xl:block')}>
              <div className="xl:hidden">
                <EligibilityNotice state={state} />
              </div>
              {user ? (
                <LoanApplyForm
                  limits={state.limits}
                  account={{ fullName: user.fullName, email: user.email }}
                  submitBlock={submitBlock}
                  onApply={submit}
                />
              ) : (
                <div className="h-64 animate-pulse rounded-2xl bg-white/40" />
              )}
            </section>

            <aside className={clsx('space-y-4 xl:sticky xl:top-4 xl:max-h-[calc(100dvh-2rem)] xl:overflow-y-auto', tab !== 'applications' && 'hidden xl:block')}>
              <div className="hidden xl:block">
                <EligibilityNotice state={state} />
              </div>
              <h2 className="hidden font-display text-sm font-bold text-ink xl:block">My Applications ({state.loans.length})</h2>
              {state.loans.length === 0 ? (
                <p className="glass-panel rounded-2xl p-4 text-sm text-ink/50">
                  No applications yet.{' '}
                  <button onClick={() => setTab('apply')} className="font-semibold text-brand-500 underline xl:hidden">
                    Apply for a loan
                  </button>
                </p>
              ) : (
                <div className="space-y-3">
                  {state.loans.map((loan, i) => (
                    <LoanCard key={loan.id} loan={loan} defaultOpen={i === 0} />
                  ))}
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
