'use client';

const TABS = [
  { id: 'streak', label: 'Streak' },
  { id: 'spin', label: 'Spin the Wheel' }
] as const;

export type EarnTabId = (typeof TABS)[number]['id'];

export default function EarnTabs({ active, onChange }: { active: EarnTabId; onChange: (tab: EarnTabId) => void }) {
  return (
    <div className="mt-4 flex gap-2 rounded-full bg-white/40 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
            active === tab.id ? 'bg-brand-500 text-white shadow-card' : 'text-ink/60'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
