'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import HomeScreen from './screens/HomeScreen';
import RentalsScreen from './screens/RentalsScreen';
import ChatListScreen from './screens/ChatListScreen';
import ProfileScreen from './screens/ProfileScreen';
import { iosSpring } from '@/components/motion/motionPrimitives';

const AnimatedTabNavigator = () => {
  const { currentTab } = useStore();
  const shouldReduceMotion = useReducedMotion();

  const tabs = [
    { key: 'Home', content: <HomeScreen /> },
    { key: 'Rentals', content: <RentalsScreen /> },
    { key: 'Chat', content: <ChatListScreen /> },
    { key: 'Profile', content: <ProfileScreen /> },
  ];

  return (
    <div className="tab-content">
      {tabs.map((tab) => {
        const active = tab.key === currentTab;
        return (
          <motion.div
            key={tab.key}
            className={`tab-screen ${active ? 'active' : 'inactive'}`}
            aria-hidden={!active}
            initial={false}
            animate={shouldReduceMotion ? undefined : {
              opacity: active ? 1 : 0,
              x: active ? 0 : -10,
              scale: active ? 1 : 0.995,
            }}
            transition={iosSpring}
            style={{
              display: active ? 'block' : 'none',
              pointerEvents: active ? 'auto' : 'none',
            }}
          >
            {tab.content}
          </motion.div>
        );
      })}
    </div>
  );
};

export default AnimatedTabNavigator;
