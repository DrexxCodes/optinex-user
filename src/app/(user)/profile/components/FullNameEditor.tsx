'use client';

import { Pencil, Check, X } from 'lucide-react';

export default function FullNameEditor({
  fullName,
  currentValue,
  editing,
  saving,
  error,
  onChange,
  onStartEditing,
  onCancel,
  onSave
}: {
  fullName: string;
  currentValue: string;
  editing: boolean;
  saving: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onStartEditing: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="glass-panel mt-4 rounded-3xl p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm font-bold text-ink">Full Name</h3>
        {!editing && (
          <button onClick={onStartEditing} className="text-ink/40 transition hover:text-brand-500">
            <Pencil size={15} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            value={fullName}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-brand-100 bg-white/80 px-4 py-2.5 text-sm text-ink outline-none focus:border-brand-500"
            autoFocus
          />
          <button
            onClick={onSave}
            disabled={saving}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white disabled:opacity-50"
          >
            <Check size={16} />
          </button>
          <button onClick={onCancel} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink/5 text-ink/50">
            <X size={16} />
          </button>
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink/70">{currentValue}</p>
      )}
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
