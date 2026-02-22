'use client';

import React, { useEffect, useState } from 'react';
import { X, Award, Package, ShoppingBag, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateTrustScore } from '@/lib/trustScore';

interface UserProfileModalProps {
  visible: boolean;
  userId: string | null;
  user?: any;
  onClose: () => void;
}

const UserProfileModal = ({ visible, userId, user: passedUser, onClose }: UserProfileModalProps) => {
  const [stats, setStats] = useState({ rented: 0, listed: 0, trustScore: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && userId) fetchData();
    else { setStats({ rented: 0, listed: 0, trustScore: 0 }); }
  }, [visible, userId]);

  const fetchData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { count: rentedCount } = await supabase.from('rentals').select('*', { count: 'exact', head: true }).eq('renter_id', userId).eq('status', 'completed');
      const { count: listedCount } = await supabase.from('items').select('*', { count: 'exact', head: true }).eq('owner_id', userId);
      const score = await calculateTrustScore(userId);
      setStats({ rented: rentedCount || 0, listed: listedCount || 0, trustScore: score });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (!visible) return null;

  const displayUser = passedUser || {};
  const displayName = displayUser.full_name || displayUser.name || 'User';
  const avatarUrl = displayUser.avatar_url;

  return (
    <div className="alert-overlay" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'white', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 430,
        maxHeight: '90vh', overflow: 'auto', position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottom: '1px solid #F3F4F6' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>User Profile</span>
          <button className="scale-pressable" onClick={onClose} style={{ padding: 8 }}><X size={24} color="#111827" /></button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner" style={{ borderTopColor: '#111827', borderColor: '#E5E7EB' }} />
          </div>
        ) : (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Avatar */}
            <div style={{ width: 100, height: 100, borderRadius: 50, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden' }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: 100, height: 100, borderRadius: 50, objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>{displayName[0]}</span>
              )}
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{displayName}</h2>
            <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 500, marginBottom: 8 }}>Trust Score</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF3C7', padding: '8px 16px', borderRadius: 20, marginBottom: 32 }}>
              <Award size={20} color="#F59E0B" />
              <span style={{ fontSize: 20, fontWeight: 700, color: '#D97706' }}>{stats.trustScore}/100</span>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'flex', gap: 16, width: '100%', marginBottom: 32 }}>
              {[
                { icon: <ShoppingBag size={24} color="#2563EB" />, bg: '#DBEAFE', value: stats.rented, label: 'Items Rented' },
                { icon: <Package size={24} color="#059669" />, bg: '#D1FAE5', value: stats.listed, label: 'Items Listed' },
              ].map((card) => (
                <div key={card.label} style={{ flex: 1, background: '#F9FAFB', borderRadius: 16, padding: 16, textAlign: 'center', border: '1px solid #E5E7EB' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 24, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>{card.icon}</div>
                  <span style={{ fontSize: 24, fontWeight: 700, color: '#111827', display: 'block', marginBottom: 4 }}>{card.value}</span>
                  <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{card.label}</span>
                </div>
              ))}
            </div>

            {/* Info */}
            <div style={{ width: '100%', background: '#F3F4F6', padding: 16, borderRadius: 16, marginBottom: 24 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>About Trust Score</h4>
              <p style={{ fontSize: 14, color: '#4B5563', lineHeight: 1.5 }}>
                The trust score is calculated based on rental history, return punctuality, and community feedback. A high score indicates a reliable member.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;
