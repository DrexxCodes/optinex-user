import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/auth/session';
import { num } from '@/lib/db/format';

// Admin-created packages: price, duration, and details. Every account starts on the implicit
// `Free` tier which never appears here.
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { data } = await supabaseAdmin
    .from('packages')
    .select('id, name, price, duration, details')
    .eq('active', true)
    .order('price', { ascending: true });

  return NextResponse.json({
    packages: (data ?? []).map((p) => ({ id: p.id, name: p.name, price: num(p.price), duration: p.duration, details: p.details ?? [] }))
  });
}
