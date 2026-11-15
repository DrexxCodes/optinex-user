import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { syncInvestmentOnLogin } from '@/lib/investmentReturns';

// Explicit session refresh, used by authFetch after a 401. Supabase rotates the tokens and the
// new cookies are written onto this response.
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session || !data.user) {
    return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
  }

  // A refresh means the user just resumed a session — possibly after days away — so it's as good
  // a "login" moment as sign-in for catching up on backlogged investment returns / expiry.
  try {
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    if (profile) await syncInvestmentOnLogin(data.user.id, profile);
  } catch (err) {
    console.error('[refresh] investment returns sync failed:', err);
  }

  return NextResponse.json({ ok: true });
}
