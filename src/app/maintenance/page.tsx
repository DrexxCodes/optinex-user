import type { Metadata } from 'next';
import Image from 'next/image';
import MaintenanceCard from '@/components/maintenance/MaintenanceCard';

export const metadata: Metadata = {
  title: 'Under maintenance — Incossify Africa',
  robots: { index: false, follow: false }
};

// Fully static: the proxy decides whether this page is reachable (MAINTAIN=1),
// so changing the env var never requires a rebuild to take effect on routing.
export default function MaintenancePage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="app-background" />
      <Image src="/logo.png" alt="Incossify Africa" width={168} height={45} priority className="mb-8" />
      <MaintenanceCard />
      <p className="mt-8 text-center text-xs text-ink/50">
        &copy; {new Date().getFullYear()} Incossify Africa. All rights reserved.
      </p>
    </main>
  );
}
