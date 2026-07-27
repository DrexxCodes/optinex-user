'use client';

import { useTasks } from './lib/useTasks';
import TaskCard from './components/TaskCard';

export default function TasksPage() {
  const { tasks, loading, claimingId, error, claim } = useTasks();

  return (
    <div className="px-4 pt-4 lg:max-w-3xl lg:px-0 lg:pt-2">
      <h1 className="font-display text-xl font-bold text-ink">Tasks</h1>
      <p className="mt-1 text-sm text-ink/60">Complete simple tasks to earn straight to your wallet.</p>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <div className="mt-5 space-y-3">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/40" />)}

        {!loading && tasks.length === 0 && (
          <p className="glass-panel rounded-2xl p-4 text-sm text-ink/50">No tasks available right now — check back soon.</p>
        )}

        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} claiming={claimingId === task.id} onClaim={claim} />
        ))}
      </div>
    </div>
  );
}
