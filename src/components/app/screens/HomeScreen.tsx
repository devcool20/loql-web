'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import TypewriterText from '@/components/app/TypewriterText';
import AppItemCard from '@/components/app/AppItemCard';
import { HomeSkeletonGrid } from '@/components/app/Skeleton';
import { processCompletedRentals } from '@/lib/rentalCompletion';
import { cacheGet, cacheSet, cacheGetStale, CACHE_KEYS, TTL } from '@/lib/cache';

const HomeScreen = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userSocietyId, setUserSocietyId] = useState<string | null>(null);

  const user = useStore((state) => state.user);
  const { navigateToDetail, setCurrentStack } = useStore();
  const refreshTrigger = useStore(state => state.refreshTrigger);

  const categories = ['All', 'DIY Tools', 'Party', 'Gaming', 'Fitness', 'Electronics', 'Kitchen'];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  useEffect(() => {
    fetchUserSociety();
  }, [user]);

  useEffect(() => {
    if (userSocietyId) {
      setupLocation();
      loadItems(true); // force load when refreshTrigger changes
    }
  }, [userSocietyId, refreshTrigger]);

  const fetchUserSociety = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('society_id')
        .eq('id', user.id)
        .single();

      if (data?.society_id) {
        setUserSocietyId(data.society_id);
        cacheSet(CACHE_KEYS.profile(user.id) + '_society', data.society_id, TTL.LONG);
      }
    } catch (error) {
      console.error('Error fetching user society:', error);
    }
  };

  const setupLocation = async () => {
    if (!userSocietyId) {
      setLocationName('No Society');
      return;
    }

    const cached = await cacheGet<string>(CACHE_KEYS.societyName(userSocietyId));
    if (cached) {
      setLocationName(cached);
      return;
    }

    try {
      const { data } = await supabase
        .from('societies')
        .select('name')
        .eq('id', userSocietyId)
        .single();

      if (data) {
        setLocationName(data.name);
        cacheSet(CACHE_KEYS.societyName(userSocietyId), data.name, TTL.LONG);
      }
    } catch (error) {
      setLocationName('Your Society');
    }
  };

  const loadItems = async (forceRefresh = false) => {
    if (!userSocietyId) return;
    const cacheKey = CACHE_KEYS.homeItems(userSocietyId);

    if (!forceRefresh) {
      const { data: stale } = await cacheGetStale<any[]>(cacheKey);
      if (stale && stale.length > 0) {
        setItems(stale);
        setLoading(false);
        fetchFreshItems(cacheKey);
        return;
      }
    }

    setLoading(true);
    await fetchFreshItems(cacheKey);
  };

  const fetchFreshItems = async (cacheKey: string) => {
    try {
      await processCompletedRentals();

      if (!userSocietyId) {
        setItems([]);
        return;
      }

      const { data, error } = await supabase
        .from('items')
        .select('id, title, daily_rate, images, category, owner_id, status, created_at')
        .eq('society_id', userSocietyId)
        .neq('status', 'rented')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const freshData = data || [];
      setItems(freshData);
      cacheSet(cacheKey, freshData, TTL.SHORT);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const userName = user?.user_metadata?.full_name || 'Neighbor';

  const filteredItems = items.filter((item) => {
    const titleMatch = item.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const descMatch = item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSearch = !searchQuery || titleMatch || descMatch;
    const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const isNotOwn = item.owner_id !== user?.id;
    return matchSearch && matchCategory && isNotOwn;
  });

  return (
    <div className="home-screen">
      {/* Header */}
      <div className="home-header">
        <div className="home-header-left">
          <div className="home-greeting">{getGreeting()},</div>
          <div className="home-name">
            <TypewriterText text={userName} typingSpeed={150} pauseDuration={3000} />
          </div>
          {locationName && (
            <div className="home-location-row">
              <MapPin size={12} color="#6B7280" />
              <span className="home-location">{locationName}</span>
            </div>
          )}
        </div>

        <button
          className="header-button scale-pressable"
          onClick={() => setCurrentStack('Notification')}
          id="notification-bell"
        >
          <Bell size={22} color="#111827" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <Search size={18} color="#9CA3AF" />
        <input
          className="search-input"
          placeholder="Search for tools, gear..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Categories */}
      <div className="categories-container">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <HomeSkeletonGrid count={6} />
      ) : (
        <div className="item-feed">
          {filteredItems.map((item) => (
            <AppItemCard
              key={item.id}
              item={item}
              onPress={navigateToDetail}
            />
          ))}

          {filteredItems.length === 0 && (
            <div className="empty-state">
              <span className="empty-text">
                {searchQuery ? 'No items found matching your search.' : 'No items available yet.'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
