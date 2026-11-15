import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { getConfig } from '@/lib/db/config';
import { iso, num } from '@/lib/db/format';

// Bank details the payment dialog displays, plus the user's latest investment request so the UI
// can show a "pending verification" badge.
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const [bank, latestRes, userRes] = await Promise.all([
    getConfig('bank'),
    supabaseAdmin
      .from('investments')
      .select('*')
      .eq('user_id', session.uid)
      .order('created_at', { ascending: false })
      .limit(1),
    supabaseAdmin
      .from('profiles')
      .select('package_status, package_id, package_name, is_changing_package')
      .eq('id', session.uid)
      .maybeSingle()
  ]);

  const l = latestRes.data?.[0];
  const latest = l
    ? {
        id: l.id,
        uid: l.user_id,
        packageId: l.package_id,
        packageName: l.package_name,
        amount: num(l.amount),
        receiptUrl: l.receipt_url,
        status: l.status,
        reference: l.reference,
        isPackageChange: l.is_package_change,
        previousPackageId: l.previous_package_id,
        createdAt: iso(l.created_at)
      }
    : null;
  const user = userRes.data;

  return NextResponse.json({
    bank: bank ? { bankName: bank.bankName, accountNumber: bank.accountNumber, accountName: bank.accountName } : null,
    latestRequest: latest,
    packageStatus: user?.package_status ?? 'Free',
    packageId: user?.package_id ?? null,
    packageName: user?.package_name ?? undefined,
    isChangingPackage: user?.is_changing_package ?? false
  });
}
