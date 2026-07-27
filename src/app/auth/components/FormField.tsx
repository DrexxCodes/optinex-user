'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; isPassword?: boolean };

export default function FormField({ label, isPassword, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">{label}</span>
      <div className="relative">
        <input
          {...props}
          type={isPassword ? (visible ? 'text' : 'password') : props.type ?? 'text'}
          className="w-full rounded-xl border border-brand-100 bg-white/80 px-4 py-3 text-sm text-ink placeholder:text-ink/30 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40"
            tabIndex={-1}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </label>
  );
}
