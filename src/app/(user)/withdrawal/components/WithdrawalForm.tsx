'use client';

import { useState } from 'react';
import { Lock, Check } from 'lucide-react';
import type { WithdrawalStatus } from '../lib/useWithdrawal';

export default function WithdrawalForm({
  status,
  onRequest
}: {
  status: WithdrawalStatus;
  onRequest: (amount: number) => Promise<{ ok: boolean; error?: string; reference?: string }>;
}) {
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!status.allowed) {
    return (
      <div className="glass-panel flex items-start gap-3 rounded-2xl p-5 shadow-card">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Lock size={17} />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">Withdrawals locked</p>
          <p className="mt-0.5 text-sm text-ink/60">{status.reason}</p>
        </div>
      </div>
    );
  }

  if (!status.payoutMethod) {
    return null;
  }

  const submit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const res = await onRequest(value);
    setSubmitting(false);
    if (res.ok) {
      setSuccess(`Withdrawal request submitted — ref ${res.reference}`);
      setAmount('');
    } else {
      setError(res.error ?? 'Could not process your request.');
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-card">
      <h3 className="font-display text-sm font-bold text-ink">Request a Withdrawal</h3>
      <p className="mt-1 text-xs text-ink/50">
        Payout to {status.payoutMethod.bankName} — {status.payoutMethod.accountNumber}
      </p>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Amount (₦)</span>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))}
          placeholder="0.00"
          className="w-full rounded-xl border border-brand-100 bg-white/80 px-4 py-3 text-sm text-ink outline-none focus:border-brand-500"
        />
      </label>

      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {success && (
        <p className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600">
          <Check size={15} /> {success}
        </p>
      )}

      <button
        onClick={submit}
        disabled={submitting || !amount}
        className="mt-4 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Request Withdrawal'}
      </button>
    </div>
  );
}
