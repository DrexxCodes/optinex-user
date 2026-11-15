import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';
import { logAnalyticsEvent } from '@/lib/analytics';
import { getConfig } from '@/lib/db/config';

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { receiptUrl } = await req.json();
  if (!receiptUrl) return NextResponse.json({ error: 'A receipt is required.' }, { status: 400 });

  const config = await getConfig('upgrade');
  if (!config?.price) {
    return NextResponse.json({ error: "Account upgrades aren't available right now." }, { status: 400 });
  }
  const price = Number(config.price);

  const { data: user } = await supabaseAdmin
    .from('profiles')
    .select('account_tier, upgrade_status')
    .eq('id', session.uid)
    .maybeSingle();
  if (user?.account_tier === 'upgraded') {
    return NextResponse.json({ error: 'Your account is already upgraded.' }, { status: 400 });
  }
  if (user?.upgrade_status === 'pending') {
    return NextResponse.json({ error: 'You already have an upgrade request pending verification.' }, { status: 400 });
  }

  const reference = generateReference();
  const { data: upgrade, error } = await supabaseAdmin
    .from('account_upgrades')
    .insert({ user_id: session.uid, amount: price, receipt_url: receiptUrl, status: 'pending', reference })
    .select('id')
    .single();
  if (error || !upgrade) {
    console.error('[upgrade/subscribe]', error);
    return NextResponse.json({ error: 'Could not submit your upgrade request.' }, { status: 500 });
  }

  await supabaseAdmin.from('profiles').update({ upgrade_status: 'pending' }).eq('id', session.uid);
  await logAnalyticsEvent('account_upgrade_submitted', price).catch((e) => console.error('[upgrade] analytics', e));

  return NextResponse.json({ ok: true, reference, upgradeId: upgrade.id });
}
