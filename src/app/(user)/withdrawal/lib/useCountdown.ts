'use client';

import { useEffect, useState } from 'react';

export type CountdownParts = {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

function diffToParts(targetMs: number): CountdownParts {
  const totalMs = Math.max(0, targetMs - Date.now());
  const totalSeconds = Math.floor(totalMs / 1000);

  return {
    totalMs,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: totalMs <= 0
  };
}

// Ticks down to `targetDate` every second. Calls `onExpire` once, the moment
// the countdown reaches zero, so callers can e.g. re-fetch withdrawal status
// to unlock the form without the user having to refresh the page.
export function useCountdown(targetDate: string | null, onExpire?: () => void) {
  const targetMs = targetDate ? new Date(targetDate).getTime() : null;
  const [parts, setParts] = useState<CountdownParts | null>(targetMs ? diffToParts(targetMs) : null);

  useEffect(() => {
    if (!targetMs) {
      setParts(null);
      return;
    }

    setParts(diffToParts(targetMs));

    let firedExpiry = false;
    const interval = setInterval(() => {
      const next = diffToParts(targetMs);
      setParts(next);
      if (next.expired && !firedExpiry) {
        firedExpiry = true;
        onExpire?.();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetMs]);

  return parts;
}
