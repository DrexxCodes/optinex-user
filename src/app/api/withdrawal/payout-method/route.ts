import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { accountNumber, bankCode, bankName, accountName } = await req.json();
  if (!accountNumber || !bankCode || !bankName || !accountName) {
    return NextResponse.json({ error: 'Complete bank details are required.' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ payout_method: { accountNumber, bankCode, bankName, accountName } })
    .eq('id', session.uid);
  if (error) return NextResponse.json({ error: 'Could not save your payout details.' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
