'use client';

import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type Task = {
  id: string;
  name: string;
  details: string;
  buttonLabel: string;
  link: string;
  reward: number;
  completed: boolean;
};

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await authFetch('/api/tasks');
    if (res.ok) setTasks((await res.json()).tasks);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const claim = useCallback(
    async (task: Task) => {
      setError(null);
      setClaimingId(task.id);
      // Open the task's link in a new tab, then award the reward.
      window.open(task.link, '_blank', 'noopener,noreferrer');
      try {
        const res = await authFetch(`/api/tasks/${task.id}/complete`, { method: 'POST' });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Could not claim this task.');
          return;
        }
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: true } : t)));
      } finally {
        setClaimingId(null);
      }
    },
    []
  );

  return { tasks, loading, claimingId, error, claim };
}
