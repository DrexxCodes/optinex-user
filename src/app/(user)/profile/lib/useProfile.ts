'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth/authClient';
import { useCurrentUser } from '../../lib/useCurrentUser';

export function useProfile() {
  const { user, loading, refresh } = useCurrentUser();
  const [fullName, setFullName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) setFullName(user.fullName);
  }, [user]);

  const startEditing = () => setEditing(true);

  const cancelEditing = () => {
    setEditing(false);
    setError(null);
    if (user) setFullName(user.fullName);
  };

  const saveFullName = async () => {
    if (!fullName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await authFetch('/api/user/me', {
        method: 'PATCH',
        body: JSON.stringify({ fullName: fullName.trim() })
      });
      if (!res.ok) {
        setError('Could not save your name.');
        return;
      }
      await refresh();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return { user, loading, fullName, setFullName, editing, startEditing, cancelEditing, saving, error, saveFullName };
}
