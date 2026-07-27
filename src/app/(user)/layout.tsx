'use client';

import BottomNav from './components/BottomNav';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import WelcomeDialog from './components/WelcomeDialog';
import RouteLoader from '@/components/RouteLoader';
import PWAInstaller from '@/components/PWAInstaller';
import { useCurrentUser } from './lib/useCurrentUser';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCurrentUser();

  return (
    <div className="relative min-h-dvh">
      <div className="app-background" />
      <RouteLoader />
      {!loading && user && <WelcomeDialog username={user.username} />}

      <Sidebar />

      {/* lg:pl-64 clears the fixed sidebar. Content itself stays a
          comfortable reading width on mobile (max-w-md, like a phone app)
          but opens up to a much wider canvas on desktop instead of sitting
          as a narrow column in a sea of empty space. */}
      <div className="lg:pl-64">
        <TopBar user={user ?? null} />
        <main className="mx-auto min-h-dvh max-w-md px-0 pb-28 lg:max-w-6xl lg:px-8 lg:pb-16">{children}</main>
      </div>

      <BottomNav />
      <PWAInstaller />
    </div>
  );
}
