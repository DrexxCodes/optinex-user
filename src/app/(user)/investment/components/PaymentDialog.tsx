'use client';

import { useState } from 'react';
import { X, Copy, Check, UploadCloud } from 'lucide-react';
import { UploadButton } from '@/lib/uploadthing';
import type { InvestmentPackage } from '../lib/useInvestment';

export default function PaymentDialog({
  pkg,
  bank,
  onClose,
  onSubmit
}: {
  pkg: InvestmentPackage;
  bank: { bankName: string; accountNumber: string; accountName: string } | null;
  onClose: () => void;
  onSubmit: (packageId: string, receiptUrl: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [copied, setCopied] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const copyAccount = () => {
    if (!bank) return;
    navigator.clipboard.writeText(bank.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const submit = async () => {
    if (!receiptUrl) return;
    setSubmitting(true);
    setError(null);
    const res = await onSubmit(pkg.id, receiptUrl);
    setSubmitting(false);
    if (res.ok) setDone(true);
    else setError(res.error ?? 'Could not submit your receipt.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 px-4 pb-6 pt-10 backdrop-blur-sm sm:items-center">
      <div className="glass-panel w-full max-w-sm animate-fade-up rounded-3xl p-6 shadow-glass">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink">{done ? 'Submitted' : `Pay for ${pkg.name}`}</h2>
          <button onClick={onClose} className="text-ink/40">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="mt-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <Check size={28} />
            </div>
            <p className="mt-3 text-sm text-ink/70">
              Your receipt is under review. We'll activate <strong>{pkg.name}</strong> once verified.
            </p>
            <button onClick={onClose} className="mt-5 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white">
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-ink/60">
              Transfer <span className="font-semibold text-ink">₦{pkg.price.toLocaleString()}</span> to the account below,
              then upload your receipt.
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
              <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                Bank details haven't been set up by Admin yet.
              </p>
            )}

            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">Upload Receipt</p>
              {receiptUrl ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-600">
                  <Check size={16} /> Receipt uploaded
                </div>
              ) : (
                <UploadButton
                  endpoint="paymentReceipt"
                  onClientUploadComplete={(res) => setReceiptUrl(res?.[0]?.url ?? null)}
                  onUploadError={(e) => setError(e.message)}
                  appearance={{
                    button:
                      'w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-white/60 py-3 text-sm font-semibold text-brand-600 ut-uploading:opacity-60',
                    allowedContent: 'hidden'
                  }}
                  content={{ button: () => (
                    <span className="flex items-center gap-2">
                      <UploadCloud size={16} /> Choose receipt
                    </span>
                  ) }}
                />
              )}
            </div>

            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <button
              onClick={submit}
              disabled={!receiptUrl || submitting}
              className="mt-5 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white transition disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit for Verification'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
