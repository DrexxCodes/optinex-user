import { ExternalLink } from 'lucide-react';
import type { Task } from '../lib/useTasks';

export default function TaskCard({
  task,
  claiming,
  onClaim
}: {
  task: Task;
  claiming: boolean;
  onClaim: (task: Task) => void;
}) {
  return (
    <div className="glass-panel animate-fade-up rounded-2xl p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{task.name}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink/60">{task.details}</p>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
          +₦{task.reward.toLocaleString()}
        </span>
      </div>

      <button
        onClick={() => onClaim(task)}
        disabled={claiming}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition disabled:bg-emerald-500/90"
      >
        {claiming ? (
          'Claiming…'
        ) : task.link ? (
          <>
            {task.buttonLabel || 'Complete'} <ExternalLink size={14} />
          </>
        ) : (
          'Complete'
        )}
      </button>
    </div>
  );
}
