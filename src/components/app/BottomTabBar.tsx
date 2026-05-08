'use client';

import React from 'react';
import { Home, ShoppingBag, MessageCircle, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store/useStore';

type TabType = 'Home' | 'Rentals' | 'Chat' | 'Profile';

const tabs: { key: TabType; icon: typeof Home; label: string }[] = [
  { key: 'Home', icon: Home, label: 'Home' },
  { key: 'Rentals', icon: ShoppingBag, label: 'Kiraya' },
  { key: 'Chat', icon: MessageCircle, label: 'Samvaad' },
  { key: 'Profile', icon: User, label: 'Pehchan' },
];

const spring = { type: 'spring' as const, stiffness: 400, damping: 30 };

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
          <motion.button
            key={tab.key}
            layout
            whileTap={{ scale: 0.95 }}
            transition={spring}
            className="tab-button"
            onClick={() => setCurrentTab(tab.key)}
            id={`tab-${tab.key.toLowerCase()}`}
            aria-current={isActive ? 'page' : undefined}
          >
            {isActive && (
              <motion.div
                layoutId="bottom-active-pill"
                className="tab-active-pill"
                transition={spring}
              />
            )}
            <Icon
              size={24}
              color={isActive ? 'var(--primary)' : 'var(--text-light)'}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <AnimatePresence initial={false}>
              {isActive && (
                <motion.span
                  key={`${tab.key}-label`}
                  className="tab-label"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  {tab.label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
};

export default BottomTabBar;
