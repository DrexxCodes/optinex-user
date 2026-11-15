import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { MAX_DAILY_SPINS } from '@/app/(user)/streak/lib/prizes';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { data: user } = await supabaseAdmin
    .from('profiles')
    .select('spins_used, spins_date')
    .eq('id', session.uid)
    .maybeSingle();

  // Spins reset every day — if the stored date isn't today, the user has their full allotment
  // (read-only; the actual reset happens inside the spin function on the next POST).
  const today = new Date().toISOString().slice(0, 10);
  const spinsUsed = user?.spins_date === today ? (user?.spins_used ?? 0) : 0;
  const spinsLeft = Math.max(0, MAX_DAILY_SPINS - spinsUsed);

  return NextResponse.json({ spinsLeft, maxSpins: MAX_DAILY_SPINS });
}
