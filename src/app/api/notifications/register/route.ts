import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminMessaging } from '@/lib/firebase/admin';
import { getSessionUser } from '@/lib/auth/session';

// All devices are subscribed to this single topic so the admin app can
// broadcast a platform-wide push with one `send({ topic })` call instead of
// looping over every stored token.
const PLATFORM_TOPIC = 'platform_all';

export async function POST(req: NextRequest) {
  const session = await getSessionUser();
  if (!session) return NextResponse.json({ error: 'Unauthenticated.' }, { status: 401 });

  const { token, deviceId } = await req.json();
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'A push token is required.' }, { status: 400 });
  }

  const now = Date.now();
  await adminDb
    .collection('pushTokens')
    .doc(token)
    .set(
      {
        token,
        uid: session.uid,
        deviceId: deviceId ?? null,
        createdAt: now,
        updatedAt: now
      },
      { merge: true }
    );

  try {
    await adminMessaging.subscribeToTopic(token, PLATFORM_TOPIC);
  } catch {
    // Subscription failure (e.g. a stale/invalid token slipping through)
    // shouldn't fail the request — the token is still saved, and the next
    // successful getToken() call on the client will retry.
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

  const snap = await adminDb.collection('pushTokens').doc(token).get();
  if (snap.exists && snap.data()?.uid === session.uid) {
    await adminMessaging.unsubscribeFromTopic(token, PLATFORM_TOPIC).catch(() => {});
    await adminDb.collection('pushTokens').doc(token).delete();
  }

  return NextResponse.json({ ok: true });
}
