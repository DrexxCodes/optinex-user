'use client';

import { RefreshCw } from 'lucide-react';

// A plain reload is enough: the proxy sends the visitor back into the app
// as soon as maintenance mode is switched off.
export default function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-6 py-3 font-display text-sm font-semibold text-white shadow-glass transition hover:bg-brand-600 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2"
    >
      <RefreshCw size={16} aria-hidden />
      Check again
    </button>
  );
}
