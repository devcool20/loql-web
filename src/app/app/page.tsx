'use client';

import dynamic from 'next/dynamic';
import { MobileOnlyAppGate } from '@/components/app/MobileOnlyAppGate';

const AppShell = dynamic(() => import('@/components/app/AppShell'), {
  ssr: false,
  loading: () => (
    <div className="splash-screen">
      <img src="/logo.png" alt="loql" className="splash-logo" />
    </div>
  ),
});

export default function AppPage() {
  return (
    <MobileOnlyAppGate>
      <AppShell />
    </MobileOnlyAppGate>
  );
}
