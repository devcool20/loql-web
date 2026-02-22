'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet, ChevronRight, ShoppingBag, Package, UserCog,
  CircleHelp, ShieldCheck, LogOut,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

const ProfileScreen = () => {
  const { user, setUser, showAlert, setCurrentStack, setHistoryType } = useStore();
  const [walletBalance, setWalletBalance] = useState(0);
  const [rentedCount, setRentedCount] = useState(0);
  const [listedCount, setListedCount] = useState(0);

  const displayName = user?.user_metadata?.full_name || 'Neighbor';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const phoneNumber = user?.phone || 'No phone number';

  useEffect(() => {
    if (user) {
      fetchCounts();
      fetchWalletBalance();
    }
  }, [user]);

  const fetchCounts = async () => {
    try {
      const [rentedRes, listedRes] = await Promise.all([
        supabase.from('rentals').select('id', { count: 'exact', head: true }).eq('renter_id', user.id),
        supabase.from('items').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
      ]);
      setRentedCount(rentedRes.count || 0);
      setListedCount(listedRes.count || 0);
    } catch (e) { console.error(e); }
  };

  const fetchWalletBalance = async () => {
    try {
      const { data, error } = await supabase.from('wallets').select('balance').eq('user_id', user.id).maybeSingle();
      if (error) { setWalletBalance(0); return; }
      if (!data) {
        const { data: newWallet } = await supabase.from('wallets')
          .insert({ user_id: user.id, balance: 5000 }).select('balance').single();
        if (newWallet) setWalletBalance(newWallet.balance);
        return;
      }
      setWalletBalance(data.balance);
    } catch (e) { setWalletBalance(0); }
  };

  const handleLogout = () => {
    showAlert('Log Out', 'Are you sure you want to log out?', 'info', undefined, false, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => { await supabase.auth.signOut(); setUser(null); },
      },
    ]);
  };

  const menuItems = [
    { icon: <UserCog size={20} color="#111827" />, label: 'Account Settings', onPress: () => setCurrentStack('EditProfile') },
    { icon: <CircleHelp size={20} color="#111827" />, label: 'Get Help', onPress: () => showAlert('Help', 'Contact us at loqlrent@gmail.com', 'info') },
    { icon: <ShieldCheck size={20} color="#111827" />, label: 'Privacy', onPress: () => showAlert('Privacy', 'Your data is safe with us. We never share your personal information.', 'info') },
    { icon: <LogOut size={20} color="#EF4444" />, label: 'Log Out', onPress: handleLogout, destructive: true },
  ];

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100%', paddingBottom: 120 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 20px' }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Profile</span>
      </div>

      <div style={{ padding: '0 24px' }}>
        {/* User Info */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 8, marginBottom: 28 }}>
          <div style={{ marginRight: 18, borderRadius: 40, boxShadow: '0 6px 10px rgba(0,0,0,0.12)' }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: 76, height: 76, borderRadius: 38, objectFit: 'cover' }} />
            ) : (
              <div style={{
                width: 76, height: 76, borderRadius: 38, background: '#111827',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: 26, fontWeight: 700,
              }}>{displayName[0]}</div>
            )}
          </div>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 4, letterSpacing: -0.4 }}>{displayName}</h2>
            <span style={{ fontSize: 14, color: '#9CA3AF' }}>{phoneNumber}</span>
          </div>
        </div>

        {/* Wallet Card */}
        <div className="scale-pressable"
          onClick={() => setCurrentStack('Wallet')}
          style={{
            display: 'flex', alignItems: 'center', background: '#111827', padding: 20, borderRadius: 24, marginBottom: 30,
            boxShadow: '0 10px 20px rgba(17,24,39,0.25)', cursor: 'pointer',
          }}>
          <div style={{
            width: 48, height: 48, borderRadius: 24, background: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16,
          }}>
            <Wallet size={24} color="#FFFFFF" />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 3 }}>Wallet Balance</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', letterSpacing: -0.3 }}>₹{walletBalance.toFixed(2)}</span>
          </div>
          <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
        </div>

        {/* History */}
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 14, letterSpacing: -0.3 }}>History</h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          {[
            { icon: <ShoppingBag size={20} color="#FFFFFF" />, label: 'Rented', count: rentedCount, type: 'rented' as const },
            { icon: <Package size={20} color="#FFFFFF" />, label: 'For Rent', count: listedCount, type: 'for_rent' as const },
          ].map((card) => (
            <div key={card.label} className="scale-pressable"
              onClick={() => { setHistoryType(card.type); setCurrentStack('HistoryDetail'); }}
              style={{
              flex: 1, background: '#FFFFFF', borderRadius: 20, padding: '18px 16px',
              textAlign: 'center', border: '1.5px solid #F3F4F6', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', cursor: 'pointer', position: 'relative',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 22, background: '#111827',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
              }}>{card.icon}</div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#6B7280', display: 'block', marginBottom: 2 }}>{card.label}</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{card.count}</span>
              <ChevronRight size={16} color="#D1D5DB" style={{ position: 'absolute', top: 18, right: 14 }} />
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#F3F4F6', margin: '20px 0' }} />

        {/* Menu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {menuItems.map((item, index) => (
            <div key={index} className="scale-pressable"
              onClick={item.onPress}
              style={{ display: 'flex', alignItems: 'center', padding: '14px 4px', cursor: 'pointer' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12, background: '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14,
              }}>{item.icon}</div>
              <span style={{
                flex: 1, fontSize: 15, fontWeight: 500,
                color: item.destructive ? '#EF4444' : '#111827',
              }}>{item.label}</span>
              {!item.destructive && <ChevronRight size={18} color="#D1D5DB" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
