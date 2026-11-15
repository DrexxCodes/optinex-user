import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { generateReference } from '@/lib/refGenerator';
import { logAnalyticsEvent } from '@/lib/analytics';
import { num } from '@/lib/db/format';

// Allows a user with an active investment to change their package.
// Creates a new investment request and marks the user as changing package.
export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { packageId, receiptUrl } = await req.json();
  if (!packageId || !receiptUrl) {
    return NextResponse.json({ error: 'A package and receipt are required.' }, { status: 400 });
  }

  const { data: user } = await supabaseAdmin
    .from('profiles')
    .select('package_status, package_id')
    .eq('id', session.uid)
    .maybeSingle();
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  if (user.package_status === 'Free' || !user.package_status || user.package_status === 'pending verification') {
    return NextResponse.json({ error: 'You must have an active package to change packages.' }, { status: 400 });
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
      reference,
      is_package_change: true,
      previous_package_id: user.package_id
    })
    .select('id')
    .single();
  if (error || !inv) {
    console.error('[investment/change-package]', error);
    return NextResponse.json({ error: 'Could not submit your package change.' }, { status: 500 });
  }

  await supabaseAdmin
    .from('profiles')
    .update({ package_status: 'pending verification', is_changing_package: true })
    .eq('id', session.uid);

  await logAnalyticsEvent('package_change_submitted', num(pkg.price)).catch((e) => console.error('[investment] analytics', e));

  return NextResponse.json({ ok: true, reference, investmentId: inv.id });
}
