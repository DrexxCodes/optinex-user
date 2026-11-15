import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { getConfig } from '@/lib/db/config';
import { num } from '@/lib/db/format';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const [config, userRes, latestRes] = await Promise.all([
    getConfig('upgrade'),
    supabaseAdmin.from('profiles').select('account_tier, upgrade_status').eq('id', session.uid).maybeSingle(),
    supabaseAdmin
      .from('account_upgrades')
      .select('id, amount, status, reference')
      .eq('user_id', session.uid)
      .order('created_at', { ascending: false })
      .limit(1)
  ]);

  const r = latestRes.data?.[0];
  const latest = r ? { id: r.id, amount: num(r.amount), status: r.status, reference: r.reference } : null;
  const user = userRes.data;

  return NextResponse.json({
    price: config?.price ?? null,
    bank: config ? { bankName: config.bankName, accountNumber: config.accountNumber, accountName: config.accountName } : null,
    accountTier: user?.account_tier ?? 'standard',
    upgradeStatus: user?.upgrade_status ?? 'none',
    latestRequest: latest
  });
}
