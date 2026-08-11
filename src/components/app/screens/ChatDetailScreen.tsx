'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Ban, Check, ChevronLeft, CreditCard, Send, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { getSafeImageUrl } from '@/lib/imageUtils';
import SmartImage from '@/components/app/SmartImage';
import TrustRow from '@/components/app/TrustRow';
import StatusTag from '@/components/app/StatusTag';
import AppSheet from '@/components/app/AppSheet';
import { CACHE_KEYS, cacheInvalidate } from '@/lib/cache';
import { createNotification } from '@/lib/notificationManager';
import { assertGeofenceAllowed } from '@/lib/geofence';
import { markChatOfferWithdrawn, parseChatOfferContent, type ChatOfferPayload } from '@/lib/chatOfferMessage';

interface ChatDetailScreenProps {
  targetUser: { id: string; full_name: string; avatar_url?: string };
}

const ChatDetailScreen = ({ targetUser }: ChatDetailScreenProps) => {
  const {
    user,
    closeStack,
    showAlert,
    setCurrentTab,
    setRentalsMode,
    setPermission,
    setCoords,
    refreshGeofence,
    refreshScreen,
    upsertRentalOffer,
    removeRentalOffer,
  } = useStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [offersById, setOffersById] = useState<Record<string, any>>({});
  const [selectedOfferMessage, setSelectedOfferMessage] = useState<{ message: any; payload: ChatOfferPayload; isMine: boolean } | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [actioningOfferId, setActioningOfferId] = useState<string | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    markMessagesRead();

    const channel = supabase
      .channel('chat_detail_' + targetUser.id)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'messages',
      }, (payload: any) => {
        const msg = payload.new || payload.old;
        if (
          (msg.sender_id === user?.id && msg.receiver_id === targetUser.id) ||
          (msg.sender_id === targetUser.id && msg.receiver_id === user?.id)
        ) {
          if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter((row) => row.id !== msg.id));
            return;
          }
          if (payload.eventType === 'INSERT') {
            setMessages(prev => prev.some((row) => row.id === msg.id) ? prev : [...prev, msg]);
            hydrateOfferRows([msg]);
            if (msg.sender_id === targetUser.id) markMessagesRead();
          }
        }
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'offers',
      }, (payload: any) => {
        const offer = payload.new || payload.old;
        const involved = (
          (offer.sender_id === user?.id && offer.receiver_id === targetUser.id) ||
          (offer.sender_id === targetUser.id && offer.receiver_id === user?.id)
        );
        if (involved) {
          if (payload.eventType === 'DELETE') {
            setOffersById((current) => {
              const next = { ...current };
              delete next[offer.id];
              return next;
            });
            removeRentalOffer(offer.id);
            return;
          }
          setOffersById((current) => ({
            ...current,
            [offer.id]: { ...(current[offer.id] || {}), ...offer },
          }));
          upsertRentalOffer(offer);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    scrollToBottom('auto');
  }, [messages]);

  const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
    window.requestAnimationFrame(() => {
      const container = messagesScrollRef.current;
      if (container) container.scrollTo({ top: container.scrollHeight, behavior });
    });
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user?.id},receiver_id.eq.${targetUser.id}),and(sender_id.eq.${targetUser.id},receiver_id.eq.${user?.id})`
        )
        .order('created_at', { ascending: false })
        .limit(80);

      if (error) throw error;
      const nextMessages = [...(data || [])].reverse();
      setMessages(nextMessages);
      setLoading(false);
      hydrateOfferRows(nextMessages);
      window.setTimeout(() => scrollToBottom('auto'), 50);
    } catch (e) {
      console.error('Error fetching messages:', e);
      setLoading(false);
    } finally {
    }
  };

  const hydrateOfferRows = async (rows: any[]) => {
    const offerIds = Array.from(new Set(rows
      .map((row) => parseChatOfferContent(row.content)?.offerId)
      .filter(Boolean))) as string[];
    if (offerIds.length === 0) return;

    const { data, error } = await supabase
      .from('offers')
      .select('*, items(id, title, images, daily_rate, market_price, owner_id, status)')
      .in('id', offerIds);
    if (error) {
      console.error('Error hydrating chat offers:', error);
      return;
    }
    setOffersById((current) => ({
      ...current,
      ...(data || []).reduce((acc: Record<string, any>, offer: any) => {
        acc[offer.id] = offer;
        return acc;
      }, {}),
    }));
  };

  const invalidateOfferSurfaces = async () => {
    if (!user?.id) return;
    await Promise.all([
      cacheInvalidate(CACHE_KEYS.offers(user.id)),
      cacheInvalidate(CACHE_KEYS.listings(user.id)),
      cacheInvalidate(CACHE_KEYS.bookings(user.id)),
    ]);
    refreshScreen('rentals');
    refreshScreen('chat');
    refreshScreen('notifications');
  };

  const fetchOfferById = async (offerId: string) => {
    const { data, error } = await supabase
      .from('offers')
      .select('*, items(id, title, images, daily_rate, market_price, owner_id, status)')
      .eq('id', offerId)
      .maybeSingle();
    if (error) throw error;
    return data;
  };

  const handleOfferDecision = async (payload: ChatOfferPayload, nextStatus: 'accepted' | 'declined') => {
    if (!user?.id || actioningOfferId) return;
    setActioningOfferId(payload.offerId);
    try {
      const { permission, coords, access } = await assertGeofenceAllowed(user.id);
      setPermission(permission);
      setCoords(coords);
      refreshGeofence({
        geofenceStatus: 'inside',
        distanceMeters: access.distance_meters,
        radiusMeters: access.radius_meters,
        geofenceSocietyName: access.society_name,
        locationPermission: permission,
      });

      const { error } = await supabase.from('offers').update({ status: nextStatus }).eq('id', payload.offerId);
      if (error) throw error;
      const updatedOffer = await fetchOfferById(payload.offerId);

      await createNotification({
        user_id: targetUser.id,
        title: nextStatus === 'accepted' ? 'Offer Accepted' : 'Offer Declined',
        message: nextStatus === 'accepted'
          ? `Your offer for ${payload.itemTitle} was accepted. Pay from Kiraye Par to start the rental.`
          : `Your offer for ${payload.itemTitle} was declined.`,
        type: nextStatus === 'accepted' ? 'offer_accepted' : 'offer_declined',
        related_user_id: user.id,
        related_rental_id: payload.offerId,
      });

      setOffersById((current) => ({
        ...current,
        [payload.offerId]: { ...(current[payload.offerId] || {}), ...(updatedOffer || {}), status: nextStatus },
      }));
      if (updatedOffer) upsertRentalOffer(updatedOffer);
      await invalidateOfferSurfaces();
      setSelectedOfferMessage(null);
      showAlert(nextStatus === 'accepted' ? 'Offer Accepted' : 'Offer Declined', 'Samvaad and Kiraya are updated.', 'success');
    } catch (error: any) {
      showAlert('Error', error.message, 'error');
    } finally {
      setActioningOfferId(null);
    }
  };

  const handleDeleteOfferMessage = async (message: any, payload: ChatOfferPayload) => {
    const offerStatus = offersById[payload.offerId]?.status || 'pending';
    if (actioningOfferId) return;
    setActioningOfferId(payload.offerId);
    try {
      if (offerStatus === 'pending') {
        const withdrawnContent = markChatOfferWithdrawn(message.content);
        const { error: messageUpdateError } = await supabase
          .from('messages')
          .update({ content: withdrawnContent })
          .eq('id', message.id)
          .eq('sender_id', user?.id);
        if (messageUpdateError) throw messageUpdateError;

        const { error: offerUpdateError } = await supabase
          .from('offers')
          .update({ status: 'declined' })
          .eq('id', payload.offerId)
          .eq('sender_id', user?.id);
        if (offerUpdateError) throw offerUpdateError;

        await createNotification({
          user_id: targetUser.id,
          title: 'Offer Withdrawn',
          message: `Offer for ${payload.itemTitle} was withdrawn.`,
          type: 'offer_withdrawn',
          related_user_id: user?.id,
          related_rental_id: payload.offerId,
        });
      }

      const nextContent = offerStatus === 'pending' ? markChatOfferWithdrawn(message.content) : message.content;
      setMessages((current) => current.map((row) => row.id === message.id ? { ...row, content: nextContent } : row));
      setOffersById((current) => ({
        ...current,
        [payload.offerId]: { ...(current[payload.offerId] || {}), status: 'declined' },
      }));
      removeRentalOffer(payload.offerId);
      setSelectedOfferMessage(null);
      await invalidateOfferSurfaces();
    } catch (error: any) {
      showAlert('Error', error.message, 'error');
    } finally {
      setActioningOfferId(null);
    }
  };

  const goToKirayePar = () => {
    setRentalsMode('borrowing');
    setCurrentTab('Rentals');
    closeStack();
  };

  const getOfferModel = (payload: ChatOfferPayload) => {
    const offer = offersById[payload.offerId];
    const status = offer?.status || 'pending';
    const displayStatus = payload.state === 'withdrawn' ? 'withdrawn' : status;
    const price = Number(offer?.offered_price || payload.offeredPrice || 0);
    const durationHours = Number(offer?.duration_hours || payload.durationHours || 24);
    const days = Math.max(1, Math.round(durationHours / 24));
    const total = Math.ceil((price * durationHours) / 24);
    const item = offer?.items;
    const image = item?.images?.[0] || payload.itemImage || null;
    const title = item?.title || payload.itemTitle;
    return { offer, status: displayStatus, price, durationHours, days, total, image, title };
  };

  const statusCopy = (status: string, isMine: boolean) => {
    if (status === 'accepted') return isMine ? 'Accepted. Pay from Kiraye Par to start.' : 'Accepted. Waiting for borrower payment.';
    if (status === 'withdrawn') return 'Withdrawn. This request is closed.';
    if (status === 'declined') return 'Declined. This request is closed.';
    if (status === 'completed') return 'Paid and moved to active rental.';
    return isMine ? 'Waiting for owner response.' : 'Review and accept only if you can hand over.';
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

  const renderOfferCard = (msg: any, payload: ChatOfferPayload, isMine: boolean) => {
    const { status, price, total, image, title, days } = getOfferModel(payload);
    const isPending = status === 'pending';
    const isAccepted = status === 'accepted';

    return (
      <div
        role="button"
        tabIndex={0}
        className={`chat-offer-card app-clickable-card ${isMine ? 'mine' : 'theirs'}`}
        onClick={() => setSelectedOfferMessage({ message: msg, payload, isMine })}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setSelectedOfferMessage({ message: msg, payload, isMine });
          }
        }}
      >
        <div className="chat-offer-topline">
          <span>{isMine ? 'Offer sent' : 'Borrow offer'}</span>
          <strong className={`chat-offer-status status-${status}`}>{status.toUpperCase()}</strong>
        </div>
        <div className="chat-offer-main">
          <SmartImage
            src={image ? getSafeImageUrl(image) : null}
            alt={title}
            fallbackLabel={title}
            rounded={18}
            style={{ width: 64, height: 64, borderRadius: 18, objectFit: 'contain' }}
          />
          <div className="chat-offer-copy">
            <h4>{title}</h4>
            <p>{days} day request</p>
            <strong>₹{price.toLocaleString('en-IN')}/day</strong>
          </div>
        </div>
        <p className="chat-offer-state-copy">{statusCopy(status, isMine)}</p>
        <div className="chat-offer-actions">
          {!isMine && isPending && (
            <>
              <button className="scale-pressable app-small-action chat-offer-accept" disabled={actioningOfferId === payload.offerId} onClick={(event) => { event.stopPropagation(); handleOfferDecision(payload, 'accepted'); }}>
                <Check size={14} />
                Accept
              </button>
              <button className="scale-pressable app-small-action chat-offer-decline" disabled={actioningOfferId === payload.offerId} onClick={(event) => { event.stopPropagation(); handleOfferDecision(payload, 'declined'); }}>
                <Ban size={14} />
                Decline
              </button>
            </>
          )}
          {isMine && isAccepted && (
            <button className="scale-pressable app-primary-action chat-offer-pay" onClick={(event) => { event.stopPropagation(); goToKirayePar(); }}>
              <CreditCard size={14} />
              Pay ₹{total.toLocaleString('en-IN')}
            </button>
          )}
          {isMine && isPending && (
            <button className="scale-pressable app-small-action chat-offer-remove" onClick={(event) => { event.stopPropagation(); handleDeleteOfferMessage(msg, payload); }}>
              <Trash2 size={13} />
              Withdraw
            </button>
          )}
        </div>
        <div className="chat-offer-time">
          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-detail-screen chat-transaction-screen">
      {/* Header */}
      <div className="chat-detail-header">
        <button className="scale-pressable app-icon-button" onClick={closeStack}
          style={{ padding: 8, borderRadius: 20, background: 'var(--surface)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <ChevronLeft size={24} color="var(--text-primary)" />
        </button>
        {targetUser.avatar_url ? (
          <img src={getSafeImageUrl(targetUser.avatar_url)} alt="" style={{ width: 40, height: 40, borderRadius: 20, objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: 40, height: 40, borderRadius: 20, background: 'var(--accent-solid)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent-solid-text)', fontSize: 16, fontWeight: 700,
          }}>{targetUser.full_name.charAt(0)}</div>
        )}
        <div className="chat-partner"><strong>{targetUser.full_name}</strong><TrustRow label="Verified neighbour" /></div>
        <button className="scale-pressable app-icon-button" onClick={handleDeleteChat}
          style={{ padding: 8, borderRadius: 20, background: 'var(--muted)' }}>
          <Trash2 size={18} color="var(--text-primary)" />
        </button>
      </div>

      {/* Messages */}
      <div ref={messagesScrollRef} className="chat-message-list" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 50 }}>
            <div className="spinner" style={{ borderTopColor: 'var(--text-primary)', borderColor: 'var(--border)' }} />
          </div>
        ) : messages.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', marginTop: 60, fontSize: 14 }}>No messages yet. Say hi!</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === user?.id;
            const offerPayload = parseChatOfferContent(msg.content);
            return (
              <div key={msg.id} style={{
                display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 8,
              }}>
                {offerPayload ? renderOfferCard(msg, offerPayload, isMine) : (
                <div className={`chat-message-bubble bubble ${isMine ? 'mine' : 'theirs'}`} style={{
                  maxWidth: '75%', padding: '10px 16px', borderRadius: 20,
                  background: isMine ? 'var(--accent-solid)' : 'var(--surface)',
                  color: isMine ? 'var(--accent-solid-text)' : 'var(--text-primary)',
                  fontSize: 15, lineHeight: 1.5, fontWeight: 400,
                  ...(isMine ? { borderBottomRightRadius: 6 } : { borderBottomLeftRadius: 6 }),
                  boxShadow: isMine ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  {msg.content}
                  <div style={{
                    fontSize: 10, marginTop: 4,
                    color: isMine ? 'var(--accent-solid-text-muted)' : 'var(--text-light)',
                    textAlign: 'right',
                  }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="composer">
        <input
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 24, border: '1px solid var(--border)',
            background: 'var(--surface-alt)', fontSize: 15, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none',
          }}
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="scale-pressable app-icon-button send"
          onClick={sendMessage}
          disabled={!newMessage.trim() || sending}
          style={{
            width: 44, height: 44, borderRadius: 22, background: 'var(--accent-solid)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: !newMessage.trim() ? 0.4 : 1,
          }}>
          <Send size={20} color="var(--accent-solid-text)" />
        </button>
      </div>

      {selectedOfferMessage && (() => {
        const { message, payload, isMine } = selectedOfferMessage;
        const { status, price, total, image, title, days } = getOfferModel(payload);
        const isPending = status === 'pending';
        const isAccepted = status === 'accepted';

        return (
          <AppSheet open onClose={() => setSelectedOfferMessage(null)} labelledBy="chat-offer-sheet-title" className="chat-offer-sheet">
              <button type="button" className="scale-pressable app-icon-button chat-offer-sheet-close" onClick={() => setSelectedOfferMessage(null)} aria-label="Close offer details">
                <X size={18} />
              </button>
              <span className="chat-offer-sheet-kicker">{isMine ? 'Your offer' : 'Borrow request'}</span>
              <h3 id="chat-offer-sheet-title">{title}</h3>
              <p>{statusCopy(status, isMine)}</p>

              <div className="chat-offer-sheet-item">
                <SmartImage
                  src={image ? getSafeImageUrl(image) : null}
                  alt={title}
                  fallbackLabel={title}
                  rounded={18}
                  style={{ width: 64, height: 64, borderRadius: 18, objectFit: 'contain' }}
                />
                <div>
                  <StatusTag label={status} tone={status === 'accepted' ? 'complete' : status === 'declined' ? 'danger' : 'pending'} />
                  <strong>₹{price.toLocaleString('en-IN')}/day</strong>
                  <small>{days} day request, total ₹{total.toLocaleString('en-IN')}</small>
                </div>
              </div>

              <div className="chat-offer-sheet-actions">
                {!isMine && isPending && (
                  <>
                    <button type="button" className="scale-pressable app-primary-action chat-offer-sheet-primary" disabled={actioningOfferId === payload.offerId} onClick={() => handleOfferDecision(payload, 'accepted')}>
                      Accept offer
                    </button>
                    <button type="button" className="scale-pressable app-small-action chat-offer-sheet-secondary" disabled={actioningOfferId === payload.offerId} onClick={() => handleOfferDecision(payload, 'declined')}>
                      Decline
                    </button>
                  </>
                )}
                {isMine && isAccepted && (
                  <button type="button" className="scale-pressable app-primary-action chat-offer-sheet-primary" onClick={goToKirayePar}>
                    Pay from Kiraye Par
                  </button>
                )}
                {isMine && (
                  isPending ? (
                    <button type="button" className="scale-pressable app-small-action chat-offer-sheet-secondary" onClick={() => handleDeleteOfferMessage(message, payload)}>
                      Withdraw offer
                    </button>
                  ) : null
                )}
              </div>
          </AppSheet>
        );
      })()}
    </div>
  );
};

export default ChatDetailScreen;
