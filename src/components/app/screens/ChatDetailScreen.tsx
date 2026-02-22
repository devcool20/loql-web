'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';

interface ChatDetailScreenProps {
  targetUser: { id: string; full_name: string; avatar_url?: string };
}

const ChatDetailScreen = ({ targetUser }: ChatDetailScreenProps) => {
  const { user, closeStack, showAlert } = useStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    markMessagesRead();

    const channel = supabase
      .channel('chat_detail_' + targetUser.id)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
      }, (payload: any) => {
        const msg = payload.new;
        if (
          (msg.sender_id === user?.id && msg.receiver_id === targetUser.id) ||
          (msg.sender_id === targetUser.id && msg.receiver_id === user?.id)
        ) {
          setMessages(prev => [...prev, msg]);
          if (msg.sender_id === targetUser.id) markMessagesRead();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user?.id},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${user?.id})`
        )
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (e) {
      console.error('Error fetching messages:', e);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesRead = async () => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', targetUser.id)
      .eq('receiver_id', user?.id)
      .eq('is_read', false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user?.id,
        receiver_id: targetUser.id,
        content: newMessage.trim(),
      });
      if (error) throw error;
      setNewMessage('');
    } catch (e: any) {
      showAlert('Error', e.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteChat = () => {
    showAlert('Delete Chat', 'Are you sure you want to delete this entire conversation?', 'info', undefined, false, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('messages').delete()
              .or(`and(sender_id.eq.${user?.id},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${user?.id})`);
            closeStack();
          } catch (e: any) {
            showAlert('Error', e.message, 'error');
          }
        },
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#FAFAFA', zIndex: 200, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '14px 16px',
        background: 'white', borderBottom: '1px solid #F3F4F6', gap: 12,
      }}>
        <button className="scale-pressable" onClick={closeStack}
          style={{ padding: 8, borderRadius: 20, background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <ChevronLeft size={24} color="#111827" />
        </button>
        {targetUser.avatar_url ? (
          <img src={targetUser.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: 20, objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 40, height: 40, borderRadius: 20, background: '#111827',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 16, fontWeight: 700,
          }}>{targetUser.full_name.charAt(0)}</div>
        )}
        <span style={{ flex: 1, fontSize: 17, fontWeight: 700, color: '#111827' }}>{targetUser.full_name}</span>
        <button className="scale-pressable" onClick={handleDeleteChat}
          style={{ padding: 8, borderRadius: 20, background: '#FEE2E2' }}>
          <Trash2 size={18} color="#EF4444" />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}>
            <div className="spinner" style={{ borderTopColor: '#111827', borderColor: '#E5E7EB' }} />
          </div>
        ) : messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9CA3AF', marginTop: 60, fontSize: 14 }}>No messages yet. Say hi!</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} style={{
                display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 8,
              }}>
                <div style={{
                  maxWidth: '75%', padding: '10px 16px', borderRadius: 20,
                  background: isMine ? '#111827' : '#FFFFFF',
                  color: isMine ? 'white' : '#111827',
                  fontSize: 15, lineHeight: 1.5, fontWeight: 400,
                  ...(isMine ? { borderBottomRightRadius: 6 } : { borderBottomLeftRadius: 6 }),
                  boxShadow: isMine ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  {msg.content}
                  <div style={{
                    fontSize: 10, marginTop: 4,
                    color: isMine ? 'rgba(255,255,255,0.5)' : '#9CA3AF',
                    textAlign: 'right',
                  }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '12px 16px', gap: 12,
        background: 'white', borderTop: '1px solid #F3F4F6',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
      }}>
        <input
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 24, border: '1px solid #E5E7EB',
            background: '#F9FAFB', fontSize: 15, color: '#111827', fontFamily: 'inherit', outline: 'none',
          }}
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="scale-pressable"
          onClick={sendMessage}
          disabled={!newMessage.trim() || sending}
          style={{
            width: 44, height: 44, borderRadius: 22, background: '#111827',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: !newMessage.trim() ? 0.4 : 1,
          }}>
          <Send size={20} color="white" />
        </button>
      </div>
    </div>
  );
};

export default ChatDetailScreen;
