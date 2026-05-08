'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatRelativeTime } from '@/lib/dateUtils';
import { useStore } from '@/store/useStore';

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  item?: string;
  createdAt: string;
  time: string;
  color: string;
  avatar: string;
  kind: 'join' | 'item' | 'story';
}

interface ProfileRow {
  id: string;
  full_name?: string | null;
  created_at?: string | null;
  society_id?: string | null;
}

interface ItemRow {
  id: string;
  title?: string | null;
  description?: string | null;
  created_at?: string | null;
  owner_id?: string | null;
  society_id?: string | null;
}

const AVATAR_ICONS = {
  adultMan: '/avatar-icons/adult-man.png',
  adultWoman: '/avatar-icons/adult-woman.png',
  boy: '/avatar-icons/boy.png',
  girl: '/avatar-icons/girl.png',
  oldMan: '/avatar-icons/old-man.png',
  oldWoman: '/avatar-icons/old-woman.png',
};

const fallbackAvatars = Object.values(AVATAR_ICONS);

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
};

const getPersonaAvatar = (name = '', id = '') => {
  const normalized = name.toLowerCase();
  if (/\b(mrs|aunty|kapoor|dadi|nani)\b/.test(normalized)) return AVATAR_ICONS.oldWoman;
  if (/\b(mr|uncle|dada|nana)\b/.test(normalized)) return AVATAR_ICONS.oldMan;
  if (/\b(priya|ananya|neha|riya|woman|female)\b/.test(normalized)) return AVATAR_ICONS.adultWoman;
  if (/\b(girl|beti)\b/.test(normalized)) return AVATAR_ICONS.girl;
  if (/\b(boy|beta)\b/.test(normalized)) return AVATAR_ICONS.boy;
  if (/\b(arjun|dev|vinayak|karthik|rohan|man|male)\b/.test(normalized)) return AVATAR_ICONS.adultMan;
  return fallbackAvatars[hashString(id || name || 'loql') % fallbackAvatars.length];
};

const MAX_ACTIVITY_QUEUE = 14;

const mergeActivities = (next: ActivityItem[], previous: ActivityItem[] = []) => {
  const map = new Map<string, ActivityItem>();
  [...next, ...previous].forEach((activity) => {
    if (!map.has(activity.id)) map.set(activity.id, activity);
  });
  return [...map.values()]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, MAX_ACTIVITY_QUEUE);
};

const toJoinActivity = (profile: ProfileRow): ActivityItem => {
  const name = profile.full_name || 'A neighbor';
  const createdAt = profile.created_at || new Date().toISOString();
  return {
    id: `join-${profile.id}`,
    user: name,
    action: 'joined your society',
    createdAt,
    time: formatRelativeTime(createdAt),
    color: '#41B3A3',
    avatar: getPersonaAvatar(name, profile.id),
    kind: 'join',
  };
};

const toItemActivity = (item: ItemRow, owner?: ProfileRow | null): ActivityItem => {
  const name = owner?.full_name || 'A neighbor';
  const createdAt = item.created_at || new Date().toISOString();
  return {
    id: `item-${item.id}`,
    user: name,
    action: 'listed',
    item: item.title || 'a new item',
    createdAt,
    time: formatRelativeTime(createdAt),
    color: '#f17350',
    avatar: getPersonaAvatar(name, item.owner_id || item.id),
    kind: 'item',
  };
};

const toStoryActivity = (item: ItemRow, owner?: ProfileRow | null): ActivityItem | null => {
  if (!item.description?.trim()) return null;
  const name = owner?.full_name || 'A neighbor';
  const createdAt = item.created_at || new Date().toISOString();
  return {
    id: `story-${item.id}`,
    user: name,
    action: 'shared katha for',
    item: item.title || 'an item',
    createdAt,
    time: formatRelativeTime(createdAt),
    color: '#41B3A3',
    avatar: getPersonaAvatar(name, item.owner_id || item.id),
    kind: 'story',
  };
};

const itemActivities = (item: ItemRow, owner?: ProfileRow | null) => {
  const story = toStoryActivity(item, owner);
  return story ? [toItemActivity(item, owner), story] : [toItemActivity(item, owner)];
};

export const LiveActivityPulse = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [visibleStart, setVisibleStart] = useState(0);
  const [societyId, setSocietyId] = useState<string | null>(null);
  const user = useStore((state) => state.user);

  useEffect(() => {
    let cancelled = false;

    const resolveSociety = async () => {
      if (!user?.id) {
        setSocietyId(null);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('society_id')
        .eq('id', user.id)
        .single();

      if (!cancelled) setSocietyId(data?.society_id || null);
    };

    resolveSociety();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!societyId) {
      setActivities([]);
      return;
    }

    let cancelled = false;

    const loadInitialActivities = async () => {
      const [{ data: profileRows }, { data: itemRows }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, created_at, society_id')
          .eq('society_id', societyId)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('items')
          .select('id, title, description, created_at, owner_id, society_id')
          .eq('society_id', societyId)
          .order('created_at', { ascending: false })
          .limit(6),
      ]);

      if (cancelled) return;

      const profiles = (profileRows || []) as ProfileRow[];
      const items = (itemRows || []) as ItemRow[];
      const ownersById = new Map(profiles.map((profile) => [profile.id, profile]));

      const missingOwnerIds = Array.from(new Set(items
        .map((item) => item.owner_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
        .filter((id) => !ownersById.has(id))));

      if (missingOwnerIds.length > 0) {
        const { data: ownerRows } = await supabase
          .from('profiles')
          .select('id, full_name, created_at, society_id')
          .in('id', missingOwnerIds);

        (ownerRows || []).forEach((profile) => {
          ownersById.set(profile.id, profile as ProfileRow);
        });
      }

      if (!cancelled) {
        setActivities(mergeActivities([
          ...profiles.map(toJoinActivity),
          ...items.flatMap((item) => itemActivities(item, item.owner_id ? ownersById.get(item.owner_id) : null)),
        ]));
        setVisibleStart(0);
      }
    };

    loadInitialActivities();

    const channel = supabase
      .channel(`live_activity_${societyId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles', filter: `society_id=eq.${societyId}` },
        (payload) => {
          const profile = payload.new as ProfileRow;
          setActivities((prev) => mergeActivities([toJoinActivity(profile)], prev));
          setVisibleStart(0);
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'items', filter: `society_id=eq.${societyId}` },
        async (payload) => {
          const item = payload.new as ItemRow;
          let owner: ProfileRow | null = null;
          if (item.owner_id) {
            const { data } = await supabase
              .from('profiles')
              .select('id, full_name, created_at, society_id')
              .eq('id', item.owner_id)
              .single();
            owner = data as ProfileRow | null;
          }
          setActivities((prev) => mergeActivities(itemActivities(item, owner), prev));
          setVisibleStart(0);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [societyId]);

  useEffect(() => {
    if (activities.length === 0) return;

    const timeInterval = window.setInterval(() => {
      setActivities((prev) => prev.map((activity) => ({
        ...activity,
        time: formatRelativeTime(activity.createdAt),
      })));
    }, 30000);

    return () => window.clearInterval(timeInterval);
  }, [activities.length]);

  useEffect(() => {
    if (activities.length <= 1) return;

    const rotationInterval = window.setInterval(() => {
      setVisibleStart((current) => (current + 1) % activities.length);
    }, 2600);

    return () => window.clearInterval(rotationInterval);
  }, [activities.length]);

  const visibleActivities = activities.length === 0
    ? []
    : Array.from({ length: Math.min(3, activities.length) }, (_, index) => activities[(visibleStart + index) % activities.length]);

  return (
    <div className="live-pulse-container" style={{
      padding: '12px 0',
      overflow: 'hidden',
      height: '100px',
      position: 'relative'
    }}>
      <AnimatePresence initial={false}>
        {activities.length === 0 ? (
          <motion.div
            key="empty-live-activity"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: 'var(--surface)',
              borderRadius: 16,
              border: '1px solid var(--border-light)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 650,
            }}
          >
            <Sparkles size={15} color="var(--secondary)" />
            Live society updates will appear here.
          </motion.div>
        ) : visibleActivities.map((activity, i) => (
          <motion.div
            key={activity.id}
            layout
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1 - i * 0.3, y: i * 32, scale: 1 - i * 0.05 }}
            exit={{ opacity: 0, y: 18, scale: 0.96 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 16px',
              background: 'white',
              borderRadius: '16px',
              border: '1px solid var(--border-light)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
              zIndex: 10 - i,
            }}
          >
            <div style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: `${activity.color}14`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: `1px solid ${activity.color}35`,
              flexShrink: 0,
            }}>
              <img
                src={activity.avatar}
                alt=""
                width={30}
                height={30}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
              <span style={{ fontWeight: 750 }}>{activity.user}</span> {activity.action} {activity.item && <span style={{ color: 'var(--primary)', fontWeight: 750 }}>{activity.item}</span>}
            </div>
            <div style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {activity.time}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const LiveNeighborhoodMap = () => {
  return (
    <div style={{
      width: '100%',
      height: '300px',
      background: 'var(--surface-alt)',
      borderRadius: '24px',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid var(--border-light)',
      marginBottom: '24px',
    }}>
      <div className="mitti-noise-layer" />
      
      {/* Abstract Map Grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.1,
        backgroundImage: 'radial-gradient(var(--text-light) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }} />

      {/* Pulsing Dots */}
      {[
        { t: '20%', l: '30%', delay: 0 },
        { t: '50%', l: '60%', delay: 1.2 },
        { t: '70%', l: '20%', delay: 0.8 },
        { t: '40%', l: '80%', delay: 2.1 },
        { t: '15%', l: '70%', delay: 1.5 },
      ].map((dot, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 3, delay: dot.delay }}
          style={{
            position: 'absolute',
            top: dot.t,
            left: dot.l,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'var(--primary)',
            boxShadow: '0 0 20px var(--primary)',
          }}
        />
      ))}

      {/* Connection Lines (Abstract) */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.1 }}>
        <motion.path
          d="M 20% 70% Q 40% 40% 60% 50%"
          fill="none"
          stroke="var(--secondary)"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        />
      </svg>

      <div style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)',
        padding: '8px 16px',
        borderRadius: '99px',
        fontSize: '11px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        border: '1px solid var(--border-light)',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
        LIVE IN DWARKA SECTOR 6
      </div>
    </div>
  );
};
