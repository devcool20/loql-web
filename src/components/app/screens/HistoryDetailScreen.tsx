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
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#FAFAFA', zIndex: 200, overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px' }}>
        <button className="scale-pressable" onClick={closeStack}
          style={{ padding: 8, borderRadius: 20, background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <ChevronLeft size={24} color="#111827" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon size={18} color="#111827" />
          <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>{title}</span>
        </div>
        <div style={{ width: 40 }} />
      </div>

      <div style={{ padding: '8px 20px 40px' }}>
        {loading ? (
          <ListSkeleton count={6} />
        ) : items.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9CA3AF', paddingTop: 60, fontSize: 14 }}>
            {isRented ? 'No rental history yet.' : "You haven't listed any items yet."}
          </p>
        ) : (
          items.map((item) => {
            const displayItem = isRented ? item.items : item;
            if (!displayItem) return null;
            const imgUrl = displayItem.images?.[0];
            return (
              <div key={item.id} className="scale-pressable"
                onClick={() => handleCardClick(item)}
                style={{
                  display: 'flex', alignItems: 'center', background: 'white', borderRadius: 20,
                  padding: 14, marginBottom: 14, border: '1px solid #F3F4F6',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer',
                }}>
                <div style={{ width: 72, height: 72, borderRadius: 16, background: '#F5F5F5', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14, flexShrink: 0 }}>
                  {imgUrl ? (
                    <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 16, padding: 4, mixBlendMode: 'multiply' }} />
                  ) : (
                    <span style={{ fontSize: 11, color: '#9CA3AF' }}>No Img</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#111827', display: 'block', marginBottom: 6 }}>{displayItem.title}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 8, fontSize: 10, color: '#FFFFFF',
                      letterSpacing: 0.5, fontWeight: 700, textTransform: 'uppercase',
                      background: getStatusColor(isRented ? item.status : displayItem.status),
                    }}>{getStatusText(item)}</span>
                    <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>{getPrice(item)}</span>
                  </div>
                </div>
                <ChevronLeft size={18} color="#D1D5DB" style={{ transform: 'rotate(180deg)' }} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default HistoryDetailScreen;
