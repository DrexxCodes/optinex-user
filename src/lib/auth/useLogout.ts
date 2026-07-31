'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/auth/authClient';

// Shared logout hook — used from the marketing navbar as well as the
// authenticated app shell, so it lives outside the (user) route group.
export function useLogout(redirectTo: string = '/auth/signin') {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const logout = async () => {
    setLoggingOut(true);
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push(redirectTo);
      router.refresh();
    }
  };

  return { logout, loggingOut };
}
