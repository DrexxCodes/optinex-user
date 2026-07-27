import { CalendarCheck } from 'lucide-react';

export default function StreakHistory({
  history
}: {
  history: { id: string; date: string; timestamp: string | null }[];
}) {
  return (
    <div className="mt-6">
      <h2 className="font-display text-sm font-bold text-ink">Check-in History</h2>
      <div className="mt-3 space-y-2">
        {history.length === 0 && <p className="glass-panel rounded-2xl p-4 text-sm text-ink/50">No check-ins yet.</p>}
        {history.map((h) => (
          <div key={h.id} className="glass-panel flex items-center gap-3 rounded-2xl p-3.5 shadow-card">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
              <CalendarCheck size={16} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{h.date}</p>
            </div>
            <p className="text-sm font-semibold text-emerald-600">+₦25.00</p>
          </div>
        ))}
      </div>
    </div>
  );
}
