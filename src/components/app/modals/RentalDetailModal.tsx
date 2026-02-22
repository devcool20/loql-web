'use client';

import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { formatDistanceToNow, isPast } from 'date-fns';

interface RentalDetailModalProps {
  visible: boolean;
  rental: any;
  onClose: () => void;
  onUpdate: () => void;
  onExtend?: (rental: any) => void;
}

const RentalDetailModal = ({ visible, rental, onClose, onUpdate, onExtend }: RentalDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [item, setItem] = useState<any>(null);
  const { user, showAlert, openChat } = useStore();

  useEffect(() => {
    if (visible && rental) fetchDetails();
  }, [visible, rental]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const { data: itemData } = await supabase.from('items').select('*').eq('id', rental.item_id).single();
      setItem(itemData);
      const otherUserId = rental.owner_id === user.id ? rental.renter_id : rental.owner_id;
      const { data: userData } = await supabase.from('profiles').select('*').eq('id', otherUserId).single();
      setOtherUser(userData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (!visible || !rental) return null;

  const isOffer = rental.offered_price !== undefined || !rental.start_time;
  const isOwner = user?.id === (isOffer ? rental.receiver_id : rental.owner_id);
  const isActive = rental.status === 'active';
  const endTimeValue = rental.end_time || rental.end_date || rental.created_at;
  const startTimeValue = rental.start_time || rental.start_date || rental.created_at;
  const endTime = endTimeValue ? new Date(endTimeValue) : new Date();
  const isValidEndTime = endTimeValue && !isNaN(endTime.getTime());
  const isExpired = isValidEndTime && !isOffer ? isPast(endTime) : false;
  const timeRemaining = !isValidEndTime ? 'Unknown' : isExpired ? 'Expired' : formatDistanceToNow(endTime, { addSuffix: true });

  const getStatusBg = () => {
    if (isOffer) return rental.status === 'accepted' ? '#111827' : rental.status === 'countered' ? '#4B5563' : '#9CA3AF';
    return isExpired ? '#4B5563' : isActive ? '#111827' : '#9CA3AF';
  };

  return (
    <div className="alert-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 430,
        maxHeight: '90vh', overflow: 'auto', position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid #F3F4F6' }}>
          <button className="scale-pressable" onClick={onClose} style={{ padding: 4 }}><X size={24} color="#111827" /></button>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Rental Details</span>
          <div style={{ width: 24 }} />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" style={{ borderTopColor: '#111827', borderColor: '#E5E7EB' }} />
          </div>
        ) : (
          <div style={{ padding: 24, paddingBottom: 100 }}>
            {/* Status Banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 24, background: getStatusBg() }}>
              <Clock size={20} color="white" />
              <span style={{ color: 'white', fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>
                {isOffer ? `OFFER ${rental.status.toUpperCase()}` : isExpired ? 'RENTAL EXPIRED' : isActive ? 'RENTAL ACTIVE' : rental.status.toUpperCase()}
              </span>
            </div>

            {/* Item Card */}
            <div style={{ marginBottom: 32 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', marginBottom: 12, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Item</span>
              <div style={{ display: 'flex', background: '#F9FAFB', padding: 12, borderRadius: 16, alignItems: 'center', gap: 16 }}>
                {item?.images?.[0] ? (
                  <img src={item.images[0]} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'contain', background: 'white', padding: 4 }} />
                ) : (
                  <div style={{ width: 64, height: 64, borderRadius: 12, background: '#E5E7EB' }} />
                )}
                <div>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', display: 'block', marginBottom: 4 }}>{item?.title || 'Loading...'}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>₹{item?.daily_rate}/day</span>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div style={{ marginBottom: 32 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', marginBottom: 12, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {isOffer ? 'Requested Duration' : 'Schedule'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', background: '#F9FAFB', padding: 16, borderRadius: 16, gap: 12 }}>
                <Calendar size={20} color="#111827" />
                <div>
                  {isOffer ? (
                    <>
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#111827', display: 'block' }}>
                        {rental.duration_hours ? `${rental.duration_hours} Hours` : 'Duration not specified'}
                      </span>
                      <span style={{ fontSize: 14, color: '#6B7280' }}>
                        {rental.duration_hours ? `${(rental.duration_hours / 24).toFixed(1)} Days` : ''}
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#111827', display: 'block' }}>
                        {startTimeValue ? new Date(startTimeValue).toLocaleDateString() : 'N/A'} — {rental.end_time || rental.end_date ? new Date(rental.end_time || rental.end_date).toLocaleDateString() : 'N/A'}
                      </span>
                      <span style={{ fontSize: 14, color: '#6B7280' }}>{rental.duration_hours || 0} Hours Duration</span>
                      {isActive && isValidEndTime && (
                        <span style={{ fontSize: 14, color: isExpired ? '#4B5563' : '#6B7280', marginTop: 2, display: 'block' }}>{timeRemaining}</span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Payment */}
            <div style={{ marginBottom: 32 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', marginBottom: 12, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Payment Details</span>
              <div style={{ background: '#F9FAFB', padding: 20, borderRadius: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#4B5563', fontSize: 15, fontWeight: 500 }}>{isOffer ? 'Offered Price' : 'Total Amount'}</span>
                  <span style={{ color: '#111827', fontWeight: 500, fontSize: 15 }}>
                    ₹{isOffer ? (rental.offered_price ? `${rental.offered_price}/day` : 'N/A') : (rental.final_price || 0)}
                  </span>
                </div>
                {isOffer && rental.duration_hours && rental.offered_price && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#4B5563', fontSize: 15, fontWeight: 500 }}>Estimated Total</span>
                    <span style={{ color: '#111827', fontWeight: 500, fontSize: 15 }}>₹{Math.ceil((rental.duration_hours / 24) * rental.offered_price)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Other User */}
            <div style={{ marginBottom: 32 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', marginBottom: 12, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {isOwner ? 'Renter' : 'Owner'}
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {otherUser?.avatar_url ? (
                    <img src={otherUser.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: 20, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 20, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={20} color="#6B7280" />
                    </div>
                  )}
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{otherUser?.full_name || 'Neighbor'}</span>
                </div>
                <button className="scale-pressable" onClick={() => openChat(otherUser)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 20 }}>
                  <MessageCircle size={20} color="#111827" /><span style={{ fontWeight: 600, color: '#111827' }}>Chat</span>
                </button>
              </div>
            </div>

            {/* Expired Warning */}
            {isExpired && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F3F4F6', padding: 16, borderRadius: 12, border: '1px solid #E5E7EB' }}>
                <AlertCircle size={20} color="#111827" />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#111827', lineHeight: 1.5 }}>
                  {isOwner ? 'This rental has expired. Please collect your item from the renter.' : 'This rental has expired. Please return the item or extend the rental.'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!loading && !isOffer && (
          <div style={{ position: 'sticky', bottom: 0, padding: 24, background: 'white', borderTop: '1px solid #F3F4F6' }}>
            {!isOwner && isActive && isExpired ? (
              <button className="login-btn scale-pressable" onClick={() => { onClose(); onExtend?.(rental); }} style={{ borderRadius: 16 }}>
                Extend Rental
              </button>
            ) : (
              <div style={{ textAlign: 'center', padding: 16, borderRadius: 16, background: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                <span style={{ fontWeight: 700, color: '#4B5563', fontSize: 16 }}>
                  {isOwner && isActive ? (isExpired ? 'Waiting for Return' : 'Item Currently Rented') : isActive ? 'Rental in Progress' : 'Completed'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalDetailModal;
