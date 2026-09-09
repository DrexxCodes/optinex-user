'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X } from 'lucide-react';
import { ensurePushRegistered, onForegroundPush } from '@/lib/firebase/messaging';

type Toast = { title: string; body: string; link?: string };

// Mounted once, inside the authenticated app shell. On first load for a
// device that hasn't registered yet, this triggers the browser's native
// permission prompt and — once granted — silently gets an FCM token and
// registers it with the server. On every later load it's a silent no-op
// (registered) or a no-op that respects an earlier "denied" choice.
export default function PushNotificationManager() {
  const [toast, setToast] = useState<Toast | null>(null);
  const router = useRouter();

  useEffect(() => {
    ensurePushRegistered();

    let unsubscribe: (() => void) | undefined;
    onForegroundPush((payload) => setToast(payload)).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => unsubscribe?.();
  }, []);

  if (!toast) return null;

  const dismiss = () => setToast(null);
  const open = () => {
    if (toast.link) router.push(toast.link);
    dismiss();
  };

  return (
    <div className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-50 animate-fade-up">
      <button onClick={open} className="glass-panel flex w-full items-start gap-3 rounded-2xl px-4 py-3 text-left shadow-glass">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
          <Bell size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{toast.title}</p>
          <p className="line-clamp-2 text-xs text-ink/60">{toast.body}</p>
        </div>
        <span
          role="button"
          aria-label="Dismiss"
          onClick={(e) => {
            e.stopPropagation();
            dismiss();
          }}
          className="shrink-0 text-ink/40"
        >
          <X size={16} />
        </span>
      </button>
    </div>
  );
}
