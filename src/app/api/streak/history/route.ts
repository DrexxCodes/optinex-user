import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { iso } from '@/lib/db/format';

const CYCLE_MS = 1000 * 60 * 60 * 24;

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const [profile, checkins] = await Promise.all([
    supabaseAdmin.from('profiles').select('last_checkin_at, streak_count').eq('id', session.uid).maybeSingle(),
    supabaseAdmin
      .from('checkins')
      .select('id, date, created_at')
      .eq('user_id', session.uid)
      .order('id', { ascending: false })
      .limit(30)
  ]);

  const user = profile.data;
  const lastCheckinAt = user?.last_checkin_at ? new Date(user.last_checkin_at) : undefined;
  const now = new Date();
  const canCheckIn = !lastCheckinAt || now.getTime() - lastCheckinAt.getTime() >= CYCLE_MS;
  const nextAvailableAt = lastCheckinAt ? new Date(lastCheckinAt.getTime() + CYCLE_MS) : null;

  return NextResponse.json({
    canCheckIn,
    nextAvailableAt,
    streakCount: user?.streak_count ?? 0,
    history: (checkins.data ?? []).map((c) => ({
      id: String(c.id),
      date: c.date,
      timestamp: iso(c.created_at)
    }))
  });
}
