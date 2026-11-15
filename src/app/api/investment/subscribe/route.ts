import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';
import { logAnalyticsEvent } from '@/lib/analytics';
import { num } from '@/lib/db/format';

// Called after the receipt has been uploaded via UploadThing. Creates a pending investment
// request and flips the user's package status so the withdrawal gatekeeper and dashboard badge
// both reflect "pending verification".
export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { packageId, receiptUrl } = await req.json();
  if (!packageId || !receiptUrl) {
    return NextResponse.json({ error: 'A package and receipt are required.' }, { status: 400 });
  }

  const { data: pkg } = await supabaseAdmin.from('packages').select('name, price').eq('id', String(packageId)).maybeSingle();
  if (!pkg) return NextResponse.json({ error: 'Package not found.' }, { status: 404 });

  const reference = generateReference();
  const { data: inv, error } = await supabaseAdmin
    .from('investments')
    .insert({
      user_id: session.uid,
      package_id: String(packageId),
      package_name: pkg.name,
      amount: pkg.price,
      receipt_url: receiptUrl,
      status: 'pending',
      reference
    })
    .select('id')
    .single();
  if (error || !inv) {
    console.error('[investment/subscribe]', error);
    return NextResponse.json({ error: 'Could not submit your investment.' }, { status: 500 });
  }

  await supabaseAdmin.from('profiles').update({ package_status: 'pending verification' }).eq('id', session.uid);
  await logAnalyticsEvent('investment_submitted', num(pkg.price)).catch((e) => console.error('[investment] analytics', e));

  return NextResponse.json({ ok: true, reference, investmentId: inv.id });
}
