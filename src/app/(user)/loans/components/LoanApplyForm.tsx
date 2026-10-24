'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { authFetch } from '@/lib/auth/authClient';
import { validateLoanInput } from '@/lib/loans/validation';
import { useBanks } from '../../withdrawal/lib/useBanks';
import { BankPicker } from '../../withdrawal/components/PayoutMethodForm';
import type { ApplyPayload } from '../lib/useLoans';

const INPUT =
  'w-full rounded-xl border border-brand-100 bg-white/80 px-4 py-3 text-sm text-ink outline-none focus:border-brand-500 disabled:cursor-not-allowed disabled:bg-ink/5 disabled:text-ink/50';

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <label className={`mt-3 block ${wide ? 'lg:col-span-2' : ''}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink/40">{hint}</span>}
    </label>
  );
}

function Section({ title }: { title: string }) {
  return <h4 className="mt-7 border-b border-ink/5 pb-1.5 text-[11px] font-bold uppercase tracking-widest text-brand-500 first:mt-4">{title}</h4>;
}

// Fields stack on phones and sit two-per-row from lg up.
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-4 lg:grid-cols-2">{children}</div>;
}

export default function LoanApplyForm({
  limits,
  account,
  submitBlock,
  onApply
}: {
  limits: { min: number; max: number };
  account: { fullName: string; email: string };
  // When set, the form stays fillable but can't be submitted; this says why.
  submitBlock: string | null;
  onApply: (payload: ApplyPayload) => Promise<{ ok: boolean; error?: string; reference?: string }>;
}) {
  const { banks, loading: banksLoading } = useBanks();

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [occupation, setOccupation] = useState('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [nextOfKinName, setNextOfKinName] = useState('');
  const [nextOfKinPhone, setNextOfKinPhone] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState<string | null>(null);

  const [resolving, setResolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const draft = { reason, amount, occupation, phone, address, nextOfKinName, nextOfKinPhone, accountNumber, bankCode };
  const validation = validateLoanInput(draft);
  const canSubmit = validation.ok && !!accountName && !submitting && !submitBlock;
  const touch = () => setError(null);

  // Verification lets the user confirm the account holder before submitting.
  // The server resolves the account again on submit, so the name stored on
  // the application can't be tampered with.
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
      const res = await authFetch('/api/withdrawal/resolve-account', { method: 'POST', body: JSON.stringify({ accountNumber, bankCode }) });
      const data = await res.json().catch(() => ({}));
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
    if (submitBlock) {
      setError(submitBlock);
      return;
    }
    if (!validation.ok || !accountName) {
      setError(validation.ok ? 'Verify your account number first.' : validation.error);
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    const res = await onApply(validation.value);
    setSubmitting(false);
    if (res.ok) {
      setSuccess(`Application submitted — ref ${res.reference}`);
      setPhone('');
      setAddress('');
      setOccupation('');
      setReason('');
      setAmount('');
      setNextOfKinName('');
      setNextOfKinPhone('');
      setBankCode('');
      setAccountNumber('');
      setAccountName(null);
    } else {
      setError(res.error ?? 'Could not submit your application.');
    }
  };

  return (
    // Phones: no card chrome or inner padding, so fields use the full page
    // width. lg and up: the glass card comes back.
    <div className="lg:rounded-2xl lg:border lg:border-white/50 lg:bg-white/70 lg:p-6 lg:shadow-card lg:backdrop-blur-xl">
      <h3 className="font-display text-base font-bold text-ink">Apply for a Loan</h3>
      <p className="mt-1 text-xs text-ink/50">You can fill this in anytime, but you can only submit once you&apos;re eligible.</p>

      <Section title="Personal details" />
      <Grid>
        <Field label="Full name">
          <input value={account.fullName} disabled readOnly className={INPUT} />
        </Field>
        <Field label="Email">
          <input value={account.email} disabled readOnly className={INPUT} />
        </Field>
        <Field label="Phone number">
          <input
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/[^\d+\s]/g, '').slice(0, 16));
              touch();
            }}
            inputMode="tel"
            autoComplete="tel"
            placeholder="08012345678"
            className={INPUT}
          />
        </Field>
        <Field label="Occupation">
          <input
            value={occupation}
            onChange={(e) => {
              setOccupation(e.target.value.slice(0, 100));
              touch();
            }}
            placeholder="e.g. Trader, Student, Developer"
            className={INPUT}
          />
        </Field>
        <Field label="Home address" wide>
          <textarea
            value={address}
            onChange={(e) => {
              setAddress(e.target.value.slice(0, 200));
              touch();
            }}
            rows={2}
            autoComplete="street-address"
            placeholder="House number, street, city, state"
            className={INPUT}
          />
        </Field>
      </Grid>

      <Section title="Loan details" />
      <Grid>
        <Field label="Amount (₦)" hint={`Between ₦${limits.min.toLocaleString()} and ₦${limits.max.toLocaleString()}`} wide>
          <input
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value.replace(/\D/g, ''));
              touch();
            }}
            inputMode="numeric"
            placeholder={limits.min.toLocaleString()}
            className={INPUT}
          />
        </Field>
        <Field label="Reason for the loan" hint={`${reason.length}/500`} wide>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value.slice(0, 500));
              touch();
            }}
            rows={3}
            placeholder="What will you use the loan for?"
            className={INPUT}
          />
        </Field>
      </Grid>

      <Section title="Next of kin" />
      <Grid>
        <Field label="Full name">
          <input
            value={nextOfKinName}
            onChange={(e) => {
              setNextOfKinName(e.target.value.slice(0, 100));
              touch();
            }}
            placeholder="Next of kin's full name"
            className={INPUT}
          />
        </Field>
        <Field label="Phone number">
          <input
            value={nextOfKinPhone}
            onChange={(e) => {
              setNextOfKinPhone(e.target.value.replace(/[^\d+\s]/g, '').slice(0, 16));
              touch();
            }}
            inputMode="tel"
            placeholder="08012345678"
            className={INPUT}
          />
        </Field>
      </Grid>

      <Section title="Bank details" />
      <Grid>
        {/* BankPicker brings its own top margin; match the other fields' so the row lines up. */}
        <div className="[&>div]:!mt-3">
          <BankPicker
            banks={banks}
            loading={banksLoading}
            value={bankCode}
            onChange={(code) => {
              setBankCode(code);
              setAccountName(null);
            }}
          />
        </div>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Account number</span>
          <div className="flex gap-2">
            <input
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                setAccountName(null);
                touch();
              }}
              inputMode="numeric"
              maxLength={10}
              placeholder="0123456789"
              className={`${INPUT} min-w-0 flex-1`}
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
      </Grid>
      {accountName && <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600">{accountName}</p>}

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
      {success && (
        <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600">
          <Check size={15} /> {success}
        </p>
      )}

      <button
        onClick={submit}
        disabled={!canSubmit}
        className="mt-6 block w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition disabled:opacity-50 lg:ml-auto lg:w-72"
      >
        {submitting ? 'Submitting…' : 'Submit Application'}
      </button>
      {submitBlock ? (
        <p className="mt-2 text-center text-[11px] text-amber-700 lg:text-right">{submitBlock}</p>
      ) : (
        !validation.ok && !accountName && <p className="mt-2 text-center text-[11px] text-ink/40 lg:text-right">{validation.error}</p>
      )}
    </div>
  );
}
