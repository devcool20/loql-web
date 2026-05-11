'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet, ChevronRight, ShoppingBag, Package, UserCog,
  CircleHelp, ShieldCheck, LogOut, Moon, Sun,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { getSafeImageUrl } from '@/lib/imageUtils';
import SmartImage from '@/components/app/SmartImage';

const ProfileScreen = () => {
  const { user, setUser, showAlert, setCurrentStack, setHistoryType, refreshTrigger, currentStack, theme, toggleTheme } = useStore();
  const [walletBalance, setWalletBalance] = useState(0);
  const [rentedCount, setRentedCount] = useState(0);
  const [listedCount, setListedCount] = useState(0);

  const displayName = user?.user_metadata?.full_name || 'Neighbor';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const phoneNumber = user?.phone || 'No phone number';

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

  useEffect(() => {
    if (user) {
      fetchCounts();
      fetchWalletBalance();
    }
  }, [user, currentStack, refreshTrigger]);

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
    { icon: <UserCog size={20} color="var(--text-primary)" />, label: 'Account Settings', onPress: () => setCurrentStack('EditProfile') },
    {
      icon: theme === 'dark' ? <Sun size={20} color="var(--text-primary)" /> : <Moon size={20} color="var(--text-primary)" />,
      label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
      onPress: toggleTheme,
    },
    { icon: <CircleHelp size={20} color="var(--text-primary)" />, label: 'Get Help', onPress: () => showAlert('Help', 'Contact us at loqlrent@gmail.com', 'info') },
    { icon: <ShieldCheck size={20} color="var(--text-primary)" />, label: 'Privacy', onPress: () => showAlert('Privacy', 'Your data is safe with us. We never share your personal information.', 'info') },
    { icon: <LogOut size={20} color="#EF4444" />, label: 'Log Out', onPress: handleLogout, destructive: true },
  ];

  return (
    <div className="profile-screen" style={{ background: 'var(--background)', minHeight: '100%', padding: '24px 0 120px' }}>
      <div className="profile-content" style={{ padding: '0 24px' }}>
        {/* User Info */}
        <div className="profile-user-row" style={{ display: 'flex', alignItems: 'center', marginTop: 14, marginBottom: 24 }}>
          <div className="profile-avatar-wrap" style={{ marginRight: 18, borderRadius: 20, boxShadow: 'var(--shadow-md)', transform: 'rotate(-3deg)', border: '4px solid var(--surface-container-lowest)' }}>
            {avatarUrl ? (
              <SmartImage
                src={getSafeImageUrl(avatarUrl)}
                alt={displayName}
                fallbackLabel={displayName}
                loading="eager"
                fetchPriority="high"
                rounded={18}
                className="profile-avatar-media"
                style={{ width: 92, height: 92, borderRadius: 18, objectFit: 'cover' }}
              />
            ) : (
              <div className="profile-avatar-media" style={{
                width: 92, height: 92, borderRadius: 18, background: 'var(--accent-solid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent-solid-text)', fontSize: 26, fontWeight: 700,
              }}>{displayName[0]}</div>
            )}
          </div>
          <div>
            <h2 className="profile-name" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, letterSpacing: -0.4 }}>{displayName}</h2>
            <span className="profile-phone" style={{ fontSize: 14, color: 'var(--text-light)' }}>{phoneNumber}</span>
          </div>
        </div>

        {/* Wallet Card */}
        <div className="profile-wallet-card scale-pressable"
          onClick={() => setCurrentStack('Wallet')}
          style={{
            display: 'flex', alignItems: 'center', background: 'var(--accent-solid)', padding: 20, borderRadius: 24, marginBottom: 26,
            boxShadow: 'var(--warm-glow)', cursor: 'pointer',
          }}>
          <div className="profile-wallet-icon" style={{
            width: 48, height: 48, borderRadius: 24, background: 'var(--accent-solid-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16,
          }}>
            <Wallet size={24} color="var(--accent-solid-text)" />
          </div>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 12, color: 'var(--accent-solid-text-muted)', display: 'block', marginBottom: 3 }}>Wallet Balance</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-solid-text)', letterSpacing: -0.3 }}>₹{walletBalance.toFixed(2)}</span>
          </div>
          <ChevronRight size={20} color="var(--accent-solid-text-muted)" />
        </div>

        {/* History */}
        <h3 className="profile-section-title" style={{ color: 'var(--primary)',
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' }}>Pehchan</h3>
        <div className="profile-stat-grid" style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          {[
            { icon: <ShoppingBag size={20} color="var(--accent-solid-text)" />, label: 'Rented', count: rentedCount, type: 'rented' as const },
            { icon: <Package size={20} color="var(--accent-solid-text)" />, label: 'For Rent', count: listedCount, type: 'for_rent' as const },
          ].map((card) => (
            <div key={card.label} className="profile-stat-card scale-pressable"
              onClick={() => { setHistoryType(card.type); setCurrentStack('HistoryDetail'); }}
              style={{
              flex: 1, background: 'var(--surface)', borderRadius: 20, padding: '18px 16px',
              textAlign: 'center', border: '1.5px solid var(--border-light)', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', cursor: 'pointer', position: 'relative',
            }}>
              <div className="profile-stat-icon" style={{
                width: 44, height: 44, borderRadius: 22, background: 'var(--accent-solid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
              }}>{card.icon}</div>
              <span className="profile-stat-label" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>{card.label}</span>
              <span className="profile-stat-count" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{card.count}</span>
              <ChevronRight size={16} color="var(--text-muted-icon)" style={{ position: 'absolute', top: 18, right: 14 }} />
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-light)', margin: '20px 0' }} />

        {/* Menu */}
        <div className="profile-menu-list" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {menuItems.map((item, index) => (
            <div key={index} className="profile-menu-row scale-pressable"
              onClick={item.onPress}
              style={{ display: 'flex', alignItems: 'center', padding: '14px 4px', cursor: 'pointer' }}>
              <div className="profile-menu-icon" style={{
                width: 40, height: 40, borderRadius: 12, background: 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14,
              }}>{item.icon}</div>
              <span className="profile-menu-label" style={{
                flex: 1, fontSize: 15, fontWeight: 500,
                color: item.destructive ? '#EF4444' : 'var(--text-primary)',
              }}>{item.label}</span>
              {!item.destructive && <ChevronRight size={18} color="var(--text-muted-icon)" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
