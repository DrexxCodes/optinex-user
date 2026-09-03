'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const STORAGE_KEY = 'Incossify-balance-visible';

export function useBalanceVisibility() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setVisible(stored === '1');
  }, []);

  const toggle = () => {
    setVisible((v) => {
      const next = !v;
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  };

  return { visible, toggle };
}

export function MaskedAmount({ amount, visible }: { amount: number; visible: boolean }) {
  const formatted = `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  return <span>{visible ? formatted : '₦••••••'}</span>;
}

export function BalanceToggleButton({ visible, onToggle }: { visible: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label={visible ? 'Hide balance' : 'Show balance'}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
    >
      {visible ? <Eye size={16} /> : <EyeOff size={16} />}
    </button>
  );
}
