import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { adminMessaging } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

// All devices are subscribed to this single topic so the admin app can broadcast a platform-wide
// push with one `send({ topic })` call instead of looping over every stored token.
// FCM stays purely as the push *delivery* channel; the tokens themselves live in Supabase.
const PLATFORM_TOPIC = 'platform_all';

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { token, deviceId } = await req.json();
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'A push token is required.' }, { status: 400 });
  }

  const now = Date.now();
  const { error } = await supabaseAdmin
    .from('push_tokens')
    .upsert({ token, user_id: session.uid, device_id: deviceId ?? null, created_at: now, updated_at: now }, { onConflict: 'token' });
  if (error) {
    console.error('[notifications/register]', error);
    return NextResponse.json({ error: 'Could not register this device.' }, { status: 500 });
  }

  try {
    await adminMessaging.subscribeToTopic(token, PLATFORM_TOPIC);
  } catch {
    // Subscription failure (e.g. a stale/invalid token slipping through) shouldn't fail the
    // request — the token is still saved, and the next successful getToken() call retries.
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { token } = await req.json();
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'A push token is required.' }, { status: 400 });
  }

  const { data } = await supabaseAdmin.from('push_tokens').select('user_id').eq('token', token).maybeSingle();
  if (data && data.user_id === session.uid) {
    await adminMessaging.unsubscribeFromTopic(token, PLATFORM_TOPIC).catch(() => {});
    await supabaseAdmin.from('push_tokens').delete().eq('token', token);
  }

  return NextResponse.json({ ok: true });
}
