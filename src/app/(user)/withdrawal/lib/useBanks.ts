'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export function useBanks() {
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch('/api/withdrawal/banks')
      .then((res) => (res.ok ? res.json() : { banks: [] }))
      .then((data) => setBanks(data.banks))
      .finally(() => setLoading(false));
  }, []);

  return { banks, loading };
}
