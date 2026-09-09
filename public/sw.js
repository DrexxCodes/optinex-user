// Minimal service worker: enables installability and a splash-screen-ready
// app shell cache. Kept intentionally lightweight — data always comes fresh
// from the network; only the shell (logo, loader, background, manifest) is cached.
//
// This file also doubles as the Firebase Cloud Messaging service worker.
// FCM requires its handler to live in a service worker at the origin root
// (or wherever it's registered from) — rather than register a second SW at
// the same scope (which would fight this one for control of the page), the
// messaging bits are merged in here via importScripts.
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js');

// Values below are the same NEXT_PUBLIC_FIREBASE_* config used by the app —
// public client identifiers, not secrets, so hardcoding them here (service
// workers can't read process.env) is safe. Fill these in with the values
// from your Firebase project settings before deploying; see the README.
firebase.initializeApp({
  apiKey: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_API_KEY',
  authDomain: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  projectId: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  messagingSenderId: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'REPLACE_WITH_NEXT_PUBLIC_FIREBASE_APP_ID'
});

const messaging = firebase.messaging.isSupported() ? firebase.messaging() : null;

// Background push (app closed / tab not focused). Foreground pushes are
// handled in-app via onMessage (see src/lib/firebase/messaging.ts) since
// Chrome won't show a system notification for a page that's already open.
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title ?? payload.data?.title ?? 'Optinex Africa';
    const body = payload.notification?.body ?? payload.data?.body ?? '';
    const link = payload.fcmOptions?.link ?? payload.data?.link ?? '/dashboard';

    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { link }
    });
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link ?? '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(link));
      if (existing) return existing.focus();
      const client = clientsArr[0];
      if (client) {
        client.focus();
        client.navigate(link);
        return;
      }
      return self.clients.openWindow(link);
    })
  );
});

const CACHE_NAME = 'Incossify-shell-v1';
const SHELL_ASSETS = ['/logo.png', '/loader.gif', '/background.png', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        // cache.addAll() is all-or-nothing — one missing/failed shell asset
        // throws and fails the whole install, which kills the service
        // worker (status: redundant) and takes push notifications down
        // with it. Cache each asset independently instead, so a missing
        // shell asset only means that one asset isn't precached.
        Promise.allSettled(SHELL_ASSETS.map((asset) => cache.add(asset)))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (SHELL_ASSETS.some((asset) => request.url.endsWith(asset))) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
  }
});
