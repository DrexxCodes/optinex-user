'use client';

import { Copy, Check, Share2, Link2, Sparkles } from 'lucide-react';
import { useClipboard } from '../../lib/useClipboard';
import { referralLink } from '../lib/useReferral';

export default function ReferralKeyCard({
  referralKey,
  generating,
  error,
  onGenerate
}: {
  referralKey: string | null;
  generating: boolean;
  error: string | null;
  onGenerate: () => Promise<boolean>;
}) {
  const { copied, copy } = useClipboard();

  if (!referralKey) {
    return (
      <div className="glass-panel animate-fade-up rounded-3xl p-6 text-center shadow-card">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          <Sparkles size={22} />
        </span>
        <h2 className="mt-3 font-display text-base font-bold text-ink">No referral link yet</h2>
        <p className="mx-auto mt-1.5 max-w-xs text-sm text-ink/55">
          Create your personal referral link and start earning when friends join Optinex Africa through it.
        </p>
        <button
          onClick={onGenerate}
          disabled={generating}
          className="mx-auto mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-600 disabled:opacity-60"
        >
          <Link2 size={16} /> {generating ? 'Creating your link…' : 'Create Referral Link'}
        </button>
        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  const link = referralLink(referralKey);

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join Optinex Africa', text: 'Join me on Optinex Africa and start earning:', url: link });
        return;
      } catch {
        // user cancelled the native share sheet — fall through to copy
      }
    }
    copy(link);
  };

  return (
    <div className="glass-panel animate-fade-up rounded-3xl p-6 shadow-card">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink/40">Your Referral Link</span>
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-brand-100 bg-white/80 px-4 py-3">
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{link}</span>
        <button
          onClick={() => copy(link)}
          aria-label="Copy referral link"
          className="shrink-0 rounded-lg p-1.5 text-ink/40 transition hover:bg-white hover:text-brand-500"
        >
          {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={share}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-600"
        >
          <Share2 size={16} /> Share
        </button>
        <button
          onClick={() => copy(referralKey)}
          className="flex items-center justify-center gap-2 rounded-xl bg-white/70 px-4 py-3 text-sm font-semibold text-ink/70 transition hover:bg-white"
        >
          {copied ? 'Copied' : referralKey}
        </button>
      </div>
    </div>
  );
}
