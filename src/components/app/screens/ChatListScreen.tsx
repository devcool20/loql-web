'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { formatRelativeTime } from '@/lib/dateUtils';
import { getSafeImageUrl } from '@/lib/imageUtils';
import AppTopBar from '@/components/app/AppTopBar';

const ChatListScreen = () => {
  const { user, openChat } = useStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchConversations();

    const channel = supabase
      .channel('chat_list_updates')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'messages',
      }, (payload: any) => {
        const newItem = payload.new;
        const oldItem = payload.old;
        const involved = (newItem && (newItem.sender_id === user?.id || newItem.receiver_id === user?.id)) ||
          (oldItem && (oldItem.sender_id === user?.id || oldItem.receiver_id === user?.id));
        if (involved) fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!messages) { setLoading(false); return; }

      const partnersMap = new Map<string, any>();
      messages.forEach(msg => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!partnersMap.has(partnerId)) {
          partnersMap.set(partnerId, {
            partnerId, lastMessage: msg.content, time: msg.created_at, unreadCount: 0,
          });
        }
        if (msg.receiver_id === user.id && !msg.is_read) {
          partnersMap.get(partnerId).unreadCount += 1;
        }
      });

      const partnerIds = Array.from(partnersMap.keys());
      if (partnerIds.length === 0) {
        setConversations([]); setLoading(false); return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', partnerIds);

      const formatted = partnerIds.map(pid => {
        const details = partnersMap.get(pid);
        const profile = profiles?.find(p => p.id === pid);
        return {
          id: pid, name: profile?.full_name || 'Unknown User',
          avatar: profile?.avatar_url, ...details,
        };
      });
      setConversations(formatted);
    } catch (error) {
      console.log('Error fetching chat list:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = conversations.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}>
        <div className="spinner" style={{ borderTopColor: 'var(--text-primary)', borderColor: 'var(--border)' }} />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--background)', minHeight: '100%', paddingBottom: 100 }}>
      <AppTopBar />
      <div style={{ padding: '16px 20px 0' }}>
      <h1 className="font-serif" style={{ fontSize: 34, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, letterSpacing: -0.5 }}>
        Neighborhood Conversations
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>Connect with those around you.</p>

      {/* Search Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', background: 'var(--surface)', margin: '0 20px', padding: '12px 16px',
        borderRadius: 999, marginBottom: 14, border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', marginLeft: 0, marginRight: 0,
      }}>
        <Search size={20} color="var(--text-light)" />
        <input
          style={{ marginLeft: 10, flex: 1, fontSize: 15, color: 'var(--text-primary)', fontWeight: 500, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit' }}
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14 }}>
        {['All', 'Unread', 'Requests'].map((chip, idx) => (
          <span
            key={chip}
            style={{
              borderRadius: 999,
              padding: '7px 14px',
              whiteSpace: 'nowrap',
              fontSize: 12,
              fontWeight: 700,
              color: idx === 0 ? 'white' : 'var(--text-secondary)',
              background: idx === 0 ? 'var(--primary)' : 'var(--surface)',
              border: idx === 0 ? 'none' : '1px solid var(--border-light)',
            }}
          >
            {chip}
          </span>
        ))}
      </div>

      {/* Chat List */}
      <div style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', marginTop: 60, fontSize: 15, fontWeight: 500 }}>No messages yet.</p>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="scale-pressable"
              onClick={() => openChat({ id: item.id, full_name: item.name, avatar_url: item.avatar })}
              style={{
                display: 'flex', alignItems: 'center', background: 'var(--surface-container-lowest)', padding: 16, borderRadius: 24,
                marginBottom: 12, border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
              }}>
              {/* Avatar */}
              {item.avatar ? (
                <img src={getSafeImageUrl(item.avatar)} alt="" style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--muted)', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: 56, height: 56, borderRadius: 28, background: 'var(--accent-solid)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--accent-solid-text)', fontSize: 20, fontWeight: 600, flexShrink: 0,
                }}>{item.name.charAt(0)}</div>
              )}
              {/* Content */}
              <div style={{ flex: 1, marginLeft: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: -0.2 }}>{item.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-light)', fontWeight: 500 }}>{formatRelativeTime(item.time)}</span>
                </div>
                <p style={{
                  fontSize: 14, color: item.unreadCount > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: item.unreadCount > 0 ? 500 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{item.lastMessage}</p>
              </div>
              {/* Badge */}
              {item.unreadCount > 0 && (
                <div style={{
                  background: 'var(--accent-solid)', minWidth: 22, height: 22, borderRadius: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 12, padding: '0 6px',
                }}>
                  <span style={{ color: 'var(--accent-solid-text)', fontSize: 11, fontWeight: 600 }}>{item.unreadCount}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  );
};

export default ChatListScreen;
