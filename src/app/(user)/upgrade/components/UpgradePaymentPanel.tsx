'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Clock } from 'lucide-react';
import ReceiptUploader from '@/components/ReceiptUploader';
import type { UpgradeBank } from '../lib/useUpgrade';

const TIMER_STORAGE_KEY = 'upgrade_payment_timer';
const TIMER_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const COOLDOWN_DURATION_MS = 60 * 60 * 1000; // 1 hour

function formatTimeRemaining(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function UpgradePaymentPanel({
  price,
  bank,
  onSubmit
}: {
  price: number | null;
  bank: UpgradeBank | null;
  onSubmit: (receiptUrl: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [copied, setCopied] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Initialize timer and cooldown on mount. This panel only mounts once the
  // user clicks "Click here to upgrade", so if nothing is already running,
  // that click is the initiation moment — start the 30-minute window now
  // rather than waiting for the receipt upload to finish.
  useEffect(() => {
    const timerData = localStorage.getItem(TIMER_STORAGE_KEY);
    if (timerData) {
      const { expiresAt, cooldownExpiresAt } = JSON.parse(timerData);
      const now = Date.now();

      if (cooldownExpiresAt && now < cooldownExpiresAt) {
        setCooldownActive(true);
        setCooldownRemaining(cooldownExpiresAt - now);
        return;
      } else if (expiresAt && now < expiresAt) {
        setTimerActive(true);
        setTimeRemaining(expiresAt - now);
        return;
      } else {
        localStorage.removeItem(TIMER_STORAGE_KEY);
      }
    }

    startTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer countdown for payment timer
  useEffect(() => {
    if (!timerActive || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          setTimerActive(false);
          const cooldownExpiresAt = Date.now() + COOLDOWN_DURATION_MS;
          const timerData = localStorage.getItem(TIMER_STORAGE_KEY) || '{}';
          const data = JSON.parse(timerData);
          localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({ ...data, cooldownExpiresAt }));
          setCooldownActive(true);
          setCooldownRemaining(COOLDOWN_DURATION_MS);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, timeRemaining]);

  // Timer countdown for cooldown
  useEffect(() => {
    if (!cooldownActive || cooldownRemaining <= 0) return;

    const interval = setInterval(() => {
      setCooldownRemaining((prev) => {
        const newTime = prev - 1000;
        if (newTime <= 0) {
          setCooldownActive(false);
          localStorage.removeItem(TIMER_STORAGE_KEY);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldownActive, cooldownRemaining]);

  const copyAccount = () => {
    if (!bank) return;
    navigator.clipboard.writeText(bank.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const startTimer = () => {
    const expiresAt = Date.now() + TIMER_DURATION_MS;
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify({ expiresAt }));
    setTimerActive(true);
    setTimeRemaining(TIMER_DURATION_MS);
  };

  const submit = async () => {
    if (!receiptUrl) return;
    setSubmitting(true);
    setError(null);
    const res = await onSubmit(receiptUrl);
    setSubmitting(false);
    if (res.ok) {
      localStorage.removeItem(TIMER_STORAGE_KEY);
      setTimerActive(false);
      setCooldownActive(false);
    } else {
      setError(res.error ?? 'Could not submit your receipt.');
    }
  };

  if (price == null) {
    return (
      <div className="glass-panel mt-5 rounded-3xl p-6 text-center shadow-card">
        <p className="text-sm text-ink/50">Account upgrades aren't available right now — check back soon.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel mt-5 rounded-3xl p-6 shadow-card">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        
      </span>
      <h2 className="mt-3 font-display text-base font-bold text-ink">Upgrade Your Account</h2>
      <p className="mt-1 text-sm text-ink/60">
        Transfer <span className="font-semibold text-ink">₦{price.toLocaleString()}</span> to the account below, then upload your receipt for verification.
      </p>

      {bank ? (
        <div className="mt-4 rounded-2xl bg-brand-50 p-4">
          <p className="text-xs text-ink/50">Bank</p>
          <p className="text-sm font-semibold text-ink">{bank.bankName}</p>
          <p className="mt-2 text-xs text-ink/50">Account Number</p>
          <div className="flex items-center justify-between">
            <p className="font-display text-lg font-bold text-ink">{bank.accountNumber}</p>
            <button onClick={copyAccount} className="flex items-center gap-1 text-xs font-semibold text-brand-500">
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-2 text-xs text-ink/50">Account Name</p>
          <p className="text-sm font-medium text-ink">{bank.accountName}</p>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">Bank details haven't been set up by Admin yet.</p>
      )}

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Upload Receipt</p>
          {timerActive && (
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-600">
              <Clock size={14} /> {formatTimeRemaining(timeRemaining)}
            </div>
          )}
          {cooldownActive && (
            <div className="text-xs font-semibold text-red-600">
              Wait {formatTimeRemaining(cooldownRemaining)} to retry
            </div>
          )}
        </div>

        {receiptUrl ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-600">
            <Check size={16} /> Receipt uploaded
          </div>
        ) : (
          <ReceiptUploader
            disabled={cooldownActive}
            disabledMessage="Upload locked"
            onUploaded={setReceiptUrl}
            onError={(msg) => setError(msg)}
          />
        )}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button
        onClick={submit}
        disabled={!receiptUrl || !bank || submitting}
        className="mt-5 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Submit for Verification'}
      </button>
    </div>
  );
}
