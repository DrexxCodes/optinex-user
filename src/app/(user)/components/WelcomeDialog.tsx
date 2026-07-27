'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { authFetch } from '@/lib/auth/authClient';

type PopupConfig = {
  enabled: boolean;
  title?: string;
  body?: string;
  actionLabel?: string | null;
  actionLink?: string | null;
};

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

// Runs once per session on dashboard load. Title/body/action are configured
// entirely by Admin in Firestore (`config/popup`) — this component never
// hardcodes campaign copy.
export default function WelcomeDialog({ username }: { username: string }) {
  const [config, setConfig] = useState<PopupConfig | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('optinex-welcome-shown')) return;
    authFetch('/api/popup')
      .then((res) => (res.ok ? res.json() : { enabled: false }))
      .then((data: PopupConfig) => {
        setConfig(data);
        if (data.enabled) {
          setOpen(true);
          sessionStorage.setItem('optinex-welcome-shown', '1');
        }
      })
      .catch(() => {});
  }, []);

  if (!open || !config?.enabled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 pb-24 pt-10 backdrop-blur-sm sm:items-center sm:pb-10">
      <div className="glass-panel w-full max-w-sm animate-fade-up rounded-3xl p-6 shadow-glass">
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
            Good {timeOfDay()}, {username}
          </p>
          <button onClick={() => setOpen(false)} className="text-ink/40">
            <X size={18} />
          </button>
        </div>
        <h2 className="mt-2 font-display text-xl font-bold text-ink">{config.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">{config.body}</p>
        {config.actionLabel && config.actionLink && (
          <a
            href={config.actionLink}
            className="mt-5 block rounded-xl bg-brand-500 py-3 text-center text-sm font-semibold text-white"
            onClick={() => setOpen(false)}
          >
            {config.actionLabel}
          </a>
        )}
      </div>
    </div>
  );
}
