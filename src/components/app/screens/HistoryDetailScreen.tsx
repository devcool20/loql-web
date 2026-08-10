'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ShoppingBag, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { ListSkeleton } from '@/components/app/Skeleton';

const HistoryDetailScreen = () => {
  const { user, historyType, closeStack, navigateToDetail } = useStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isRented = historyType === 'rented';
  const title = isRented ? 'Rented' : 'For Rent';
  const Icon = isRented ? ShoppingBag : Package;

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    try {
      if (isRented) {
        const { data, error } = await supabase.from('rentals').select('*, items(*)').eq('renter_id', user.id).order('created_at', { ascending: false });
        if (error) throw error;
        setItems(data || []);
      } else {
        const { data, error } = await supabase.from('items').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
        if (error) throw error;
        setItems(data || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'active': return '#111827';
      case 'pending': return '#6B7280';
      case 'approved': return '#10B981';
      case 'rented': return '#111827';
      case 'available': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusText = (item: any) => {
    if (isRented) {
      if (item.status === 'completed') return 'Returned';
      if (item.status === 'pending') return 'Pending';
      if (item.status === 'approved') return 'Approved';
      return 'Active';
    }
    return item.status === 'rented' ? 'Rented' : 'Available';
  };

  const getPrice = (item: any) => {
    if (isRented) return `₹${item.total_price || item.final_price || item.items?.daily_rate || 0}`;
    return `₹${item.daily_rate}/day`;
  };

  const handleCardClick = (item: any) => {
    if (isRented) {
      // Navigate to the item detail for the rented item
      if (item.items) {
        navigateToDetail(item.items);
      }
    } else {
      navigateToDetail(item);
    }
  };

  return (
    <div className="utility-screen history-screen" style={{ width: '100%', minHeight: '100%', background: 'var(--background)' }}>
      {/* Header */}
      <div className="utility-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="utility-icon-button scale-pressable app-icon-button" onClick={closeStack}
          style={{ background: 'var(--surface)' }}>
          <ChevronLeft size={24} color="var(--text-primary)" />
        </button>
        <div className="utility-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={18} color="var(--text-primary)" />
          <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</span>
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div className="utility-content history-content" style={{ padding: '8px 20px 40px' }}>
        {loading ? (
          <ListSkeleton count={6} />
        ) : items.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', paddingTop: 60, fontSize: 14 }}>
            {isRented ? 'No rental history yet.' : "You haven't listed any items yet."}
          </p>
        ) : (
          items.map((item) => {
            const displayItem = isRented ? item.items : item;
            if (!displayItem) return null;
            const imgUrl = displayItem.images?.[0];
            return (
              <div key={item.id} className="history-card scale-pressable app-clickable-card app-reveal-card"
                onClick={() => handleCardClick(item)}
                style={{
                  display: 'flex', alignItems: 'center', background: 'var(--surface)', borderRadius: 20,
                  padding: 14, marginBottom: 14, border: '1px solid var(--border-light)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer',
                }}>
                <div style={{ width: 72, height: 72, borderRadius: 16, background: 'var(--img-placeholder)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                  {imgUrl ? (
                    <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--text-light)' }}>No Img</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>{displayItem.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 8, fontSize: 10, color: '#FFFFFF',
                      letterSpacing: 0.5, fontWeight: 700, textTransform: 'uppercase',
                      background: getStatusColor(isRented ? item.status : displayItem.status),
                    }}>{getStatusText(item)}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{getPrice(item)}</span>
                  </div>
                </div>
                <ChevronLeft size={18} color="var(--text-muted-icon)" style={{ transform: 'rotate(180deg)' }} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HistoryDetailScreen;
