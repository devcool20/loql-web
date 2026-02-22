'use client';

import React, { useState, useEffect } from 'react';
import { X, MessageCircle, CreditCard, ShieldCheck, Calendar, User, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';

interface BookingDetailModalProps {
  visible: boolean;
  booking: any;
  onClose: () => void;
  onUpdate: () => void;
}

const BookingDetailModal = ({ visible, booking, onClose, onUpdate }: BookingDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [owner, setOwner] = useState<any>(null);
  const { showAlert, openChat } = useStore();

  useEffect(() => {
    if (visible && booking?.owner_id) {
      fetchOwner();
      setSuccess(false);
      setLoading(false);
    }
  }, [visible, booking]);

  const fetchOwner = async () => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', booking.owner_id).single();
      if (data) setOwner(data);
    } catch (e) { console.error(e); }
  };

  if (!visible || !booking) return null;

  const item = booking.items;
  const isApproved = booking.status === 'approved';
  const isActive = booking.status === 'active';

  const handlePayment = async () => {
    setLoading(true);
    setTimeout(async () => {
      try {
        const { error: rentalError } = await supabase.from('rentals').update({ status: 'active' }).eq('id', booking.id);
        if (rentalError) throw rentalError;
        const { error: itemError } = await supabase.from('items').update({ status: 'rented' }).eq('id', booking.item_id);
        if (itemError) throw itemError;
        setLoading(false);
        setSuccess(true);
        setTimeout(() => { onUpdate(); onClose(); }, 2500);
      } catch (e: any) {
        setLoading(false);
        showAlert('Error', e.message, 'error');
      }
    }, 1500);
  };

  return (
    <div className="alert-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 430,
        maxHeight: '90vh', overflow: 'auto', position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      }}>
        {success ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
            <CheckCircle size={80} color="#10B981" style={{ marginBottom: 24 }} />
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 12, textAlign: 'center' }}>Payment Successful!</h2>
            <p style={{ fontSize: 16, fontWeight: 500, color: '#6B7280', textAlign: 'center', lineHeight: 1.5 }}>
              You have successfully rented this item. Enjoy!
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottom: '1px solid #F3F4F6' }}>
              <button className="scale-pressable" onClick={onClose} style={{ padding: 4 }}><X size={24} color="#111827" /></button>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Booking Details</span>
              <div style={{ width: 24 }} />
            </div>

            <div style={{ padding: 24, paddingBottom: 100 }}>
              {/* Status Banner */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 24,
                background: isApproved ? '#374151' : isActive ? '#000000' : '#9CA3AF',
              }}>
                <ShieldCheck size={20} color="white" />
                <span style={{ color: 'white', fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>
                  {isActive ? 'RENTAL ACTIVE' : isApproved ? 'APPROVED - PAYMENT PENDING' : booking.status.toUpperCase()}
                </span>
              </div>

              {/* Item Card */}
              <div style={{ marginBottom: 32 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', marginBottom: 12, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Item</span>
                <div style={{ display: 'flex', background: '#F9FAFB', padding: 12, borderRadius: 16, alignItems: 'center', gap: 16 }}>
                  {item?.images?.[0] ? (
                    <img src={item.images[0]} alt="" style={{ width: 64, height: 64, borderRadius: 12, padding: 4, objectFit: 'contain', mixBlendMode: 'multiply' }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 12, background: '#E5E7EB' }} />
                  )}
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', display: 'block', marginBottom: 4 }}>{item?.title}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>₹{item?.daily_rate}/day</span>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div style={{ marginBottom: 32 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', marginBottom: 12, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Schedule</span>
                <div style={{ display: 'flex', alignItems: 'center', background: '#F9FAFB', padding: 16, borderRadius: 16, gap: 12 }}>
                  <Calendar size={20} color="#111827" />
                  <div>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#111827', display: 'block' }}>
                      {new Date(booking.start_time || booking.start_date || booking.created_at).toLocaleDateString()} — {new Date(booking.end_time || booking.end_date || booking.created_at).toLocaleDateString()}
                    </span>
                    <span style={{ fontSize: 14, color: '#6B7280' }}>
                      {booking.duration_hours ? `${booking.duration_hours} Hours` : `${booking.duration_days || 0} Days`} Duration
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div style={{ marginBottom: 32 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', marginBottom: 12, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Payment Details</span>
                <div style={{ background: '#F9FAFB', padding: 20, borderRadius: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#4B5563', fontSize: 15, fontWeight: 500 }}>Daily Rate x {booking.duration_days}</span>
                    <span style={{ color: '#111827', fontWeight: 500, fontSize: 15 }}>₹{booking.total_price}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: '#4B5563', fontSize: 15, fontWeight: 500 }}>Service Fee</span>
                    <span style={{ color: '#111827', fontWeight: 500, fontSize: 15 }}>₹0</span>
                  </div>
                  <div style={{ height: 1, background: '#E5E7EB', margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>Total Amount</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>₹{booking.total_price}</span>
                  </div>
                </div>
              </div>

              {/* Owner */}
              <div style={{ marginBottom: 32 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#6B7280', marginBottom: 12, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>Owner</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {owner?.avatar_url ? (
                      <img src={owner.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: 20, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 20, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={20} color="#6B7280" />
                      </div>
                    )}
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Owned by {owner?.full_name || 'Neighbor'}</span>
                  </div>
                  <button className="scale-pressable" onClick={() => openChat({ ...owner, id: booking.owner_id })}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'white', border: '1px solid #E5E7EB', borderRadius: 20 }}>
                    <MessageCircle size={20} color="#111827" /><span style={{ fontWeight: 600, color: '#111827' }}>Chat</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ position: 'sticky', bottom: 0, padding: 24, background: 'white', borderTop: '1px solid #F3F4F6' }}>
              {isApproved ? (
                <button className="login-btn scale-pressable" onClick={handlePayment} disabled={loading} style={{ borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? <div className="spinner" /> : <><CreditCard size={20} color="white" /><span>Pay ₹{booking.total_price}</span></>}
                </button>
              ) : isActive ? (
                <div style={{ textAlign: 'center', padding: 16, borderRadius: 16, background: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                  <span style={{ fontWeight: 700, color: '#4B5563', fontSize: 16 }}>Rental in Progress</span>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 16, borderRadius: 16, background: '#F3F4F6' }}>
                  <span style={{ fontWeight: 700, color: '#6B7280', fontSize: 16 }}>Waiting for Approval</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingDetailModal;
