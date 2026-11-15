import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { getConfig } from '@/lib/db/config';

// Admin-configured welcome dialog shown on dashboard load.
// config row `popup`: { title, body, actionLabel, actionLink, enabled }
export async function GET() {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const data = await getConfig('popup');
  if (!data || data.enabled === false) {
    return NextResponse.json({ enabled: false });
  }
  return NextResponse.json({
    enabled: true,
    title: data.title ?? '',
    body: data.body ?? '',
    actionLabel: data.actionLabel ?? null,
    actionLink: data.actionLink ?? null
  });
}
