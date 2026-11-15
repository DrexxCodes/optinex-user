import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { assignReferralKey } from '@/lib/referral';

export async function POST() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { data: user } = await supabaseAdmin.from('profiles').select('referral_key').eq('id', session.uid).maybeSingle();
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  // Idempotency: if a link already exists, just hand it back instead of minting a second one.
  if (user.referral_key) return NextResponse.json({ referralKey: user.referral_key });

  try {
    return NextResponse.json({ referralKey: await assignReferralKey(session.uid) });
  } catch (err) {
    console.error('[referral/generate]', err);
    return NextResponse.json({ error: 'Could not generate a referral key. Please try again.' }, { status: 500 });
  }
}
