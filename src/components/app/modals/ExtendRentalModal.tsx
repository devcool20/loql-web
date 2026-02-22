'use client';

import React, { useState } from 'react';
import { X, Clock } from 'lucide-react';

interface ExtendRentalModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (additionalHours: number, additionalPrice: number) => void;
  rental: any;
  item: any;
  loading?: boolean;
}

const ExtendRentalModal = ({ visible, onClose, onSubmit, rental, item, loading }: ExtendRentalModalProps) => {
  const [additionalHours, setAdditionalHours] = useState('24');
  const dailyRate = item?.daily_rate || 0;

  if (!visible) return null;

  const handleSubmit = () => {
    const hours = parseInt(additionalHours);
    if (isNaN(hours) || hours <= 0) return;
    const days = hours / 24;
    const totalPrice = Math.ceil(dailyRate * days);
    onSubmit(hours, totalPrice);
  };

  const calculatedPrice = Math.ceil(dailyRate * (parseInt(additionalHours) || 0) / 24);

  return (
    <div className="alert-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 430,
        padding: 24, position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Extend Rental</h3>
          <button className="scale-pressable" onClick={onClose} style={{ padding: 4 }}><X size={24} color="#1F2937" /></button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <span style={{ fontSize: 18, fontWeight: 600, color: '#111827', display: 'block' }}>{item?.title}</span>
            <span style={{ fontSize: 14, color: '#6B7280' }}>Daily Rate: ₹{dailyRate}/day</span>
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 8 }}>Additional Duration (Hours)</label>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #D1D5DB', borderRadius: 12, padding: '0 12px', height: 50, gap: 8 }}>
              <Clock size={20} color="#6B7280" />
              <input type="number" value={additionalHours} onChange={(e) => setAdditionalHours(e.target.value)}
                placeholder="24" style={{ flex: 1, fontSize: 16, color: '#111827', fontFamily: 'inherit', border: 'none', outline: 'none', background: 'transparent' }} />
            </div>
            <span style={{ fontSize: 12, color: '#6B7280', textAlign: 'right', display: 'block', marginTop: 4 }}>
              {parseInt(additionalHours || '0') / 24} Additional Days
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F3F4F6', padding: 16, borderRadius: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Additional Cost</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>₹{calculatedPrice}</span>
          </div>

          <p style={{ fontSize: 12, color: '#6B7280', textAlign: 'center', fontStyle: 'italic' }}>
            The rental period will be extended from the current end time.
          </p>

          <button className="login-btn scale-pressable" onClick={handleSubmit} disabled={loading} style={{ borderRadius: 12, marginBottom: 24 }}>
            {loading ? <div className="spinner" /> : `Extend & Pay ₹${calculatedPrice}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExtendRentalModal;
