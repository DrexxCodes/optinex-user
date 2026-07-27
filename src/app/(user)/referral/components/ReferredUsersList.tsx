import { Users2 } from 'lucide-react';
import type { ReferralConnection } from '../lib/useReferral';

export default function ReferredUsersList({ connections }: { connections: ReferralConnection[] }) {
  return (
    <div className="mt-6">
      <h2 className="font-display text-sm font-bold text-ink">Your Connections</h2>

      {connections.length === 0 ? (
        <div className="glass-panel mt-3 flex flex-col items-center gap-2 rounded-2xl p-6 text-center shadow-card">
          <Users2 size={22} className="text-ink/30" />
          <p className="text-sm text-ink/50">No one has joined with your link yet — share it to start growing your network.</p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {connections.map((c) => (
            <div key={c.uid} className="glass-panel flex items-center gap-3 rounded-2xl p-3.5 shadow-card">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600">
                {c.fullName.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{c.fullName}</p>
                <p className="truncate text-xs text-ink/40">@{c.username}</p>
              </div>
              {c.joinedAt && (
                <p className="shrink-0 text-xs text-ink/40">{new Date(c.joinedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
