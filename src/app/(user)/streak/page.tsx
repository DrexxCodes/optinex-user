'use client';

import { useState } from 'react';
import EarnTabs, { type EarnTabId } from './components/EarnTabs';
import StreakTab from './components/StreakTab';
import SpinTab from './components/spin/SpinTab';

export default function EarnPage() {
  const [tab, setTab] = useState<EarnTabId>('streak');

  return (
    <div className="px-4 pt-4 lg:max-w-3xl lg:px-0 lg:pt-2">
      <h1 className="font-display text-xl font-bold text-ink">Earn</h1>

      <EarnTabs active={tab} onChange={setTab} />

      <div className="mt-2">
        {tab === 'streak' ? <StreakTab /> : <SpinTab />}
      </div>
    </div>
  );
}
