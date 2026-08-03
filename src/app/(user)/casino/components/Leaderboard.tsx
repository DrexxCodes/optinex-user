'use client';

import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { authFetch } from '@/lib/auth/authClient';

import type { GameId } from '../games';

type Entry = { rank: number; username: string; score: number };

export default function Leaderboard({ gameId, refreshKey }: { gameId: GameId; refreshKey: number }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    authFetch(`/api/casino/leaderboard?game=${gameId}`)
      .then((res) => (res.ok ? res.json() : { leaderboard: [] }))
      .then((data) => setEntries(data.leaderboard))
      .finally(() => setLoading(false));
  }, [gameId, refreshKey]);

  return (
    <div className="mt-6">
      <h2 className="flex items-center gap-1.5 font-display text-sm font-bold text-ink">
        <Trophy size={16} className="text-amber-500" /> Top 10 Leaderboard
      </h2>
      <div className="mt-3 space-y-1.5">
        {loading && <div className="h-32 animate-pulse rounded-2xl bg-white/40" />}
        {!loading && entries.length === 0 && (
          <p className="glass-panel rounded-2xl p-4 text-sm text-ink/50">Be the first to set a high score!</p>
        )}
        {entries.map((e) => (
          <div key={e.rank} className="glass-panel flex items-center gap-3 rounded-xl px-3.5 py-2.5 shadow-card">
            <span className="w-5 shrink-0 text-center text-sm font-bold text-ink/40">{e.rank}</span>
            <span className="flex-1 truncate text-sm font-medium text-ink">{e.username}</span>
            <span className="text-sm font-semibold text-brand-500">{e.score.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
