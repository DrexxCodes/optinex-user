import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';
import { logAnalyticsEvent } from '@/lib/analytics';

export async function POST(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { taskId } = await params;
  const userRef = adminDb.collection('users').doc(session.uid);
  const taskRef = adminDb.collection('tasks').doc(taskId);
  const completedRef = userRef.collection('completedTasks').doc(taskId);

  try {
    const reward = await adminDb.runTransaction(async (tx) => {
      const [taskSnap, completedSnap] = await Promise.all([tx.get(taskRef), tx.get(completedRef)]);
      if (!taskSnap.exists || taskSnap.data()?.active === false) throw new Error('TASK_UNAVAILABLE');
      if (completedSnap.exists) throw new Error('ALREADY_COMPLETED');

      const task = taskSnap.data()!;
      const txnRef = generateReference();

      tx.set(completedRef, { completedAt: FieldValue.serverTimestamp(), reward: task.reward });
      tx.set(userRef.collection('walletTransactions').doc(), {
        txnType: 'credit',
        txnName: `task reward — ${task.name}`,
        amount: task.reward,
        timestamp: FieldValue.serverTimestamp(),
        txnRef
      });
      tx.set(userRef, { walletAmount: FieldValue.increment(task.reward) }, { merge: true });

      return task.reward;
    });

    await logAnalyticsEvent('task_completed', reward);
    return NextResponse.json({ ok: true, reward });
  } catch (err: any) {
    if (err.message === 'ALREADY_COMPLETED') {
      return NextResponse.json({ error: 'You already claimed this task.' }, { status: 409 });
    }
    if (err.message === 'TASK_UNAVAILABLE') {
      return NextResponse.json({ error: 'This task is no longer available.' }, { status: 410 });
    }
    console.error('[tasks/complete]', err);
    return NextResponse.json({ error: 'Could not complete task.' }, { status: 500 });
  }
}
