'use client';

import React, { useState } from 'react';
import { X, TrendingDown, Clock } from 'lucide-react';

interface CounterOfferModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (counterPrice: number, counterHours: number) => void;
  offer: any;
  item: any;
  loading?: boolean;
}

const CounterOfferModal = ({ visible, onClose, onSubmit, offer, item, loading }: CounterOfferModalProps) => {
  const [counterPrice, setCounterPrice] = useState(offer?.offered_price?.toString() || '');
  const [counterHours, setCounterHours] = useState(offer?.duration_hours?.toString() || '24');

  if (!visible) return null;

  const handleSubmit = () => {
    const price = parseInt(counterPrice);
    const hours = parseInt(counterHours);
    if (isNaN(price) || price <= 0 || isNaN(hours) || hours <= 0) return;
    onSubmit(price, hours);
  };

  const calculatedTotal = Math.ceil((parseInt(counterHours) || 0) / 24 * (parseInt(counterPrice) || 0));

  return (
    <div className="alert-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 430,
        maxHeight: '90vh', overflow: 'auto', padding: 24,
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Counter Offer</h3>
          <button className="scale-pressable" onClick={onClose} style={{ padding: 4 }}><X size={24} color="#111827" /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#111827', display: 'block' }}>{item?.title}</span>
            <span style={{ fontSize: 14, color: '#6B7280' }}>Original Rate: ₹{item?.daily_rate}/day</span>
          </div>

          {/* Original Offer */}
          <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 12, border: '1px solid #E5E7EB' }}>
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 }}>Original Offer</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>₹{offer?.offered_price}/day</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>•</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{offer?.duration_hours} hours</span>
            </div>
          </div>

          {/* Counter Price */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>Your Counter Price (per day)</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', borderRadius: 12, padding: '0 12px', height: 50, gap: 8 }}>
              <span style={{ color: '#6B7280', fontSize: 16 }}>₹</span>
              <input type="number" value={counterPrice} onChange={(e) => setCounterPrice(e.target.value)}
                placeholder={item?.daily_rate?.toString()} style={{ flex: 1, fontSize: 16, color: '#111827', fontFamily: 'inherit', border: 'none', outline: 'none', background: 'transparent' }} />
              <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>/day</span>
            </div>
          </div>

          {/* Counter Duration */}
          <div>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>Duration (Hours)</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', borderRadius: 12, padding: '0 12px', height: 50, gap: 8 }}>
              <Clock size={20} color="#6B7280" />
              <input type="number" value={counterHours} onChange={(e) => setCounterHours(e.target.value)}
                placeholder="24" style={{ flex: 1, fontSize: 16, color: '#111827', fontFamily: 'inherit', border: 'none', outline: 'none', background: 'transparent' }} />
              <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>hours</span>
            </div>
            <span style={{ fontSize: 12, color: '#6B7280', textAlign: 'right', display: 'block', marginTop: 4 }}>
              {(parseInt(counterHours || '0') / 24).toFixed(1)} Days
            </span>
          </div>

          {/* Summary */}
          <div style={{ background: '#F3F4F6', padding: 16, borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Counter Offer Total</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>₹{calculatedTotal}</span>
            </div>
            <span style={{ fontSize: 12, color: '#6B7280' }}>₹{counterPrice || 0}/day × {(parseInt(counterHours || '0') / 24).toFixed(1)} days</span>
          </div>

          <p style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', fontStyle: 'italic' }}>
            The renter will be notified of your counter offer and can accept or decline.
          </p>

          <button className="login-btn scale-pressable" onClick={handleSubmit} disabled={loading}
            style={{ borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
            {loading ? <div className="spinner" /> : <><TrendingDown size={20} color="white" /><span>Send Counter Offer</span></>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CounterOfferModal;
