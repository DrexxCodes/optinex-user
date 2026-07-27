import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

// Renders active tasks created by Admin, flagged with completion state for
// the current user so the UI can disable the button after reward claim.
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const [tasksSnap, completedSnap] = await Promise.all([
    adminDb.collection('tasks').where('active', '==', true).orderBy('createdAt', 'desc').get(),
    adminDb.collection('users').doc(session.uid).collection('completedTasks').get()
  ]);

  const completedIds = new Set(completedSnap.docs.map((d) => d.id));

  return NextResponse.json({
    tasks: tasksSnap.docs.map((d) => {
      const t = d.data();
      return {
        id: d.id,
        name: t.name,
        details: t.details,
        buttonLabel: t.buttonLabel,
        link: t.link,
        reward: t.reward,
        completed: completedIds.has(d.id)
      };
    })
  });
}
