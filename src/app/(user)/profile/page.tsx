'use client';

import { useProfile } from './lib/useProfile';
import ProfileHeader from './components/ProfileHeader';
import FullNameEditor from './components/FullNameEditor';
import AccountDetails from './components/AccountDetails';
import LogoutButton from './components/LogoutButton';

export default function ProfilePage() {
  const { user, loading, fullName, setFullName, editing, startEditing, cancelEditing, saving, error, saveFullName } = useProfile();

  if (loading || !user) {
    return (
      <div className="px-4 pt-4 lg:max-w-3xl lg:px-0 lg:pt-2">
        <div className="h-40 animate-pulse rounded-3xl bg-white/40" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 lg:max-w-3xl lg:px-0 lg:pt-2">
      <h1 className="font-display text-xl font-bold text-ink">Profile</h1>
      <p className="mt-1 text-sm text-ink/60">Your account details and settings.</p>

      <div className="mt-5">
        <ProfileHeader user={user} />
      </div>

      <FullNameEditor
        fullName={fullName}
        currentValue={user.fullName}
        editing={editing}
        saving={saving}
        error={error}
        onChange={setFullName}
        onStartEditing={startEditing}
        onCancel={cancelEditing}
        onSave={saveFullName}
      />

      <AccountDetails user={user} />

      <LogoutButton />
    </div>
  );
}
