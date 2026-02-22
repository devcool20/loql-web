'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, CreditCard, X, ShieldCheck, Camera } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { ListSkeleton } from '@/components/app/Skeleton';
import { cacheGetStale, cacheSet, cacheInvalidate, CACHE_KEYS, TTL } from '@/lib/cache';

const RentalsScreen = () => {
  const { user, showAlert, navigateToDetail, setCurrentStack } = useStore();
  const [activeTab, setActiveTab] = useState<'listings' | 'bookings' | 'offers'>('listings');
  const [listings, setListings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSocietyId, setUserSocietyId] = useState<string | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOfferForPayment, setSelectedOfferForPayment] = useState<any>(null);
  const [handoverCode, setHandoverCode] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => { fetchUserSociety(); }, [user]);
  useEffect(() => { if (userSocietyId) loadData(); }, [activeTab, userSocietyId]);

  const fetchUserSociety = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase.from('profiles').select('society_id').eq('id', user.id).single();
      if (data?.society_id) setUserSocietyId(data.society_id);
    } catch (e) { console.error('Error:', e); }
  };

  const getCacheKey = () => {
    if (activeTab === 'listings') return CACHE_KEYS.listings(user.id);
    if (activeTab === 'bookings') return CACHE_KEYS.bookings(user.id);
    return CACHE_KEYS.offers(user.id);
  };

  const loadData = async (forceRefresh = false) => {
    const cacheKey = getCacheKey();
    if (!forceRefresh) {
      const { data: stale } = await cacheGetStale<any[]>(cacheKey);
      if (stale && stale.length > 0) {
        if (activeTab === 'listings') setListings(stale);
        else if (activeTab === 'bookings') setBookings(stale);
        else setOffers(stale);
        setLoading(false);
        fetchFreshData(cacheKey);
        return;
      }
    }
    setLoading(true);
    await fetchFreshData(cacheKey);
  };

  const fetchFreshData = async (cacheKey: string) => {
    try {
      if (activeTab === 'listings') {
        const { data } = await supabase.from('items')
          .select('id, title, daily_rate, images, category, status, created_at, owner_id, society_id')
          .eq('owner_id', user.id).eq('society_id', userSocietyId)
          .order('created_at', { ascending: false });
        const fresh = data || [];
        setListings(fresh);
        cacheSet(cacheKey, fresh, TTL.SHORT);
      } else if (activeTab === 'bookings') {
        const { data } = await supabase.from('rentals')
          .select('*, items(id, title, images, daily_rate)')
          .eq('renter_id', user.id)
          .order('created_at', { ascending: false });
        const fresh = data || [];
        setBookings(fresh);
        cacheSet(cacheKey, fresh, TTL.SHORT);
      } else {
        const { data } = await supabase.from('offers')
          .select('*, items(id, title, images, daily_rate, market_price, owner_id)')
          .eq('sender_id', user.id).neq('status', 'completed')
          .order('created_at', { ascending: false });
        const fresh = data || [];
        setOffers(fresh);
        cacheSet(cacheKey, fresh, TTL.SHORT);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#6B7280';
      case 'approved': case 'accepted': return '#10B981';
      case 'countered': return '#F59E0B';
      case 'active': return '#111827';
      case 'declined': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleAcceptCounter = async (offer: any) => {
    try {
      const { error } = await supabase.from('offers').update({ status: 'accepted' }).eq('id', offer.id);
      if (error) throw error;
      showAlert('Offer Accepted', 'You can now proceed to payment.', 'success');
      cacheInvalidate(CACHE_KEYS.offers(user.id));
      loadData(true);
    } catch (e: any) { showAlert('Error', e.message, 'error'); }
  };

  const handleDeclineCounter = async (offer: any) => {
    try {
      const { error } = await supabase.from('offers').update({ status: 'declined' }).eq('id', offer.id);
      if (error) throw error;
      showAlert('Offer Declined', 'Offer has been removed.', 'success');
      cacheInvalidate(CACHE_KEYS.offers(user.id));
      loadData(true);
    } catch (e: any) { showAlert('Error', e.message, 'error'); }
  };

  const handleDelete = (item: any) => {
    showAlert('Delete Item', `Remove "${item.title}"? This cannot be undone.`, 'info', undefined, false, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('items').delete().eq('id', item.id);
            if (error) throw error;
            setListings(prev => prev.filter(i => i.id !== item.id));
          } catch (e: any) { showAlert('Error', e.message, 'error'); }
        },
      },
    ]);
  };

  // ─── PAYMENT FLOW ───
  const openPaymentModal = (offer: any) => {
    setSelectedOfferForPayment(offer);
    setHandoverCode('');
    setPaying(false);
    setPaymentSuccess(false);
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async () => {
    if (!selectedOfferForPayment || paying) return;
    const offer = selectedOfferForPayment;

    // Validate handover code: should match last 6 chars of offer ID
    const expectedCode = offer.id.slice(-6).toUpperCase();
    if (handoverCode.toUpperCase() !== expectedCode) {
      showAlert('Invalid Code', 'The handover code does not match. Ask the owner for the correct code.', 'error');
      return;
    }

    let item = offer.items;
    if (!item || !item.id) {
      const { data: itemData, error: itemFetchError } = await supabase.from('items').select('*').eq('id', offer.item_id).single();
      if (itemFetchError || !itemData) { showAlert('Error', 'Failed to load item details', 'error'); return; }
      item = itemData;
    }

    const pricePerDay = offer.offered_price;
    const durationDays = offer.duration_hours / 24;
    let totalCost = Math.ceil(pricePerDay * durationDays);
    let insurance = 0;
    if (item.market_price > 3000) { insurance = 9; totalCost += insurance; }

    setPaying(true);
    try {
      // 1. Check wallet
      let { data: walletData, error: walletError } = await supabase.from('wallets').select('balance').eq('user_id', user.id).maybeSingle();
      if (walletError) throw new Error(`Wallet error: ${walletError.message}`);
      if (!walletData) {
        const { data: newWallet, error: createError } = await supabase.from('wallets').insert({ user_id: user.id, balance: 5000 }).select('balance').single();
        if (createError || !newWallet) throw new Error('Wallet not found');
        walletData = newWallet;
      }
      if (walletData.balance < totalCost) throw new Error(`Insufficient Balance. You need ₹${totalCost}, but you have ₹${walletData.balance}`);

      // 2. Deduct wallet
      const { error: deductError } = await supabase.from('wallets').update({ balance: walletData.balance - totalCost }).eq('user_id', user.id);
      if (deductError) throw new Error(`Payment failed: ${deductError.message}`);

      // 3. Create rental
      const { error: rentalError } = await supabase.from('rentals').insert({
        item_id: item.id, renter_id: user.id, owner_id: item.owner_id,
        final_price: totalCost, duration_hours: offer.duration_hours,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + offer.duration_hours * 3600000).toISOString(),
        status: 'active', is_insured: insurance > 0,
      });
      if (rentalError) throw rentalError;

      // 4. Update item status
      await supabase.from('items').update({ status: 'rented' }).eq('id', item.id);

      // 5. Complete offer
      await supabase.from('offers').update({ status: 'completed' }).eq('id', offer.id);

      setPaymentSuccess(true);
      cacheInvalidate(CACHE_KEYS.bookings(user.id));
      cacheInvalidate(CACHE_KEYS.offers(user.id));

      setTimeout(() => {
        setShowPaymentModal(false);
        setSelectedOfferForPayment(null);
        loadData(true);
        setActiveTab('bookings');
      }, 2000);

    } catch (e: any) {
      showAlert('Payment Failed', e.message, 'error');
    } finally {
      setPaying(false);
    }
  };

  const renderListingCard = (item: any) => (
    <div key={item.id} className="scale-pressable" style={cardStyle} onClick={() => navigateToDetail(item)}>
      <div style={imageContainerStyle}>
        {item.images?.[0] ? (
          <img src={item.images[0]} alt={item.title} style={imageStyle} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 12 }}>No Img</div>
        )}
      </div>
      <div style={contentStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111827', flex: 1 }}>{item.title}</span>
          <button className="scale-pressable" style={{ padding: 6, borderRadius: 8, background: '#FEE2E2' }}
            onClick={(e) => { e.stopPropagation(); handleDelete(item); }}>
            <Trash2 size={14} color="#EF4444" />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ ...badgeStyle, background: getStatusColor(item.status) }}>{item.status?.toUpperCase()}</span>
          <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>₹{item.daily_rate}/day</span>
        </div>
      </div>
    </div>
  );

  const renderBookingCard = (item: any) => (
    <div key={item.id} className="scale-pressable" style={cardStyle}
      onClick={() => { if (item.items) navigateToDetail(item.items); }}>
      <div style={imageContainerStyle}>
        {item.items?.images?.[0] ? (
          <img src={item.items.images[0]} alt="" style={imageStyle} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 11 }}>No Img</div>
        )}
      </div>
      <div style={contentStyle}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{item.items?.title || 'Unknown'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <span style={{ ...badgeStyle, background: getStatusColor(item.status) }}>{item.status?.toUpperCase()}</span>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>{new Date(item.start_date || item.created_at).toLocaleDateString()}</span>
        </div>
        {item.status === 'pending' && <span style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Waiting for confirmation</span>}
      </div>
    </div>
  );

  const renderOfferCard = (item: any) => {
    const totalCost = Math.ceil((item.offered_price * item.duration_hours) / 24);
    return (
      <div key={item.id} className="scale-pressable" style={cardStyle}
        onClick={() => { if (item.items) navigateToDetail(item.items); }}>
        <div style={imageContainerStyle}>
          {item.items?.images?.[0] ? (
            <img src={item.items.images[0]} alt="" style={imageStyle} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 11 }}>No Img</div>
          )}
        </div>
        <div style={contentStyle}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{item.items?.title || 'Item'}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ ...badgeStyle, background: getStatusColor(item.status) }}>{item.status?.toUpperCase()}</span>
            <span style={{ fontSize: 13, color: '#6B7280', fontWeight: 500 }}>₹{item.offered_price}/day • {(item.duration_hours / 24).toFixed(0)}d</span>
          </div>
          {item.status === 'countered' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="scale-pressable" style={{ padding: '8px 18px', borderRadius: 12, background: '#111827', color: 'white', fontSize: 13, fontWeight: 600 }}
                onClick={(e) => { e.stopPropagation(); handleAcceptCounter(item); }}>Accept</button>
              <button className="scale-pressable" style={{ padding: '8px 18px', borderRadius: 12, background: 'white', border: '1px solid #E5E7EB', color: '#4B5563', fontSize: 13, fontWeight: 600 }}
                onClick={(e) => { e.stopPropagation(); handleDeclineCounter(item); }}>Decline</button>
            </div>
          )}
          {item.status === 'accepted' && (
            <button className="scale-pressable"
              onClick={(e) => { e.stopPropagation(); openPaymentModal(item); }}
              style={{
                padding: '10px 20px', borderRadius: 14, background: '#111827', color: 'white',
                fontSize: 14, fontWeight: 700, marginTop: 10, display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 2px 8px rgba(17,24,39,0.3)',
              }}>
              <CreditCard size={16} color="white" />
              <span>Pay ₹{totalCost}</span>
            </button>
          )}
          {!['countered', 'accepted'].includes(item.status) && (
            <span style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>{(item.duration_hours / 24).toFixed(0)} Days Request</span>
          )}
        </div>
      </div>
    );
  };

  const activeData = activeTab === 'listings' ? listings : activeTab === 'offers' ? offers : bookings;
  const renderCard = activeTab === 'listings' ? renderListingCard : activeTab === 'offers' ? renderOfferCard : renderBookingCard;

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100%', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#111827', letterSpacing: -0.5 }}>My Rentals</h1>
        {activeTab === 'listings' && (
          <button className="scale-pressable" onClick={() => setCurrentStack('AddItem')}
            style={{ width: 44, height: 44, borderRadius: 22, background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
            <Plus size={24} color="white" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '0 24px', marginBottom: 16, gap: 10 }}>
        {(['listings', 'offers', 'bookings'] as const).map((tab) => (
          <button key={tab} className="scale-pressable"
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 22px', borderRadius: 50, border: `1.5px solid ${activeTab === tab ? '#111827' : '#E5E7EB'}`,
              background: activeTab === tab ? '#111827' : '#FFFFFF', color: activeTab === tab ? '#FFFFFF' : '#6B7280',
              fontSize: 14, fontWeight: 600,
            }}>
            {tab === 'listings' ? 'Listings' : tab === 'offers' ? 'My Offers' : 'Rentals'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: '8px 20px' }}><ListSkeleton count={5} /></div>
      ) : activeData.length === 0 ? (
        <p style={{ textAlign: 'center', marginTop: 60, color: '#9CA3AF', fontSize: 15, fontWeight: 500 }}>Nothing here yet.</p>
      ) : (
        <div style={{ padding: '8px 20px 0' }}>
          {activeData.map(renderCard)}
        </div>
      )}

      {/* ─── Payment / Handover Modal ─── */}
      {showPaymentModal && selectedOfferForPayment && (
        <div className="alert-overlay" onClick={() => { if (!paying) setShowPaymentModal(false); }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'white', borderRadius: '32px 32px 0 0', width: '100%', maxWidth: 430,
            position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', 
            padding: '24px 24px 110px', // Extra bottom padding for nav bar
            animation: 'slideUp 0.3s ease-out',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.1)',
          }}>
            {paymentSuccess ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 40, background: '#D1FAE5',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
                }}>
                  <ShieldCheck size={40} color="#10B981" />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>Payment Successful!</h3>
                <p style={{ fontSize: 15, color: '#6B7280', textAlign: 'center' }}>
                  Rental started. Enjoy your item!
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Complete Payment</h3>
                  <button className="scale-pressable" onClick={() => setShowPaymentModal(false)} 
                    style={{ padding: 8, borderRadius: 20, background: '#F3F4F6' }}>
                    <X size={20} color="#111827" />
                  </button>
                </div>

                {/* Item Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#F9FAFB', padding: 14, borderRadius: 20, border: '1px solid #F3F4F6', marginBottom: 20 }}>
                  {selectedOfferForPayment.items?.images?.[0] ? (
                    <img src={selectedOfferForPayment.items.images[0]} alt="" style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'contain', background: 'white', padding: 4 }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={24} color="#9CA3AF" />
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: '#111827', display: 'block', marginBottom: 2 }}>{selectedOfferForPayment.items?.title}</span>
                    <span style={{ fontSize: 14, color: '#6B7280', fontWeight: 500 }}>
                      ₹{selectedOfferForPayment.offered_price}/day × {(selectedOfferForPayment.duration_hours / 24).toFixed(0)} days
                    </span>
                  </div>
                </div>

                {/* Cost */}
                <div style={{ background: '#F9FAFB', padding: 18, borderRadius: 20, border: '1px solid #F3F4F6', marginBottom: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ color: '#6B7280', fontSize: 14, fontWeight: 500 }}>Rental Subscription</span>
                    <span style={{ color: '#111827', fontSize: 15, fontWeight: 600 }}>
                      ₹{Math.ceil(selectedOfferForPayment.offered_price * selectedOfferForPayment.duration_hours / 24)}
                    </span>
                  </div>
                  {selectedOfferForPayment.items?.market_price > 3000 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ color: '#6B7280', fontSize: 14, fontWeight: 500 }}>Security Insurance</span>
                      <span style={{ color: '#111827', fontSize: 15, fontWeight: 600 }}>₹9</span>
                    </div>
                  )}
                  <div style={{ height: 1, background: '#E5E7EB', margin: '12px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>Total Amount</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>
                      ₹{Math.ceil(selectedOfferForPayment.offered_price * selectedOfferForPayment.duration_hours / 24) + (selectedOfferForPayment.items?.market_price > 3000 ? 9 : 0)}
                    </span>
                  </div>
                </div>

                {/* Handover Code */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, marginLeft: 4 }}>
                    <ShieldCheck size={16} color="#111827" />
                    <label style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                      Handover Verification
                    </label>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text" maxLength={6} value={handoverCode}
                      onChange={(e) => setHandoverCode(e.target.value.toUpperCase())}
                      placeholder="••••••"
                      style={{
                        width: '100%', textAlign: 'center', fontSize: 32, fontWeight: 800, letterSpacing: 12,
                        padding: '20px 0', borderRadius: 20, border: '2px solid #E5E7EB', color: '#111827',
                        fontFamily: 'monospace', outline: 'none', background: '#FFFFFF',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s ease',
                      }}
                      className="handover-input"
                    />
                  </div>
                  <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 12, fontWeight: 500 }}>
                    Enter the 6-character code from the item owner
                  </p>
                </div>

                <button className="login-btn scale-pressable" onClick={handleProcessPayment}
                  disabled={paying || handoverCode.length !== 6}
                  style={{ borderRadius: 16, opacity: handoverCode.length !== 6 ? 0.5 : 1 }}>
                  {paying ? <div className="spinner" /> : `Pay & Start Rental`}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'row', background: '#FFFFFF', borderRadius: 20, padding: 14,
  marginBottom: 14, border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  alignItems: 'center', cursor: 'pointer',
};
const imageContainerStyle: React.CSSProperties = {
  width: 80, height: 80, borderRadius: 16, background: '#F9FAFB', overflow: 'hidden',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
const imageStyle: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'contain', borderRadius: 16, background: 'white', padding: 4 };
const contentStyle: React.CSSProperties = { flex: 1, marginLeft: 14, display: 'flex', flexDirection: 'column', justifyContent: 'center' };
const badgeStyle: React.CSSProperties = {
  padding: '3px 10px', borderRadius: 8, fontSize: 10, color: '#FFFFFF',
  letterSpacing: 0.5, fontWeight: 700, textTransform: 'uppercase',
};

export default RentalsScreen;
