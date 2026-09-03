'use client';

import { useEffect, useState } from 'react';
import { X, Share, PlusSquare, Download } from 'lucide-react';

// Cross-platform one-click install:
//  - Android/Chrome: captures the native `beforeinstallprompt` event and
//    replays it from our own button (the browser's default mini-bar is suppressed).
//  - iOS Safari: there is no native prompt API, so we detect standalone-capable
//    Safari and show a short "Add to Home Screen" walkthrough instead.
//
// Dismiss budget: at most 2 dismissals per calendar day, tracked in
// localStorage (not sessionStorage, so it survives tab/browser restarts and
// isn't a fresh count on every route navigation). Once the user has
// dismissed it twice today, the banner stays hidden until the date rolls over.
const STORAGE_KEY = 'optinex-install-banner-state';
const MAX_DISMISSALS_PER_DAY = 2;

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function readDismissCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const state = JSON.parse(raw) as { date: string; dismissals: number };
    if (state.date !== todayKey()) return 0; // new day, budget resets
    return state.dismissals ?? 0;
  } catch {
    return 0;
  }
}

function recordDismissal() {
  try {
    const count = readDismissCount();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), dismissals: count + 1 }));
  } catch {
    // localStorage unavailable (private mode, etc) — fail open, no persistence.
  }
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const [showIosBanner, setShowIosBanner] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) return;

    if (readDismissCount() >= MAX_DISMISSALS_PER_DAY) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroidBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(window.navigator.userAgent);
    if (isIos && isSafari) setShowIosBanner(true);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = () => {
    setShowAndroidBanner(false);
    setShowIosBanner(false);
    recordDismissal();
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowAndroidBanner(false);
  };

  if (!showAndroidBanner && !showIosBanner) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 animate-fade-up">
      <div className="glass-panel flex items-center gap-3 rounded-2xl px-4 py-3 shadow-glass">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
          <Download size={18} />
        </div>
        {showAndroidBanner ? (
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">Install Incossify Africa</p>
            <p className="text-xs text-ink/60">Instant launch, right from your home screen.</p>
          </div>
        ) : (
          <div className="flex-1 text-xs text-ink/70">
            <p className="text-sm font-semibold text-ink">Install this app</p>
            <p className="mt-0.5 flex items-center gap-1">
              Tap <Share size={14} className="inline text-brand-500" /> then{' '}
              <PlusSquare size={14} className="inline text-brand-500" /> "Add to Home Screen"
            </p>
          </div>
        )}
        {showAndroidBanner && (
          <button onClick={install} className="shrink-0 rounded-xl bg-brand-500 px-3 py-2 text-xs font-semibold text-white">
            Install
          </button>
        )}
        <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-ink/40">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
