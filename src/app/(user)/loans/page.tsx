'use client';

import Link from 'next/link';
import { Lock, Clock } from 'lucide-react';
import { useLoans } from './lib/useLoans';
import LoanApplyForm from './components/LoanApplyForm';
import LoanCard from './components/LoanCard';

const LOCK_ACTIONS: Record<string, { href: string; label: string }> = {
  UPGRADE_REQUIRED: { href: '/upgrade', label: 'Upgrade your account' },
  PACKAGE_REQUIRED: { href: '/investment', label: 'Browse packages' },
  MULTIPLE_PACKAGES_REQUIRED: { href: '/investment', label: 'Browse packages' }
};

export default function LoansPage() {
  const { state, loading, apply } = useLoans();

  return (
    <div className="px-4 pt-4 lg:max-w-3xl lg:px-0 lg:pt-2">
      <h1 className="font-display text-xl font-bold text-ink">Loans</h1>
      <p className="mt-1 text-sm text-ink/60">Apply for a loan and follow it from application to disbursement.</p>

      {loading && !state && <div className="mt-5 h-40 animate-pulse rounded-2xl bg-white/40" />}

      {state && (
        <div className="mt-5 space-y-4">
          {!state.allowed && (
            <div className="glass-panel flex items-start gap-3 rounded-2xl p-5 shadow-card">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Lock size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">Loans locked</p>
                <p className="mt-0.5 text-sm text-ink/60">{state.reason}</p>
                {state.blockCode && (
                  <Link href={LOCK_ACTIONS[state.blockCode].href} className="mt-2 inline-block text-sm font-bold text-brand-500 underline">
                    {LOCK_ACTIONS[state.blockCode].label}
                  </Link>
                )}
              </div>
            </div>
          )}

          {state.allowed && state.hasPending && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <Clock size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Application pending</p>
                <p className="mt-0.5 text-xs text-amber-800">
                  You can only have one pending application at a time. You can apply again once this one moves past pending.
                </p>
              </div>
            </div>
          )}

          {state.allowed && !state.hasPending && <LoanApplyForm limits={state.limits} onApply={apply} />}

          {state.loans.length > 0 && (
            <section>
              <h2 className="mb-2 font-display text-sm font-bold text-ink">Your Applications</h2>
              <div className="space-y-3">
                {state.loans.map((loan, i) => (
                  <LoanCard key={loan.id} loan={loan} defaultOpen={i === 0} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
