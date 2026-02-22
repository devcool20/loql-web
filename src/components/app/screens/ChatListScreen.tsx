'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { formatRelativeTime } from '@/lib/dateUtils';

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
        <div className="spinner" style={{ borderTopColor: '#111827', borderColor: '#E5E7EB' }} />
      </div>
    );
  }

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100%', paddingTop: 20, paddingBottom: 100 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', padding: '0 24px', marginBottom: 20, letterSpacing: -0.5 }}>
        Messages
      </h1>

      {/* Search Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', background: '#FFFFFF', margin: '0 20px', padding: '12px 16px',
        borderRadius: 20, marginBottom: 24, border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}>
        <Search size={20} color="#9CA3AF" />
        <input
          style={{ marginLeft: 10, flex: 1, fontSize: 15, color: '#111827', fontWeight: 500, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit' }}
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Chat List */}
      <div style={{ padding: '0 20px' }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 60, fontSize: 15, fontWeight: 500 }}>No messages yet.</p>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="scale-pressable"
              onClick={() => openChat({ id: item.id, full_name: item.name, avatar_url: item.avatar })}
              style={{
                display: 'flex', alignItems: 'center', background: 'white', padding: 16, borderRadius: 20,
                marginBottom: 12, border: '1px solid #F3F4F6', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', cursor: 'pointer',
              }}>
              {/* Avatar */}
              {item.avatar ? (
                <img src={item.avatar} alt="" style={{ width: 56, height: 56, borderRadius: 28, background: '#F3F4F6', objectFit: 'cover' }} />
              ) : (
                <div style={{
                  width: 56, height: 56, borderRadius: 28, background: '#111827',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 20, fontWeight: 700, flexShrink: 0,
                }}>{item.name.charAt(0)}</div>
              )}
              {/* Content */}
              <div style={{ flex: 1, marginLeft: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: -0.2 }}>{item.name}</span>
                  <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 500 }}>{formatRelativeTime(item.time)}</span>
                </div>
                <p style={{
                  fontSize: 14, color: item.unreadCount > 0 ? '#111827' : '#6B7280',
                  fontWeight: item.unreadCount > 0 ? 600 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{item.lastMessage}</p>
              </div>
              {/* Badge */}
              {item.unreadCount > 0 && (
                <div style={{
                  background: '#111827', minWidth: 22, height: 22, borderRadius: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 12, padding: '0 6px',
                }}>
                  <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>{item.unreadCount}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatListScreen;
