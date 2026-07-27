'use client';

import Image from 'next/image';
import { Copy, ShieldCheck } from 'lucide-react';
import { useClipboard } from '../../lib/useClipboard';
import type { CurrentUser } from '../../lib/useCurrentUser';

export default function ProfileHeader({ user }: { user: CurrentUser }) {
  const { copied, copy } = useClipboard();

  return (
    <div className="glass-panel flex items-center gap-4 rounded-3xl p-5 shadow-card">
      <Image
        src={user.avatarUrl}
        alt={user.username}
        width={64}
        height={64}
        unoptimized
        className="rounded-full border-2 border-white shadow-card"
      />
      <div className="min-w-0">
        <p className="truncate font-display text-lg font-bold text-ink">{user.fullName}</p>
        <button onClick={() => copy(user.username)} className="mt-0.5 flex items-center gap-1.5 text-sm text-ink/50 transition hover:text-ink/70">
          @{user.username} <Copy size={12} /> {copied && <span className="text-emerald-600">Copied</span>}
        </button>
      </div>
      {user.admin && (
        <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-600">
          <ShieldCheck size={13} /> Admin
        </span>
      )}
    </div>
  );
}
