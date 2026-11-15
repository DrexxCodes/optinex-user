import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';
import { logAnalyticsEvent } from '@/lib/analytics';
import { rpcMessage } from '@/lib/db/format';

export async function POST(_req: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { taskId } = await params;

  const { data, error } = await supabaseAdmin.rpc('complete_task', {
    p_user: session.uid,
    p_task: taskId,
    p_ref: generateReference()
  });

  if (error) {
    const msg = rpcMessage(error);
    if (msg === 'ALREADY_COMPLETED') return NextResponse.json({ error: 'You already claimed this task.' }, { status: 409 });
    if (msg === 'TASK_UNAVAILABLE') return NextResponse.json({ error: 'This task is no longer available.' }, { status: 410 });
    console.error('[tasks/complete]', error);
    return NextResponse.json({ error: 'Could not complete task.' }, { status: 500 });
  }

  const reward = Number(data);
  await logAnalyticsEvent('task_completed', reward).catch((e) => console.error('[tasks/complete] analytics', e));
  return NextResponse.json({ ok: true, reward });
}
