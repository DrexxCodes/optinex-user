import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';
import { logAnalyticsEvent } from '@/lib/analytics';

const CHECKIN_REWARD = 1000;

export async function POST() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  // The 24h cooldown check, check-in row, wallet credit and streak bump are one atomic Postgres call.
  const { data, error } = await supabaseAdmin.rpc('daily_checkin', {
    p_user: session.uid,
    p_reward: CHECKIN_REWARD,
    p_ref: generateReference()
  });

  if (error) {
    console.error('[streak/checkin]', error);
    return NextResponse.json({ error: 'Could not process check-in.' }, { status: 500 });
  }

  if (data.already) {
    return NextResponse.json({ error: 'Already checked in.', nextAvailableAt: data.next_available_at }, { status: 409 });
  }

  await logAnalyticsEvent('checkin', CHECKIN_REWARD).catch((e) => console.error('[streak/checkin] analytics', e));
  return NextResponse.json({ ok: true, reward: data.reward, txnRef: data.txn_ref });
}
