'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { LOAN_STAGE_LABELS, type LoanStage } from '@/lib/loans/config';
import type { Loan } from '../lib/useLoans';
import LoanTimeline from './LoanTimeline';

const STATUS_STYLES: Record<LoanStage, string> = {
  pending: 'bg-amber-50 text-amber-700',
  processing: 'bg-sky-50 text-sky-700',
  approved: 'bg-emerald-50 text-emerald-700',
  disbursed: 'bg-brand-50 text-brand-600'
};

export default function LoanCard({ loan, defaultOpen = false }: { loan: Loan; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass-panel rounded-2xl shadow-card">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={open}>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold text-ink">₦{loan.amount.toLocaleString()}</p>
          <p className="mt-0.5 truncate text-xs text-ink/40">
            {loan.reference}
            {loan.createdAt && ` · ${new Date(loan.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          </p>
        </div>
        <span className={clsx('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide', STATUS_STYLES[loan.status])}>
          {LOAN_STAGE_LABELS[loan.status]}
        </span>
        <ChevronDown size={16} className={clsx('shrink-0 text-ink/30 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-white/60 px-4 pb-5 pt-4">
          <p className="mb-4 text-xs text-ink/50">
            Payout to <span className="font-semibold text-ink/70">{loan.bankAccount.accountName}</span> · {loan.bankAccount.bankName} ·{' '}
            {loan.bankAccount.accountNumber}
          </p>
          <LoanTimeline steps={loan.timeline} />
        </div>
      )}
    </div>
  );
}
