'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { cacheInvalidate, CACHE_KEYS } from '@/lib/cache';

export default function RealtimeSyncProvider() {
  const user = useStore((state) => state.user);
  const geofenceStatus = useStore((state) => state.geofenceStatus);
  const upsertHomeItem = useStore((state) => state.upsertHomeItem);
  const removeHomeItem = useStore((state) => state.removeHomeItem);
  const refreshScreen = useStore((state) => state.refreshScreen);
  const markScreenStale = useStore((state) => state.markScreenStale);
  const societyIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolveSociety = async () => {
      if (!user?.id) {
        societyIdRef.current = null;
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('society_id')
        .eq('id', user.id)
        .single();

      if (!cancelled) {
        societyIdRef.current = data?.society_id || null;
      }
    };

    resolveSociety();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const invalidateRentals = () => {
      markScreenStale('rentals');
      refreshScreen('rentals');
      cacheInvalidate(CACHE_KEYS.listings(user.id));
      cacheInvalidate(CACHE_KEYS.bookings(user.id));
      cacheInvalidate(CACHE_KEYS.offers(user.id));
    };

    const channel = supabase
      .channel(`app_sync_${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, (payload: any) => {
        const item = payload.new || payload.old;
        const societyMatches = !societyIdRef.current || item?.society_id === societyIdRef.current;
        if (!societyMatches) return;

        markScreenStale('home');
        cacheInvalidate(CACHE_KEYS.homeItems(item.society_id));

        if (item?.owner_id === user.id) {
          invalidateRentals();
        }

        if (geofenceStatus !== 'inside') return;
        if (payload.eventType === 'DELETE' || payload.new?.status !== 'available') {
          removeHomeItem(item.id);
          return;
        }
        upsertHomeItem(payload.new);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, (payload: any) => {
        const row = payload.new || payload.old;
        if (row?.sender_id === user.id || row?.receiver_id === user.id || row?.owner_id === user.id) {
          invalidateRentals();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rentals' }, (payload: any) => {
        const row = payload.new || payload.old;
        if (row?.renter_id === user.id || row?.owner_id === user.id) {
          invalidateRentals();
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload: any) => {
        const row = payload.new || payload.old;
        if (row?.user_id === user.id) {
          markScreenStale('notifications');
          refreshScreen('notifications');
          cacheInvalidate(CACHE_KEYS.notifications(user.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, geofenceStatus, upsertHomeItem, removeHomeItem, refreshScreen, markScreenStale]);

  return null;
}
