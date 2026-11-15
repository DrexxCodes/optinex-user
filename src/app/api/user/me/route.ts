import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { avatarPath } from '@/lib/dicebear';
import { num } from '@/lib/db/format';

// Returns the authenticated user's profile. This is the single fetch the
// dashboard shell needs — wallet, package, and payout status all live here.
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { data: p } = await supabaseAdmin.from('profiles').select('*').eq('id', session.uid).maybeSingle();
  if (!p) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  return NextResponse.json({
    uid: p.id,
    fullName: p.full_name,
    email: p.email,
    username: p.username,
    walletAmount: num(p.wallet_amount),
    packageStatus: p.package_status ?? 'Free',
    packageName: p.package_name ?? undefined,
    packageExpiresAt: p.package_expires_at ?? undefined,
    isChangingPackage: p.is_changing_package ?? false,
    accountTier: p.account_tier ?? 'standard',
    upgradeStatus: p.upgrade_status ?? 'none',
    payoutMethod: p.payout_method ?? null,
    admin: !!p.is_admin,
    avatarUrl: avatarPath(p.email)
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const body = await req.json();
  if (body.fullName === undefined) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('profiles').update({ full_name: body.fullName }).eq('id', session.uid);
  if (error) return NextResponse.json({ error: 'Could not update your profile.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
