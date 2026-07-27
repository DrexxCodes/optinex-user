'use client';

import { LogOut } from 'lucide-react';
import { useLogout } from '../../lib/useLogout';

export default function LogoutButton() {
  const { logout, loggingOut } = useLogout();

  return (
    <button
      onClick={logout}
      disabled={loggingOut}
      className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 py-3.5 text-sm font-semibold text-red-500 transition hover:bg-red-100 disabled:opacity-50"
    >
      <LogOut size={16} /> {loggingOut ? 'Logging out…' : 'Logout'}
    </button>
  );
}
