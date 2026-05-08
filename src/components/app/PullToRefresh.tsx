'use client';

import React, { useRef, useState, useEffect } from 'react';
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
  const shellRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (!isAtTop()) return;
      startY.current = e.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (startY.current == null || !isAtTop()) return;
      
      const delta = (e.touches[0]?.clientY ?? 0) - startY.current;
      
      if (delta > 0) {
        // If we are pulling down at the top, prevent the default browser behavior (like reload)
        if (e.cancelable) e.preventDefault();
        setPull(Math.min(MAX_PULL, delta * 0.55));
      } else {
        setPull(0);
      }
    };

    const handleTouchEnd = () => {
      if (pull >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        refreshScreen(tabToTarget[currentTab]);
        window.setTimeout(() => setRefreshing(false), 900);
      }
      reset();
    };

    // We use { passive: false } to allow e.preventDefault() which is essential
    // to block the browser's native pull-to-refresh on real mobile devices.
    shell.addEventListener('touchstart', handleTouchStart, { passive: true });
    shell.addEventListener('touchmove', handleTouchMove, { passive: false });
    shell.addEventListener('touchend', handleTouchEnd, { passive: true });
    shell.addEventListener('touchcancel', reset, { passive: true });

    return () => {
      shell.removeEventListener('touchstart', handleTouchStart);
      shell.removeEventListener('touchmove', handleTouchMove);
      shell.removeEventListener('touchend', handleTouchEnd);
      shell.removeEventListener('touchcancel', reset);
    };
  }, [pull, refreshing, currentTab, refreshScreen]);

  return (
    <div className="pull-refresh-shell" ref={shellRef}>
      <div
        className={`pull-refresh-indicator ${refreshing ? 'refreshing' : ''}`}
        style={{ 
          transform: `translate3d(-50%, ${refreshing ? 12 : Math.max(-42, pull - 58)}px, 0)`, 
          opacity: refreshing || pull > 6 ? 1 : 0 
        }}
      >
        <span className="pull-refresh-dot" />
        <span>{refreshing ? 'Refreshing' : pull >= THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}</span>
      </div>
      {children}
    </div>
  );
}
