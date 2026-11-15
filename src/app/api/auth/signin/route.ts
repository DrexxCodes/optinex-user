import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { logAnalyticsEvent } from '@/lib/analytics';
import { syncInvestmentOnLogin } from '@/lib/investmentReturns';

// Post-login hook. Credentials are checked by Supabase Auth in the browser
// (lib/auth/clientAuth.ts); by the time this runs the session cookie already exists.
export async function POST() {
  try {
    const session = await getSessionUser();
    if (!session) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });

    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', session.uid).maybeSingle();
    if (!profile) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });

    await logAnalyticsEvent('signin').catch((e) => console.error('[signin] analytics', e));

    // Catch this user up on any daily investment returns (and expire their package if it has
    // run out) right as they log in. The profile row is passed in to avoid a second read.
    try {
      await syncInvestmentOnLogin(session.uid, profile);
    } catch (err) {
      console.error('[signin] investment returns sync failed:', err);
    }

    return NextResponse.json({
      user: { uid: profile.id, fullName: profile.full_name, email: profile.email, username: profile.username }
    });
  } catch (err) {
    console.error('[signin]', err);
    return NextResponse.json({ error: 'Something went wrong signing you in.' }, { status: 500 });
  }
}
