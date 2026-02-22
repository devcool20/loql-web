'use client';

import React from 'react';
import { useStore } from '@/store/useStore';
import HomeScreen from './screens/HomeScreen';
import RentalsScreen from './screens/RentalsScreen';
import ChatListScreen from './screens/ChatListScreen';
import ProfileScreen from './screens/ProfileScreen';

const TAB_ORDER = ['Home', 'Rentals', 'Chat', 'Profile'] as const;

const AnimatedTabNavigator = () => {
  const { currentTab } = useStore();

  const tabContent: Record<string, React.ReactNode> = {
    Home: <HomeScreen />,
    Rentals: <RentalsScreen />,
    Chat: <ChatListScreen />,
    Profile: <ProfileScreen />,
  };

  return (
    <div className="tab-content">
      {TAB_ORDER.map((tab) => {
        const isActive = currentTab === tab;
        return (
          <div
            key={tab}
            className={`tab-screen ${isActive ? 'active' : 'hidden'}`}
            style={{
              transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
              opacity: isActive ? 1 : 0,
            }}
          >
            {tabContent[tab]}
          </div>
        );
      })}
    </div>
  );
};

export default AnimatedTabNavigator;
