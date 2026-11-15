import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';
import { logAnalyticsEvent } from '@/lib/analytics';
import { rpcMessage } from '@/lib/db/format';
import { MAX_DAILY_SPINS, pickWeightedPrize } from '@/app/(user)/streak/lib/prizes';

export async function POST() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const prize = pickWeightedPrize();

  // Daily-allotment rollover, spin row, prize credit and spin count are one atomic Postgres call.
  // "Extra spin" refunds the spin it cost, so it never reduces the user's count for the day.
  const { data, error } = await supabaseAdmin.rpc('spin', {
    p_user: session.uid,
    p_prize_id: prize.id,
    p_label: prize.label,
    p_amount: prize.amount,
    p_ref: generateReference(),
    p_today: new Date().toISOString().slice(0, 10),
    p_max: MAX_DAILY_SPINS
  });

  if (error) {
    const msg = rpcMessage(error);
    if (msg === 'NO_SPINS_LEFT') return NextResponse.json({ error: "You're out of spins for today." }, { status: 409 });
    if (msg === 'USER_NOT_FOUND') return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    console.error('[streak/spin]', error);
    return NextResponse.json({ error: 'Could not process spin.' }, { status: 500 });
  }

  await logAnalyticsEvent('spin_reward', data.amount).catch((e) => console.error('[streak/spin] analytics', e));
  return NextResponse.json({ ok: true, ...data });
}
