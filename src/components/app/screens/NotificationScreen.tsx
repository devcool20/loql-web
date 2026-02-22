'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { markAsRead, createNotification } from '@/lib/notificationManager';
import { formatRelativeTime } from '@/lib/dateUtils';
import { cacheGetStale, cacheSet, cacheInvalidate, CACHE_KEYS, TTL } from '@/lib/cache';

const NotificationScreen = () => {
  const { user, closeStack, showAlert, openChat } = useStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async (forceRefresh = false) => {
    const cacheKey = CACHE_KEYS.notifications(user.id);
    if (!forceRefresh) {
      const { data: stale } = await cacheGetStale<any[]>(cacheKey);
      if (stale && stale.length > 0) {
        setNotifications(stale);
        setLoading(false);
        fetchFresh(cacheKey);
        return;
      }
    }
    setLoading(true);
    await fetchFresh(cacheKey);
  };

  const fetchFresh = async (cacheKey: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      let enriched = data || [];
      const userIds = [...new Set(enriched.filter(n => n.related_user_id).map(n => n.related_user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds);
        enriched = enriched.map(n => ({
          ...n, relatedUser: profiles?.find((p: any) => p.id === n.related_user_id),
        }));
      }

      setNotifications(enriched);
      cacheSet(cacheKey, enriched, TTL.SHORT);

      // Mark as read
      const unreadIds = enriched.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length > 0) markAsRead(unreadIds);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    showAlert('Delete', `Delete ${selectedIds.size} notification(s)?`, 'info', undefined, false, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('notifications').delete().in('id', Array.from(selectedIds));
            setNotifications(prev => prev.filter(n => !selectedIds.has(n.id)));
            setSelectedIds(new Set());
            setSelectionMode(false);
            cacheInvalidate(CACHE_KEYS.notifications(user.id));
          } catch (e: any) {
            showAlert('Error', e.message, 'error');
          }
        },
      },
    ]);
  };

  const getTypeColor = (type: string) => {
    if (type.includes('accept')) return '#10B981';
    if (type.includes('decline')) return '#EF4444';
    if (type.includes('offer') || type.includes('counter')) return '#111827';
    if (type.includes('expir')) return '#F59E0B';
    return '#6B7280';
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#FAFAFA', zIndex: 200, overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: '#FAFAFA',
      }}>
        <button className="scale-pressable" onClick={closeStack}
          style={{ padding: 8, borderRadius: 20, background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <ChevronLeft size={24} color="#111827" />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Notifications</span>
        <button className="scale-pressable" onClick={() => {
          if (selectionMode && selectedIds.size > 0) handleDeleteSelected();
          else setSelectionMode(!selectionMode);
        }} style={{ padding: 8, borderRadius: 20, background: selectionMode ? '#FEE2E2' : 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <Trash2 size={18} color={selectionMode ? '#EF4444' : '#111827'} />
        </button>
      </div>

      <div style={{ padding: '0 20px', paddingBottom: 100 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}>
            <div className="spinner" style={{ borderTopColor: '#111827', borderColor: '#E5E7EB' }} />
          </div>
        ) : notifications.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 60, fontSize: 15, fontWeight: 500 }}>No notifications yet.</p>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className="scale-pressable"
              onClick={() => {
                if (selectionMode) {
                  const newSet = new Set(selectedIds);
                  if (newSet.has(notif.id)) newSet.delete(notif.id);
                  else newSet.add(notif.id);
                  setSelectedIds(newSet);
                }
              }}
              style={{
                display: 'flex', background: 'white', padding: 16, borderRadius: 20,
                marginBottom: 12, border: `1.5px solid ${selectedIds.has(notif.id) ? '#111827' : notif.is_read ? '#F3F4F6' : '#E5E7EB'}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer', gap: 14,
              }}>
              {/* Left dot */}
              <div style={{ width: 8, height: 8, borderRadius: 4, background: getTypeColor(notif.type), marginTop: 6, flexShrink: 0 }} />
              {/* Content */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{notif.title}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{formatRelativeTime(notif.created_at)}</span>
                </div>
                <p style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>
                  {notif.message?.startsWith('undefined ') ? notif.message.replace('undefined ', 'Someone ') : notif.message}
                </p>
                {notif.relatedUser && (
                  <button className="scale-pressable" onClick={(e) => {
                    e.stopPropagation();
                    openChat({ id: notif.relatedUser.id, full_name: notif.relatedUser.full_name || 'Someone', avatar_url: notif.relatedUser.avatar_url });
                  }}
                    style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 12, background: '#F3F4F6' }}>
                    {notif.relatedUser.avatar_url ? (
                      <img src={notif.relatedUser.avatar_url} alt="" style={{ width: 20, height: 20, borderRadius: 10, background: '#E5E7EB', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 20, height: 20, borderRadius: 10, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 8, fontWeight: 700 }}>{(notif.relatedUser.full_name || '?')[0]}</div>
                    )}
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>
                      {(!notif.relatedUser.full_name || notif.relatedUser.full_name === 'undefined') ? 'Someone' : notif.relatedUser.full_name}
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationScreen;
