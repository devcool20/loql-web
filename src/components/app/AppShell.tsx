'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { startRentalExpirationChecker } from '@/lib/rentalExpirationManager';
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import ProfileCreationScreen from './screens/ProfileCreationScreen';
import AnimatedTabNavigator from './AnimatedTabNavigator';
import BottomTabBar from './BottomTabBar';
import CustomAlert from './CustomAlert';
import ItemDetailScreen from './screens/ItemDetailScreen';
import ChatDetailScreen from './screens/ChatDetailScreen';
import NotificationScreen from './screens/NotificationScreen';
import AddItemScreen from './screens/AddItemScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import WalletScreen from './screens/WalletScreen';
import HistoryDetailScreen from './screens/HistoryDetailScreen';

const AppShell = () => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const loadingStartTime = useRef<number | null>(null);

  const {
    user, setUser,
    isLoading, setLoading,
    isProfileComplete, setProfileComplete,
    currentStack, chatUser,
  } = useStore();

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && isProfileComplete) {
      const cleanup = startRentalExpirationChecker();
      return cleanup;
    }
  }, [user, isProfileComplete]);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowSplash(false), 400);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  const checkSession = async () => {
    setLoading(true);
    if (!loadingStartTime.current) loadingStartTime.current = Date.now();

    try {
      // Handle hash-based tokens (Implicit OAuth flow - Google sign-in)
      if (typeof window !== 'undefined') {
        const hash = window.location.hash;
        if (hash && (hash.includes('access_token') || hash.includes('error'))) {
          // Give Supabase time to parse the hash and establish the session
          // This is critical on Vercel where the redirect may be slower
          let attempts = 0;
          while (attempts < 10) {
            const { data: { session: hashSession } } = await supabase.auth.getSession();
            if (hashSession) {
              setUser(hashSession.user);
              setShowWelcome(false);
              await checkProfile(hashSession.user);
              // Clean the URL hash
              window.history.replaceState({}, '', window.location.pathname);
              finishLoading();
              return;
            }
            await new Promise(resolve => setTimeout(resolve, 300));
            attempts++;
          }
          // Clean hash even if failed
          window.history.replaceState({}, '', window.location.pathname);
        }
      }

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        if (error.message.includes('Invalid Refresh Token') || error.message.includes('Refresh Token Not Found')) {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshedSession) {
            await supabase.auth.signOut();
            setUser(null);
          } else {
            setUser(refreshedSession.user);
            if (refreshedSession.user) {
              setShowWelcome(false);
              await checkProfile(refreshedSession.user);
            }
          }
        } else { setUser(null); }
        finishLoading();
        return;
      }

      setUser(session?.user ?? null);
      if (session?.user) {
        setShowWelcome(false);
        await checkProfile(session.user);
      }
    } catch (e) {
      console.error('Check session fatal error:', e);
      setUser(null);
    } finally {
      finishLoading();
    }
  };

  const finishLoading = () => {
    const elapsed = Date.now() - (loadingStartTime.current || Date.now());
    const remaining = Math.max(0, 2000 - elapsed);
    setTimeout(() => {
      setLoading(false);
      loadingStartTime.current = null;
    }, remaining);
  };

  const checkProfile = async (currentUser: any) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
      if (data) {
        if (!data.avatar_url && currentUser.user_metadata?.avatar_url) {
          await supabase.from('profiles').update({
            avatar_url: currentUser.user_metadata.avatar_url,
            full_name: data.full_name || currentUser.user_metadata.full_name || currentUser.user_metadata.name,
          }).eq('id', currentUser.id);
        }
        const updatedUser = {
          ...currentUser,
          user_metadata: {
            ...currentUser.user_metadata,
            full_name: data.full_name || currentUser.user_metadata?.full_name,
            avatar_url: data.avatar_url || currentUser.user_metadata?.avatar_url,
          },
          phone: data.phone || currentUser.phone,
        };
        setUser(updatedUser);
        setProfileComplete(!!data.full_name);
      } else {
        if (currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.full_name) {
          await supabase.from('profiles').insert({
            id: currentUser.id,
            avatar_url: currentUser.user_metadata.avatar_url,
            full_name: currentUser.user_metadata.full_name || currentUser.user_metadata.name,
            email: currentUser.email,
          });
        }
        setProfileComplete(false);
      }
    } catch (error) {
      console.error('Check profile error:', error);
      setProfileComplete(false);
    }
  };

  const renderStackScreen = () => {
    switch (currentStack) {
      case 'ItemDetail':
        return <ItemDetailScreen />;
      case 'ChatDetail':
        if (!chatUser) return null;
        return <ChatDetailScreen targetUser={chatUser} />;
      case 'Notification':
        return <NotificationScreen />;
      case 'AddItem':
        return <AddItemScreen />;
      case 'EditProfile':
        return <EditProfileScreen />;
      case 'Wallet':
        return <WalletScreen />;
      case 'HistoryDetail':
        return <HistoryDetailScreen />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (isLoading && !user) return null;

    if (!user) {
      if (showWelcome) return <WelcomeScreen onStart={() => setShowWelcome(false)} />;
      return <LoginScreen />;
    }

    if (!isProfileComplete) {
      return (
        <ProfileCreationScreen
          onComplete={() => {
            setProfileComplete(true);
            checkSession();
          }}
        />
      );
    }

    return (
      <div className="tab-container">
        <AnimatedTabNavigator />
        <BottomTabBar />
        {renderStackScreen()}
      </div>
    );
  };

  return (
    <div className="app-shell">
      {renderContent()}
      <CustomAlert />

      {showSplash && (
        <div className={`splash-screen ${!isLoading ? 'fade-out' : ''}`}>
          <img src="/logo.png" alt="loql" className="splash-logo" />
        </div>
      )}
    </div>
  );
};

export default AppShell;
