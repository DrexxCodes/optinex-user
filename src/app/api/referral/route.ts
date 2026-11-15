import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { iso, num } from '@/lib/db/format';

export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { data: user } = await supabaseAdmin
    .from('profiles')
    .select('referral_key, referral_earnings')
    .eq('id', session.uid)
    .maybeSingle();
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const referralKey: string | null = user.referral_key ?? null;

  let connections = 0;
  let recentConnections: { uid: string; fullName: string; username: string; joinedAt: string | null }[] = [];

  if (referralKey) {
    const { data, count } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, created_at', { count: 'exact' })
      .eq('referred_by', session.uid)
      .order('created_at', { ascending: false })
      .limit(8);

    connections = count ?? data?.length ?? 0;
    recentConnections = (data ?? []).map((r) => ({
      uid: r.id,
      fullName: r.full_name || 'Incossify user',
      username: r.username ?? '',
      joinedAt: iso(r.created_at)
    }));
  }

  return NextResponse.json({
    referralKey,
    connections,
    totalEarned: num(user.referral_earnings),
    recentConnections
  });
}
