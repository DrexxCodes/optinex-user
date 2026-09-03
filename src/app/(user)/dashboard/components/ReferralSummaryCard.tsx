'use client';

import Link from 'next/link';
import { ArrowRight, Link2, Share2, Users } from 'lucide-react';
import { useReferral, referralLink } from '../../referral/lib/useReferral';
import { useClipboard } from '../../lib/useClipboard';

export default function ReferralSummaryCard() {
  const { state, loading, generating, generate } = useReferral();
  const { copied, copy } = useClipboard();

  if (loading) return <div className="mt-6 h-32 animate-pulse rounded-3xl bg-white/40" />;
  if (!state) return null;

  if (!state.referralKey) {
    return (
      <div className="glass-panel mt-6 rounded-3xl p-5 shadow-card">
        <h2 className="font-display text-sm font-bold text-ink">Referral</h2>
        <div className="mt-3 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">You don't have a referral link yet</p>
            <p className="mt-0.5 text-xs text-ink/50">Create one and start earning when friends join.</p>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition disabled:opacity-60"
        >
          <Link2 size={15} /> {generating ? 'Creating…' : 'Create Referral Link'}
        </button>
      </div>
    );
  }

  const link = referralLink(state.referralKey);
  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join Incossify Africa', text: 'Join me on Incossify Africa and start earning:', url: link });
        return;
      } catch {
        // cancelled the native sheet — fall through to copy
      }
    }
    copy(link);
  };

  return (
    <div className="glass-panel mt-6 rounded-3xl p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-bold text-ink">Referral</h2>
        <Link href="/referral" className="flex items-center gap-1 text-xs font-semibold text-brand-500">
          Details <ArrowRight size={12} />
        </Link>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex-1 rounded-xl bg-white/70 px-3 py-2">
          <p className="flex items-center gap-1.5 text-lg font-bold text-ink">
            <Users size={14} className="text-brand-500" /> {state.connections}
          </p>
          <p className="text-[11px] text-ink/50">Connections</p>
        </div>
        <div className="flex-1 rounded-xl bg-white/70 px-3 py-2">
          <p className="text-lg font-bold text-ink">₦{state.totalEarned.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
          <p className="text-[11px] text-ink/50">Earned</p>
        </div>
      </div>

      <button
        onClick={share}
        className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
      >
        <Share2 size={15} /> {copied ? 'Link Copied' : 'Share Your Link'}
      </button>
    </div>
  );
}
