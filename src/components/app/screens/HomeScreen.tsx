'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import TypewriterText from '@/components/app/TypewriterText';
import AppItemCard from '@/components/app/AppItemCard';
import { HomeSkeletonGrid } from '@/components/app/Skeleton';
import AppTopBar from '@/components/app/AppTopBar';
import { LiveActivityPulse } from '@/components/app/LiveActivity';
import { processCompletedRentals } from '@/lib/rentalCompletion';
import { cacheGet, cacheSet, cacheGetStale, cacheInvalidate, dedupeRequest, CACHE_KEYS, TTL } from '@/lib/cache';
import { getSafeImageUrl } from '@/lib/imageUtils';
import {
  GEOFENCE_MESSAGES,
  calibrateMySocietyGeofence,
  checkGeofenceAccess,
  fetchFeedItemsGeofenced,
  getLocationPermissionState,
  requestCurrentLocation,
  type GeofenceCoords,
} from '@/lib/geofence';

interface HomeItem {
  id: string;
  owner_id: string;
  title?: string;
  description?: string;
  category?: string;
  [key: string]: unknown;
}

let lastRentalCompletionCheck = 0;
const RENTAL_COMPLETION_CHECK_INTERVAL = 5 * 60 * 1000;

const HomeScreen = () => {
  const [items, setItems] = useState<HomeItem[]>(() => useStore.getState().homeItems || []);
  const [loading, setLoading] = useState(() => !useStore.getState().homeIsHydrated);
  const [locationName, setLocationName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userSocietyId, setUserSocietyId] = useState<string | null>(null);
  const [showSocietyTooltip, setShowSocietyTooltip] = useState(false);
  const [societyItemCount, setSocietyItemCount] = useState<number | null>(null);
  const [geofenceBlockReason, setGeofenceBlockReason] = useState<string | null>(null);
  const [geofenceContext, setGeofenceContext] = useState<{
    distanceMeters: number | null;
    radiusMeters: number;
    accuracyMeters: number | null;
    societyName: string | null;
    permission: string;
  } | null>(null);

  const user = useStore((state) => state.user);
  const {
    navigateToDetail,
    setCurrentStack,
    setCurrentTab,
    setPermission,
    setCoords,
    refreshGeofence,
    setHomeItems,
  } = useStore();
  const homeItems = useStore(state => state.homeItems);
  const homeIsHydrated = useStore(state => state.homeIsHydrated);
  const homeLastFetchedAt = useStore(state => state.homeLastFetchedAt);
  const homeRefreshRequest = useStore(state => state.refreshRequests.home);

  const categories = ['All', 'DIY Tools', 'Party', 'Gaming', 'Fitness', 'Electronics', 'Kitchen'];

  const getGreetings = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return ['Good Morning', 'सुप्रभात', 'शुभ प्रभात', 'ಶುಭೋದಯ', 'શુભ સવાર'];
    }
    if (hour >= 12 && hour < 17) {
      return ['Good Afternoon', 'नमस्ते', 'नमस्कार', 'ನಮಸ್ಕಾರ', 'નમસ્તે'];
    }
    if (hour >= 17 && hour < 21) {
      return ['Good Evening', 'शुभ संध्या', 'शुभ संध्या', 'ಶುಭ ಸಂಜೆ', 'શુભ સાંજ'];
    }
    return ['Good Night', 'शुभ रात्रि', 'शुभ रात्री', 'ಶುಭ ರಾತ್ರಿ', 'શુભ રાત્રિ'];
  };

  useEffect(() => {
    fetchUserSociety();
  }, [user]);

  useEffect(() => {
    if (userSocietyId) {
      setupLocation();
      if (homeIsHydrated && Date.now() - homeLastFetchedAt < TTL.SHORT) {
        setItems(homeItems as HomeItem[]);
        setLoading(false);
        return;
      }
      refreshGeofenceAndLoad(false);
    }
  }, [userSocietyId]);

  useEffect(() => {
    if (homeIsHydrated) {
      setItems(homeItems as HomeItem[]);
    }
  }, [homeItems, homeIsHydrated]);

  useEffect(() => {
    if (userSocietyId && homeRefreshRequest > 0) {
      refreshGeofenceAndLoad(true);
    }
  }, [homeRefreshRequest]);

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
    } catch {
      setLocationName('Your Society');
    }
  };

  const refreshGeofenceAndLoad = async (forceRefresh = false) => {
    if (!user?.id || !userSocietyId) return;

    setLoading(true);
    try {
      const permission = await getLocationPermissionState();
      setPermission(permission);

      if (permission === 'denied' || permission === 'unavailable') {
        setGeofenceContext({
          distanceMeters: null,
          radiusMeters: 500,
          accuracyMeters: null,
          societyName: locationName || null,
          permission,
        });
        refreshGeofence({
          geofenceStatus: 'outside',
          distanceMeters: null,
          radiusMeters: 500,
          geofenceSocietyName: locationName || null,
          locationPermission: permission,
        });
        setItems([]);
        setGeofenceBlockReason(GEOFENCE_MESSAGES.permissionRequired);
        setLoading(false);
        return;
      }

      const coords = await requestCurrentLocation();
      setCoords(coords);

      const access = await checkGeofenceAccess(user.id, coords);
      setGeofenceContext({
        distanceMeters: access.distance_meters,
        radiusMeters: access.radius_meters || 500,
        accuracyMeters: coords.accuracyMeters ?? null,
        societyName: access.society_name || locationName || null,
        permission: 'granted',
      });
      refreshGeofence({
        geofenceStatus: access.allowed ? 'inside' : 'outside',
        distanceMeters: access.distance_meters,
        radiusMeters: access.radius_meters || 500,
        geofenceSocietyName: access.society_name,
        locationPermission: 'granted',
      });

      if (!access.allowed) {
        setItems([]);
        if (!access.society_id) {
          setGeofenceBlockReason('Your profile is not linked to a valid society yet.');
        } else if (access.distance_meters == null) {
          setGeofenceBlockReason('Society geofence coordinates are not configured yet for this community.');
        } else {
          setGeofenceBlockReason(GEOFENCE_MESSAGES.outsideFence);
        }
        setLoading(false);
        return;
      }

      setGeofenceBlockReason(null);
      await loadItems(forceRefresh, coords);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : null;
      setItems([]);
      setGeofenceBlockReason(message || GEOFENCE_MESSAGES.permissionRequired);
      setGeofenceContext((prev) => prev || {
        distanceMeters: null,
        radiusMeters: 500,
        accuracyMeters: null,
        societyName: locationName || null,
        permission: 'unknown',
      });
      setLoading(false);
    }
  };

  const loadItems = async (forceRefresh = false, coords?: GeofenceCoords) => {
    if (!user?.id || !userSocietyId) return;
    const cacheKey = CACHE_KEYS.homeItems(userSocietyId);

    if (!forceRefresh) {
      const { data: stale } = await cacheGetStale<HomeItem[]>(cacheKey);
      if (stale && stale.length > 0) {
        setItems(stale);
        setLoading(false);
        fetchFreshItems(cacheKey, coords);
        return;
      }
    }

    setLoading(true);
    await fetchFreshItems(cacheKey, coords);
  };

  const fetchFreshItems = async (cacheKey: string, coords?: GeofenceCoords) => {
    try {
      if (!userSocietyId || !user?.id || !coords) {
        setItems([]);
        return;
      }

      const now = Date.now();
      if (now - lastRentalCompletionCheck > RENTAL_COMPLETION_CHECK_INTERVAL) {
        lastRentalCompletionCheck = now;
        await processCompletedRentals();
      }

      const freshData = await dedupeRequest(`${cacheKey}:fresh`, () => fetchFeedItemsGeofenced(user.id, coords)) as HomeItem[];
      setItems(freshData);
      setHomeItems(freshData);
      cacheSet(cacheKey, freshData, TTL.SHORT);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLocationClick = async () => {
    if (!userSocietyId || locationName === 'No Society') return;

    if (showSocietyTooltip) {
      setShowSocietyTooltip(false);
      return;
    }

    if (societyItemCount !== null) {
      setShowSocietyTooltip(true);
      setTimeout(() => setShowSocietyTooltip(false), 3000);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('society_id', userSocietyId)
        .eq('status', 'available');

      if (!error) {
        setSocietyItemCount(count || 0);
        setShowSocietyTooltip(true);
        setTimeout(() => setShowSocietyTooltip(false), 3000);
      }
    } catch (e) {
      console.error('Error fetching society stats:', e);
    }
  };

  const handleCalibrateSociety = async () => {
    if (!user?.id || !userSocietyId) return;

    setLoading(true);
    try {
      const coords = await requestCurrentLocation();
      setCoords(coords);
      const access = await calibrateMySocietyGeofence(user.id, coords);
      setGeofenceContext({
        distanceMeters: access.distance_meters,
        radiusMeters: access.radius_meters || 500,
        accuracyMeters: coords.accuracyMeters ?? null,
        societyName: access.society_name || locationName || null,
        permission: 'granted',
      });
      refreshGeofence({
        geofenceStatus: 'inside',
        distanceMeters: access.distance_meters,
        radiusMeters: access.radius_meters || 500,
        geofenceSocietyName: access.society_name,
        locationPermission: 'granted',
      });
      cacheInvalidate(CACHE_KEYS.homeItems(userSocietyId));
      setGeofenceBlockReason(null);
      await loadItems(true, coords);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to calibrate location.';
      setGeofenceBlockReason(message);
      setLoading(false);
    }
  };

  const userName = user?.user_metadata?.full_name || 'Neighbor';
  const rawAvatar =
    user?.user_metadata?.avatar_url ||
    user?.raw_user_meta_data?.avatar_url ||
    user?.avatar_url ||
    null;
  const userAvatar = rawAvatar ? getSafeImageUrl(rawAvatar) : null;

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
      <AppTopBar
        showAvatar
        avatarUrl={userAvatar}
        avatarLabel={userName}
        onAvatarClick={() => setCurrentTab('Profile')}
        rightSlot={(
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
            {locationName ? (
              <button
                className="society-header-pill scale-pressable"
                onClick={handleLocationClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 10px',
                  borderRadius: 999,
                  border: '1px solid var(--border-light)',
                  background: 'var(--surface-alt)',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  maxWidth: 150,
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                }}
              >
                <MapPin size={12} color="var(--text-secondary)" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{locationName}</span>
              </button>
            ) : null}
            <button
              className="header-button scale-pressable"
              onClick={() => setCurrentStack('Notification')}
              id="notification-bell"
              aria-label="Notifications"
            >
              <Bell size={20} color="var(--text-primary)" />
            </button>
            {showSocietyTooltip && societyItemCount !== null && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 12, background: 'var(--accent-solid)',
                padding: '12px 16px', borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                zIndex: 50, width: 220, animation: 'fadeIn 0.2s ease', cursor: 'default'
              }}>
                <div style={{
                  position: 'absolute', top: -6, right: 44, width: 0, height: 0,
                  borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '7px solid var(--accent-solid)',
                }} />
                <span style={{ color: 'var(--accent-solid-text)', fontSize: 13, fontWeight: 500, lineHeight: 1.4, display: 'block' }}>
                  <span style={{ fontWeight: 700, color: '#10B981', fontSize: 14 }}>{societyItemCount} items</span> available to rent in your society right now!
                </span>
              </div>
            )}
          </div>
        )}
      />
      <div className="home-page-content">
      {/* Header */}
      <div className="home-header">
        <div className="home-header-left">
          <div className="home-greeting">
            <TypewriterText texts={getGreetings()} typingSpeed={100} pauseDuration={2500} />
            ,
          </div>
          <div className="home-name">
            {userName}
          </div>
        </div>
      </div>

      <LiveActivityPulse />

      {/* Search Bar */}
      <div className="search-bar">
        <Search size={18} color="var(--text-light)" />
        <input
          className="search-input"
          placeholder="Search for tools, gear..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div
        className="home-hero-card scale-pressable-up"
        style={{
          borderRadius: 24,
          padding: 18,
          marginBottom: 18,
          background: 'linear-gradient(140deg, rgba(65,179,163,0.16), rgba(65,179,163,0.38))',
          border: '1px solid rgba(65,179,163,0.24)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span className="home-hero-kicker" style={{ fontSize: 12, color: 'var(--secondary)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          The Loql Hero
        </span>
        <h3 className="home-hero-title font-serif" style={{ fontSize: 26, lineHeight: 1.2, color: 'var(--text-primary)', marginTop: 8 }}>
          Borrow what you need from trusted neighbors.
        </h3>
        <p className="home-hero-copy" style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>
          Curated picks from your society, updated all day.
        </p>
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
      {geofenceBlockReason ? (
        <div style={{
          border: '1px solid var(--border-light)',
          background: 'linear-gradient(180deg, var(--surface), var(--surface-alt))',
          borderRadius: 18,
          padding: 16,
          marginBottom: 18,
          boxShadow: '0 6px 20px rgba(45,49,66,0.08)',
        }}>
          <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: 8, fontSize: 15 }}>
            Secure neighborhood mode is active
          </strong>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.55 }}>
            {geofenceBlockReason}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: geofenceContext?.accuracyMeters != null ? '1fr 1fr 1fr' : '1fr 1fr', gap: 8, marginTop: 10 }}>
            <div style={{
              border: '1px solid var(--border-light)',
              borderRadius: 12,
              padding: '8px 10px',
              background: 'var(--surface)',
            }}>
              <div style={{ color: 'var(--text-light)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Distance</div>
              <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>
                {geofenceContext?.distanceMeters != null ? `${Math.round(geofenceContext.distanceMeters)}m` : 'Unknown'}
              </div>
            </div>
            <div style={{
              border: '1px solid var(--border-light)',
              borderRadius: 12,
              padding: '8px 10px',
              background: 'var(--surface)',
            }}>
              <div style={{ color: 'var(--text-light)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Allowed Radius</div>
              <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>
                {Math.round(geofenceContext?.radiusMeters ?? 500)}m
              </div>
            </div>
            {geofenceContext?.accuracyMeters != null && (
              <div style={{
                border: '1px solid var(--border-light)',
                borderRadius: 12,
                padding: '8px 10px',
                background: 'var(--surface)',
              }}>
                <div style={{ color: 'var(--text-light)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>GPS Accuracy</div>
                <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 700 }}>
                  ±{Math.round(geofenceContext.accuracyMeters)}m
                </div>
              </div>
            )}
          </div>
          {geofenceContext?.societyName && (
            <p style={{ margin: '8px 0 0', color: 'var(--text-light)', fontSize: 12, lineHeight: 1.4 }}>
              Society: <strong style={{ color: 'var(--text-secondary)' }}>{geofenceContext.societyName}</strong>
            </p>
          )}
          <button
            className="scale-pressable"
            onClick={() => refreshGeofenceAndLoad(true)}
            style={{
              marginTop: 12,
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              padding: '9px 14px',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}
          >
            Re-check location
          </button>
          {geofenceContext?.distanceMeters != null && geofenceContext.distanceMeters <= 900 && (
            <button
              className="scale-pressable"
              onClick={handleCalibrateSociety}
              style={{
                marginTop: 10,
                marginLeft: 8,
                borderRadius: 999,
                border: '1px solid rgba(244,111,82,0.28)',
                background: 'var(--accent-solid)',
                padding: '9px 14px',
                fontSize: 13,
                fontWeight: 800,
                color: 'var(--accent-solid-text)',
              }}
            >
              Set phone location as center
            </button>
          )}
        </div>
      ) : loading && items.length === 0 ? (
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
    </div>
  );
};

export default HomeScreen;
