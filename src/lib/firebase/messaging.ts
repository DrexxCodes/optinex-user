'use client';

// Client-side Cloud Messaging. Kept separate from client.ts because
// `getMessaging` throws in unsupported environments (SSR, Safari without
// the right flags, browsers with no service worker support) and the whole
// module has to be guarded behind `isSupported()` before it's touched.
import { getToken, getMessaging, isSupported, onMessage, type Messaging } from 'firebase/messaging';
import { firebaseApp } from './client';
import { authFetch } from '@/lib/auth/authClient';

const REGISTERED_FLAG_KEY = 'Incossify-push-registered-token';
const DEVICE_ID_KEY = 'Incossify-push-device-id';

let messagingInstance: Messaging | null | undefined;

async function getMessagingSafe(): Promise<Messaging | null> {
  if (messagingInstance !== undefined) return messagingInstance;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
    messagingInstance = null;
    return null;
  }
  const supported = await isSupported().catch(() => false);
  messagingInstance = supported ? getMessaging(firebaseApp) : null;
  return messagingInstance;
}

// A stable per-browser id, purely so a user's push tokens can be told apart
// across devices in Firestore — unrelated to the auth session's deviceId,
// which the client can't read (it lives inside an httpOnly cookie).
function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

/**
 * Requests notification permission (if not already decided) and, if
 * granted, fetches an FCM token and registers it with the server. Safe to
 * call on every load — it no-ops once this browser already has a
 * registered token, and never re-prompts if the user has denied.
 *
 * Returns 'registered' | 'denied' | 'unsupported' | 'skipped' | 'error'.
 */
export async function ensurePushRegistered(): Promise<'registered' | 'denied' | 'unsupported' | 'skipped' | 'error'> {
  const messaging = await getMessagingSafe();
  if (!messaging) return 'unsupported';

  if (Notification.permission === 'denied') return 'denied';

  const alreadyRegistered = localStorage.getItem(REGISTERED_FLAG_KEY);
  if (alreadyRegistered && Notification.permission === 'granted') return 'skipped';

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return 'denied';
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    if (!token) return 'error';

    const res = await authFetch('/api/notifications/register', {
      method: 'POST',
      body: JSON.stringify({ token, deviceId: getOrCreateDeviceId() })
    });
    if (!res.ok) return 'error';

    localStorage.setItem(REGISTERED_FLAG_KEY, token);
    return 'registered';
  } catch {
    return 'error';
  }
}

/**
 * Foreground push handler. FCM/browsers don't surface a system notification
 * for a page that's already open and focused, so the caller is responsible
 * for showing something (a toast, a badge, etc). Returns an unsubscribe fn.
 */
export async function onForegroundPush(handler: (payload: { title: string; body: string; link?: string }) => void) {
  const messaging = await getMessagingSafe();
  if (!messaging) return () => {};

  return onMessage(messaging, (payload) => {
    handler({
      title: payload.notification?.title ?? payload.data?.title ?? 'Optinex Africa',
      body: payload.notification?.body ?? payload.data?.body ?? '',
      link: payload.fcmOptions?.link ?? payload.data?.link
    });
  });
}
