'use client';

import { useEffect, useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth/authClient';

export type CurrentUser = {
  uid: string;
  fullName: string;
  email: string;
  username: string;
  walletAmount: number;
  packageStatus: string;
  packageName?: string;
  packageExpiresAt?: number;
  isChangingPackage?: boolean;
  accountTier: 'standard' | 'upgraded';
  upgradeStatus: 'none' | 'pending' | 'active';
  payoutMethod: {
    accountNumber: string;
    bankCode: string;
    bankName: string;
    accountName: string;
  } | null;
  admin: boolean;
  avatarUrl: string;
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/user/me');
      if (res.ok) setUser(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { user, loading, refresh };
}
