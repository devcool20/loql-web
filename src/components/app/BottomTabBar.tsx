'use client';

import React from 'react';
import { Home, ShoppingBag, MessageCircle, User } from 'lucide-react';
import { useStore } from '@/store/useStore';

type TabType = 'Home' | 'Rentals' | 'Chat' | 'Profile';

const tabs: { key: TabType; icon: typeof Home; label: string }[] = [
  { key: 'Home', icon: Home, label: 'Home' },
  { key: 'Rentals', icon: ShoppingBag, label: 'Rentals' },
  { key: 'Chat', icon: MessageCircle, label: 'Chat' },
  { key: 'Profile', icon: User, label: 'Profile' },
];

const BottomTabBar = () => {
  const { currentTab, setCurrentTab, currentStack } = useStore();

  // Hide tab bar when a stack screen is open
  if (currentStack) return null;

  return (
    <div className="bottom-tab-bar">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.key;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            className={`tab-button ${isActive ? 'active' : ''}`}
            onClick={() => setCurrentTab(tab.key)}
            id={`tab-${tab.key.toLowerCase()}`}
          >
            <Icon
              size={24}
              color={isActive ? '#111827' : '#9CA3AF'}
              strokeWidth={isActive ? 2.5 : 2}
            />
            {isActive && <span className="tab-label">{tab.label}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default BottomTabBar;
