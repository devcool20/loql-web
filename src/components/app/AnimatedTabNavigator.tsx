'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useStore } from '@/store/useStore';
import HomeScreen from './screens/HomeScreen';
import RentalsScreen from './screens/RentalsScreen';
import ChatListScreen from './screens/ChatListScreen';
import ProfileScreen from './screens/ProfileScreen';
import { iosSpring } from '@/components/motion/motionPrimitives';

const AnimatedTabNavigator = () => {
  const { currentTab } = useStore();
  const shouldReduceMotion = useReducedMotion();

  const tabContent: Record<string, React.ReactNode> = {
    Home: <HomeScreen />,
    Rentals: <RentalsScreen />,
    Chat: <ChatListScreen />,
    Profile: <ProfileScreen />,
  };

  return (
    <div className="tab-content">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={currentTab}
          className="tab-screen active"
          initial={shouldReduceMotion ? false : { opacity: 0, x: 18, scale: 0.992 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0, scale: 1 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, x: -12, scale: 0.995 }}
          transition={iosSpring}
        >
          {tabContent[currentTab]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AnimatedTabNavigator;
