'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Users, ShieldCheck, Heart } from 'lucide-react';

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  item?: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

const LIVE_EVENTS = [
  { user: 'Arjun', action: 'just listed a', item: 'Sony Alpha kit', icon: <Zap size={14} />, color: '#f17350' },
  { user: 'Mrs. Kapoor', action: 'verified a new neighbor', icon: <ShieldCheck size={14} />, color: '#41B3A3' },
  { user: 'Priya', action: 'is lending a', item: 'Prestige Cooker', icon: <Heart size={14} />, color: '#F64C72' },
  { user: 'Karthik', action: 'shared a story about', item: 'UPSC Notes', icon: <Activity size={14} />, color: '#f17350' },
  { user: 'Ananya', action: 'just joined the neighborhood', icon: <Users size={14} />, color: '#41B3A3' },
];

export const LiveActivityPulse = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const event = LIVE_EVENTS[index % LIVE_EVENTS.length];
      const newActivity: ActivityItem = {
        id: Math.random().toString(36).substr(2, 9),
        ...event,
        time: 'Just now',
      };

      setActivities((prev) => [newActivity, ...prev].slice(0, 3));
      setIndex((prev) => prev + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, [index]);

  return (
    <div className="live-pulse-container" style={{
      padding: '12px 0',
      overflow: 'hidden',
      height: '100px',
      position: 'relative'
    }}>
      <AnimatePresence initial={false}>
        {activities.map((activity, i) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1 - i * 0.3, y: i * 32, scale: 1 - i * 0.05 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: `${activity.color}15`,
              color: activity.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {activity.icon}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
              <span style={{ fontWeight: 700 }}>{activity.user}</span> {activity.action} {activity.item && <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{activity.item}</span>}
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
