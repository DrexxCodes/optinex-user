'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Check } from 'lucide-react';
import { authFetch } from '@/lib/auth/authClient';
import { useBanks } from '../lib/useBanks';

export default function PayoutMethodForm({
  onSaved
}: {
  onSaved: (payload: { accountNumber: string; bankCode: string; bankName: string; accountName: string }) => Promise<boolean>;
}) {
  const { banks, loading } = useBanks();
  const [accountNumber, setAccountNumber] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountName, setAccountName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolve = async () => {
    if (accountNumber.length !== 10) return;
    if (!bankCode) {
      setError('Select a bank first.');
      return;
    }
    setResolving(true);
    setError(null);
    setAccountName(null);
    try {
      const res = await authFetch('/api/withdrawal/resolve-account', {
        method: 'POST',
        body: JSON.stringify({ accountNumber, bankCode })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Could not resolve account.');
        return;
      }
      setAccountName(data.accountName);
    } finally {
      setResolving(false);
    }
  };

  const save = async () => {
    if (!accountName) return;
    setSaving(true);
    const bankName = banks.find((b) => b.code === bankCode)?.name ?? '';
    const ok = await onSaved({ accountNumber, bankCode, bankName, accountName });
    setSaving(false);
    if (!ok) setError('Could not save your payout method.');
  };

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-card">
      <h3 className="font-display text-sm font-bold text-ink">Set Up Payout Method</h3>

      <BankPicker
        banks={banks}
        loading={loading}
        value={bankCode}
        onChange={(code) => {
          setBankCode(code);
          setAccountName(null);
        }}
      />

      <label className="mt-3 block">
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Account Number</span>
        <div className="flex gap-2">
          <input
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
              setAccountName(null);
              setError(null);
            }}
            maxLength={10}
            placeholder="0123456789"
            className="w-full flex-1 rounded-xl border border-brand-100 bg-white/80 px-4 py-3 text-sm text-ink outline-none focus:border-brand-500"
          />
          <button
            type="button"
            onClick={resolve}
            disabled={accountNumber.length !== 10 || resolving}
            className="shrink-0 rounded-xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition disabled:bg-ink/10 disabled:text-ink/40"
          >
            {resolving ? 'Verifying…' : 'Verify'}
          </button>
        </div>
      </label>

      {resolving && <p className="mt-2 text-xs text-ink/50">Resolving account…</p>}
      {accountName && (
        <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600">{accountName}</p>
      )}
      {error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button
        onClick={save}
        disabled={!accountName || saving}
        className="mt-4 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save Payout Method'}
      </button>
    </div>
  );
}

// Type-to-search bank picker. Replaces the old plain <select> — with 100+
// Nigerian banks in the list, scrolling a native dropdown was painful, so
// this lets the user type a few letters of the bank name and pick from the
// matching suggestions instead.
function BankPicker({
  banks,
  loading,
  value,
  onChange
}: {
  banks: { code: string; name: string }[];
  loading: boolean;
  value: string;
  onChange: (code: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedBank = banks.find((b) => b.code === value) ?? null;

  // Keep the input text in sync with the selected bank whenever it changes
  // from outside (e.g. form reset) without clobbering what the user is typing.
  useEffect(() => {
    if (selectedBank) setQuery(selectedBank.name);
  }, [selectedBank?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banks.slice(0, 8);
    return banks.filter((b) => b.name.toLowerCase().includes(q)).slice(0, 8);
  }, [banks, query]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        // Snap back to the last confirmed selection if the user typed
        // something and clicked away without picking a suggestion.
        setQuery(selectedBank?.name ?? '');
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open, selectedBank]);

  const pick = (bank: { code: string; name: string }) => {
    onChange(bank.code);
    setQuery(bank.name);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pickedBank = suggestions[highlighted];
      if (pickedBank) pick(pickedBank);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative mt-4">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink/50">Bank</span>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
        <input
          value={query}
          disabled={loading}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlighted(0);
            setOpen(true);
            if (value) onChange(''); // typing invalidates the previous exact match
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={loading ? 'Loading banks…' : 'Start typing your bank name…'}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          className="w-full rounded-xl border border-brand-100 bg-white/80 py-3 pl-10 pr-4 text-sm text-ink outline-none focus:border-brand-500"
        />
      </div>

      {open && !loading && (
        <ul
          role="listbox"
          className="glass-panel absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-xl p-1.5 shadow-glass"
        >
          {suggestions.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-ink/40">No banks match "{query}"</li>
          )}
          {suggestions.map((bank, i) => (
            <li key={bank.code}>
              <button
                type="button"
                role="option"
                aria-selected={bank.code === value}
                onMouseDown={(e) => e.preventDefault()} // keep input focus so onBlur doesn't fire before click
                onClick={() => pick(bank)}
                onMouseEnter={() => setHighlighted(i)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  i === highlighted ? 'bg-brand-50 text-brand-600' : 'text-ink hover:bg-white/70'
                }`}
              >
                {bank.name}
                {bank.code === value && <Check size={14} className="text-brand-500" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
