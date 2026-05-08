'use client';

import dynamic from 'next/dynamic';
import { MobileOnlyAppGate } from '@/components/app/MobileOnlyAppGate';
import AppLoaderFallback from '@/components/app/AppLoaderFallback';

const AppShell = dynamic(() => import('@/components/app/AppShell'), {
  ssr: false,
  loading: () => <AppLoaderFallback />,
});

export default function AppPage() {
  return (
    <MobileOnlyAppGate>
      <AppShell />
    </MobileOnlyAppGate>
  );
}
