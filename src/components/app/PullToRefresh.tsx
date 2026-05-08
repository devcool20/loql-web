'use client';

import React, { useRef, useState } from 'react';
import { useStore } from '@/store/useStore';

const THRESHOLD = 74;
const MAX_PULL = 106;

const tabToTarget = {
  Home: 'home',
  Rentals: 'rentals',
  Chat: 'chat',
  Profile: 'profile',
} as const;

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const currentTab = useStore((state) => state.currentTab);
  const refreshScreen = useStore((state) => state.refreshScreen);
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const isAtTop = () => {
    const activeScreen = document.querySelector('.tab-screen.active') as HTMLElement | null;
    return !activeScreen || activeScreen.scrollTop <= 0;
  };

  const reset = () => {
    startY.current = null;
    setPull(0);
  };

  return (
    <div
      className="pull-refresh-shell"
      onTouchStart={(event) => {
        if (!isAtTop()) return;
        startY.current = event.touches[0]?.clientY ?? null;
      }}
      onTouchMove={(event) => {
        if (startY.current == null || !isAtTop()) return;
        const delta = (event.touches[0]?.clientY ?? 0) - startY.current;
        if (delta <= 0) {
          setPull(0);
          return;
        }
        setPull(Math.min(MAX_PULL, delta * 0.55));
      }}
      onTouchEnd={() => {
        if (pull >= THRESHOLD && !refreshing) {
          setRefreshing(true);
          refreshScreen(tabToTarget[currentTab]);
          window.setTimeout(() => setRefreshing(false), 900);
        }
        reset();
      }}
      onTouchCancel={reset}
    >
      <div
        className={`pull-refresh-indicator ${refreshing ? 'refreshing' : ''}`}
        style={{ transform: `translate3d(-50%, ${refreshing ? 12 : Math.max(-42, pull - 58)}px, 0)`, opacity: refreshing || pull > 6 ? 1 : 0 }}
      >
        <span className="pull-refresh-dot" />
        <span>{refreshing ? 'Refreshing' : pull >= THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}</span>
      </div>
      {children}
    </div>
  );
}
