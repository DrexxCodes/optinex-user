'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { authFetch } from '@/lib/auth/authClient';
import { useBanks } from '../../withdrawal/lib/useBanks';
import { BankPicker } from '../../withdrawal/components/PayoutMethodForm';
import type { ApplyPayload } from '../lib/useLoans';

export default function LoanApplyForm({
  limits,
  onApply
}: {
  limits: { min: number; max: number };
  onApply: (payload: ApplyPayload) => Promise<{ ok: boolean; error?: string; reference?: string }>;
}) {
  const { banks, loading: banksLoading } = useBanks();
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [resolving, setResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const amountValue = Number(amount);
  const amountValid = Number.isInteger(amountValue) && amountValue >= limits.min && amountValue <= limits.max;

  // Verification is a convenience so the user can confirm the account holder
  // before submitting. The server re-resolves the account on submit, so the
  // name stored on the application can't be tampered with.
  const verify = async () => {
    if (accountNumber.length !== 10) return;
    if (!bankCode) {
      setError('Select a bank first.');
      return;
    }
    setResolving(true);
    setError(null);
    setAccountName(null);
    try {
      const res = await authFetch('/api/withdrawal/resolve-account', {
        method: 'POST',
        body: JSON.stringify({ accountNumber, bankCode })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not resolve account.');
        return;
      }
      setAccountName(data.accountName);
    } finally {
      setResolving(false);
    }
  };

  const submit = async () => {
    if (!accountName || !amountValid) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const res = await onApply({ amount: amountValue, accountNumber, bankCode });
    setSubmitting(false);
    if (res.ok) {
      setSuccess(`Application submitted — ref ${res.reference}`);
      setAmount('');
      setAccountNumber('');
      setBankCode('');
      setAccountName(null);
    } else {
      setError(res.error ?? 'Could not submit your application.');
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-card">
      <h3 className="font-display text-sm font-bold text-ink">Apply for a Loan</h3>
      <p className="mt-1 text-xs text-ink/50">Tell us how much you need and where to send it. The account name is verified with your bank.</p>

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Amount (₦)</span>
        <input
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value.replace(/\D/g, ''));
            setError(null);
          }}
          inputMode="numeric"
          placeholder={limits.min.toLocaleString()}
          className="w-full rounded-xl border border-brand-100 bg-white/80 px-4 py-3 text-sm text-ink outline-none focus:border-brand-500"
        />
        <span className="mt-1 block text-[11px] text-ink/40">
          Between ₦{limits.min.toLocaleString()} and ₦{limits.max.toLocaleString()}
        </span>
      </label>

      <BankPicker
        banks={banks}
        loading={banksLoading}
        value={bankCode}
        onChange={(code) => {
          setBankCode(code);
          setAccountName(null);
        }}
      />

      <label className="mt-3 block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Account Number</span>
        <div className="flex gap-2">
          <input
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
              setAccountName(null);
              setError(null);
            }}
            inputMode="numeric"
            maxLength={10}
            placeholder="0123456789"
            className="w-full flex-1 rounded-xl border border-brand-100 bg-white/80 px-4 py-3 text-sm text-ink outline-none focus:border-brand-500"
          />
          <button
            type="button"
            onClick={verify}
            disabled={accountNumber.length !== 10 || !bankCode || resolving}
            className="shrink-0 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition disabled:bg-ink/10 disabled:text-ink/40"
          >
            {resolving ? 'Verifying…' : 'Verify'}
          </button>
        </div>
      </label>

      {accountName && <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600">{accountName}</p>}
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {success && (
        <p className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600">
          <Check size={15} /> {success}
        </p>
      )}

      <button
        onClick={submit}
        disabled={submitting || !accountName || !amountValid}
        className="mt-4 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit Application'}
      </button>
    </div>
  );
}
