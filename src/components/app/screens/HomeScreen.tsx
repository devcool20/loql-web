'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Bell, LocateFixed, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import AppSheet from '@/components/app/AppSheet';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import TypewriterText from '@/components/app/TypewriterText';
import AppItemCard from '@/components/app/AppItemCard';
import { ChipsSkeleton, HeroSkeleton, HomeSkeletonGrid, SearchSkeleton } from '@/components/app/Skeleton';
import AppTopBar from '@/components/app/AppTopBar';
import { LiveActivityPulse } from '@/components/app/LiveActivity';
import { iosEase, iosSpring } from '@/components/motion/motionPrimitives';
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
  const shouldReduceMotion = useReducedMotion();
  const [items, setItems] = useState<HomeItem[]>(() => useStore.getState().homeItems || []);
  const [loading, setLoading] = useState(() => !useStore.getState().homeIsHydrated);
  const [locationName, setLocationName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userSocietyId, setUserSocietyId] = useState<string | null>(null);
  const [geofenceBlockReason, setGeofenceBlockReason] = useState<string | null>(null);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
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
    showAlert,
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

  useEffect(() => {
    if (geofenceBlockReason) setShowGeofenceModal(true);
  }, [geofenceBlockReason]);

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
      setShowGeofenceModal(false);
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

  const handleLocationClick = () => {
    if (!userSocietyId || locationName === 'No Society') return;
    setShowGeofenceModal(true);
    if (!geofenceContext) refreshGeofenceAndLoad(true);
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
      setShowGeofenceModal(false);
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

  const fadeUp = (delay = 0, distance = 14) => shouldReduceMotion ? {
    initial: false as const,
  } : {
    initial: { opacity: 0, y: distance },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.46, delay, ease: iosEase },
  };

  const formatMeters = (value?: number | null) => {
    if (value == null) return 'Unknown';
    if (value >= 1000) return `${(value / 1000).toFixed(1)}km`;
    return `${Math.round(value)}m`;
  };

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
              <motion.button
                type="button"
                className="society-header-pill home-action-button"
                onClick={handleLocationClick}
                whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.01 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                transition={iosSpring}
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
              </motion.button>
            ) : null}
            <motion.button
              type="button"
              className="header-button home-action-button"
              onClick={() => setCurrentStack('Notification')}
              id="notification-bell"
              aria-label="Notifications"
              whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.02 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
              transition={iosSpring}
            >
              <Bell size={20} color="var(--text-primary)" />
            </motion.button>

          </div>
        )}
      />
      <div className="home-page-content">
      {/* Task-led discovery header */}
      <motion.header className="home-header home-discovery-intro" {...fadeUp(0.04, 10)}>
        <div className="home-header-left">
          <div className="home-greeting">
            <TypewriterText texts={getGreetings()} typingSpeed={100} pauseDuration={2500} />, {userName}
          </div>
          <h1 className="home-name font-serif">What do you need nearby?</h1>
          <p className="home-intro-copy">Borrow useful things from neighbours you can trust.</p>
        </div>
      </motion.header>

      <motion.div {...fadeUp(0.08, 12)}>
        <LiveActivityPulse />
      </motion.div>

      {/* Search Bar */}
      <motion.div className="search-bar home-search-shell" {...fadeUp(0.12, 12)}>
        <Search size={18} color="var(--text-light)" />
        <input
          className="search-input"
          placeholder="Search tools, tech, party gear…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="button" className="home-filter-button" aria-label="Filter listings"><SlidersHorizontal size={16}/></button>
      </motion.div>

      <motion.div
        className="home-hero-card home-hero-premium"
        {...fadeUp(0.16, 16)}
        whileHover={shouldReduceMotion ? undefined : { y: -4, scale: 1.01 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.992 }}
        transition={iosSpring}
        style={{
          borderRadius: 24,
          padding: 18,
          marginBottom: 18,
          background: 'linear-gradient(140deg, rgba(65,179,163,0.16), rgba(65,179,163,0.38))',
          border: '1px solid rgba(65,179,163,0.24)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span className="home-hero-kicker">Weekend ready</span>
        <h3 className="home-hero-title font-serif">Borrow the plan,<br />not the clutter.</h3>
        <p className="home-hero-copy">Popular picks for society get-togethers.</p>
        <button type="button" className="home-hero-link" onClick={() => setSelectedCategory('All')}>Explore the edit <span aria-hidden="true">→</span></button>
      </motion.div>

      {/* Categories */}
      <motion.div className="categories-container" {...fadeUp(0.2, 10)}>
        {categories.map((cat) => (
          <motion.button
            key={cat}
            type="button"
            className={`category-chip home-chip-button ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
            whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.02 }}
            whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
            transition={iosSpring}
          >
            {cat}
          </motion.button>
        ))}
      </motion.div>

      {/* Feed */}
      {geofenceBlockReason ? (
        <div className="empty-state geofence-feed-placeholder">
          <span className="empty-text">Location access is needed before society items can be shown.</span>
          <button type="button" className="scale-pressable app-small-action geofence-inline-trigger" onClick={() => setShowGeofenceModal(true)}>
            Open location check
          </button>
        </div>
      ) : loading && items.length === 0 ? (
        <div className="home-loading-state"><SearchSkeleton /><HeroSkeleton /><ChipsSkeleton /><HomeSkeletonGrid count={4} /></div>
      ) : (
        <section className="home-feed-section">
          <div className="v2-section-heading">
            <div><span className="v2-eyebrow">Discover</span><h2 className="font-serif">Near you</h2></div>
            <span>{filteredItems.length} available</span>
          </div>
        <div className="item-feed">
          <AnimatePresence initial={false} mode="popLayout">
            {filteredItems.map((item, index) => (
              <AppItemCard
                key={item.id}
                item={item}
                index={index}
                onPress={navigateToDetail}
              />
            ))}
          </AnimatePresence>

          {filteredItems.length === 0 && (
            <div className="empty-state home-empty-state"><div className="empty-art"><div className="empty-shelf"><i/><i/><i/></div></div><span className="v2-eyebrow">Quiet for now</span><h2 className="font-serif">Be the first to fill the shelf.</h2><p>{searchQuery ? 'No nearby items match those filters.' : 'Share something useful and help your neighbourhood borrow better.'}</p><div className="empty-actions"><button className="app-primary-action" onClick={() => setCurrentStack('AddItem')}>List an item</button><button className="app-small-action" onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>Clear filters</button></div></div>
          )}
        </div>
        </section>
      )}
      </div>

      <AppSheet open={showGeofenceModal && Boolean(geofenceContext || geofenceBlockReason)} onClose={() => setShowGeofenceModal(false)} labelledBy="geo-sheet-title" className="geo-sheet">
        <div className="sheet-head"><span className="v2-eyebrow">Neighbourhood verification</span><button type="button" className="app-icon-button" onClick={() => setShowGeofenceModal(false)} aria-label="Close location check"><X size={18} /></button></div>
        <div className="geo-rings"><i /><i /><span><LocateFixed size={22} /></span></div>
        <h2 id="geo-sheet-title" className="font-serif">{geofenceContext?.permission === 'denied' ? 'Unlock your neighbourhood.' : 'Verify society location.'}</h2>
        <p>Loql works only inside your registered society. Check your location to discover, list, and borrow safely.</p>
        <div className="geo-facts"><div><span>Distance</span><strong>{formatMeters(geofenceContext?.distanceMeters)}</strong></div><div><span>Allowed radius</span><strong>{formatMeters(geofenceContext?.radiusMeters ?? 500)}</strong></div></div>
        <div className="geo-safe-note"><ShieldCheck size={16}/><span>{geofenceContext?.societyName || locationName || 'Your registered society'}</span></div>
        <div className="geo-actions"><button type="button" className="app-primary-action" onClick={() => refreshGeofenceAndLoad(true)}>Check location again</button>{geofenceContext?.distanceMeters != null && geofenceContext.distanceMeters <= 900 && <button type="button" className="app-small-action" onClick={handleCalibrateSociety}>Set as centre</button>}<button type="button" className="geo-why" onClick={() => showAlert('Why location is required', GEOFENCE_MESSAGES.outsideFence, 'info')}>Why location is required</button></div>
      </AppSheet>
    </div>
  );
};

export default HomeScreen;
