import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { num } from '@/lib/db/format';

// Renders active tasks created by Admin. Completed tasks are dropped entirely rather than
// flagged — once a user claims a task's reward, it disappears from their list for good.
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const [tasks, completed] = await Promise.all([
    supabaseAdmin
      .from('tasks')
      .select('id, name, details, button_label, link, reward')
      .eq('active', true)
      .order('created_at', { ascending: false }),
    supabaseAdmin.from('completed_tasks').select('task_id').eq('user_id', session.uid)
  ]);

  const completedIds = new Set((completed.data ?? []).map((c) => c.task_id as string));

  return NextResponse.json({
    tasks: (tasks.data ?? [])
      .filter((t) => !completedIds.has(t.id))
      .map((t) => ({
        id: t.id,
        name: t.name,
        details: t.details,
        buttonLabel: t.button_label,
        link: t.link,
        reward: num(t.reward)
      }))
  });
}
