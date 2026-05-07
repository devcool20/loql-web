'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import React, { useEffect, useState } from 'react';
import { Camera, CreditCard, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import AppTopBar from '@/components/app/AppTopBar';
import { ListSkeleton } from '@/components/app/Skeleton';
import { cacheGetStale, cacheInvalidate, cacheSet, CACHE_KEYS, TTL } from '@/lib/cache';
import { getSafeImageUrl } from '@/lib/imageUtils';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { assertGeofenceAllowed } from '@/lib/geofence';

type RentalsTab = 'listings' | 'offers' | 'bookings';

const RentalsScreen = () => {
  const { user, showAlert, navigateToDetail, setCurrentStack, setPermission, setCoords, refreshGeofence } = useStore();
  const [activeTab, setActiveTab] = useState<RentalsTab>('listings');
  const [listings, setListings] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSocietyId, setUserSocietyId] = useState<string | null>(null);
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
    } catch (error) {
      console.error('Error fetching society:', error);
    }
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
          .eq('owner_id', user.id)
          .eq('society_id', userSocietyId)
          .order('created_at', { ascending: false });
        setListings(data || []);
        cacheSet(cacheKey, data || [], TTL.SHORT);
      } else if (activeTab === 'bookings') {
        const { data } = await supabase.from('rentals')
          .select('*, items(id, title, images, daily_rate)')
          .eq('renter_id', user.id)
          .order('created_at', { ascending: false });
        setBookings(data || []);
        cacheSet(cacheKey, data || [], TTL.SHORT);
      } else {
        const { data } = await supabase.from('offers')
          .select('*, items(id, title, images, daily_rate, market_price, owner_id)')
          .eq('sender_id', user.id)
          .neq('status', 'completed')
          .order('created_at', { ascending: false });
        setOffers(data || []);
        cacheSet(cacheKey, data || [], TTL.SHORT);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toneForStatus = (status?: string) => {
    switch (status) {
      case 'accepted':
      case 'approved':
        return { bg: 'rgba(16,185,129,0.12)', text: '#059669', border: 'rgba(16,185,129,0.18)' };
      case 'countered':
        return { bg: 'rgba(245,158,11,0.13)', text: '#B45309', border: 'rgba(245,158,11,0.2)' };
      case 'declined':
        return { bg: 'rgba(239,68,68,0.1)', text: '#DC2626', border: 'rgba(239,68,68,0.18)' };
      case 'active':
        return { bg: 'var(--text-primary)', text: 'var(--surface)', border: 'var(--text-primary)' };
      case 'completed':
        return { bg: 'rgba(65,179,163,0.13)', text: 'var(--secondary)', border: 'rgba(65,179,163,0.22)' };
      default:
        return { bg: 'var(--muted)', text: 'var(--text-subtle)', border: 'var(--border-light)' };
    }
  };

  const formatCurrency = (value?: number | string | null) => `\u20B9${Number(value || 0).toLocaleString('en-IN')}`;
  const formatDays = (hours?: number) => `${Math.max(1, Math.round((hours || 24) / 24))}d`;

  const handleAcceptCounter = async (offer: any) => {
    try {
      const { permission, coords, access } = await assertGeofenceAllowed(user.id);
      setPermission(permission);
      setCoords(coords);
      refreshGeofence({
        geofenceStatus: 'inside',
        distanceMeters: access.distance_meters,
        radiusMeters: access.radius_meters,
        geofenceSocietyName: access.society_name,
        locationPermission: permission,
      });

      const { error } = await supabase.from('offers').update({ status: 'accepted' }).eq('id', offer.id);
      if (error) throw error;
      showAlert('Offer Accepted', 'You can now proceed to payment.', 'success');
      cacheInvalidate(CACHE_KEYS.offers(user.id));
      loadData(true);
    } catch (error: any) {
      showAlert('Error', error.message, 'error');
    }
  };

  const handleDeclineCounter = async (offer: any) => {
    try {
      const { error } = await supabase.from('offers').update({ status: 'declined' }).eq('id', offer.id);
      if (error) throw error;
      showAlert('Offer Declined', 'Offer has been removed.', 'success');
      cacheInvalidate(CACHE_KEYS.offers(user.id));
      loadData(true);
    } catch (error: any) {
      showAlert('Error', error.message, 'error');
    }
  };

  const handleDelete = (item: any) => {
    showAlert('Delete Item', `Remove "${item.title}"? This cannot be undone.`, 'info', undefined, false, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('items').delete().eq('id', item.id);
            if (error) throw error;
            setListings((prev) => prev.filter((listing) => listing.id !== item.id));
          } catch (error: any) {
            showAlert('Error', error.message, 'error');
          }
        },
      },
    ]);
  };

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
    const expectedCode = offer.id.slice(-6).toUpperCase();

    if (handoverCode.toUpperCase() !== expectedCode) {
      showAlert('Invalid Code', 'The handover code does not match. Ask the owner for the correct code.', 'error');
      return;
    }

    try {
      const { permission, coords, access } = await assertGeofenceAllowed(user.id);
      setPermission(permission);
      setCoords(coords);
      refreshGeofence({
        geofenceStatus: 'inside',
        distanceMeters: access.distance_meters,
        radiusMeters: access.radius_meters,
        geofenceSocietyName: access.society_name,
        locationPermission: permission,
      });
    } catch (error: any) {
      showAlert('Access blocked', error?.message || 'Location required for secure neighborhood access.', 'error');
      return;
    }

    let item = offer.items;
    if (!item?.id) {
      const { data: itemData, error: itemFetchError } = await supabase.from('items').select('*').eq('id', offer.item_id).single();
      if (itemFetchError || !itemData) {
        showAlert('Error', 'Failed to load item details', 'error');
        return;
      }
      item = itemData;
    }

    const durationDays = offer.duration_hours / 24;
    let totalCost = Math.ceil(offer.offered_price * durationDays);
    const insurance = item.market_price > 3000 ? 9 : 0;
    totalCost += insurance;

    setPaying(true);
    try {
      const { data: existingWallet, error: walletError } = await supabase.from('wallets').select('balance').eq('user_id', user.id).maybeSingle();
      let walletData = existingWallet;
      if (walletError) throw new Error(`Wallet error: ${walletError.message}`);
      if (!walletData) {
        const { data: newWallet, error: createError } = await supabase.from('wallets').insert({ user_id: user.id, balance: 5000 }).select('balance').single();
        if (createError || !newWallet) throw new Error('Wallet not found');
        walletData = newWallet;
      }
      if (walletData.balance < totalCost) throw new Error(`Insufficient Balance. You need ${formatCurrency(totalCost)}, but you have ${formatCurrency(walletData.balance)}`);

      const { error: deductError } = await supabase.from('wallets').update({ balance: walletData.balance - totalCost }).eq('user_id', user.id);
      if (deductError) throw new Error(`Payment failed: ${deductError.message}`);

      const { error: rentalError } = await supabase.from('rentals').insert({
        item_id: item.id,
        renter_id: user.id,
        owner_id: item.owner_id,
        final_price: totalCost,
        duration_hours: offer.duration_hours,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + offer.duration_hours * 3600000).toISOString(),
        status: 'active',
        is_insured: insurance > 0,
      });
      if (rentalError) throw rentalError;

      await supabase.from('items').update({ status: 'rented' }).eq('id', item.id);
      await supabase.from('offers').update({ status: 'completed' }).eq('id', offer.id);

      setPaymentSuccess(true);
      cacheInvalidate(CACHE_KEYS.bookings(user.id));
      cacheInvalidate(CACHE_KEYS.offers(user.id));

      setTimeout(() => {
        setShowPaymentModal(false);
        setSelectedOfferForPayment(null);
        loadData(true);
        setActiveTab('bookings');
      }, 1800);
    } catch (error: any) {
      showAlert('Payment Failed', error.message, 'error');
    } finally {
      setPaying(false);
    }
  };

  const StatusPill = ({ status }: { status?: string }) => {
    const tone = toneForStatus(status);
    return (
      <span style={{ ...styles.badge, background: tone.bg, color: tone.text, borderColor: tone.border }}>
        {(status || 'available').toUpperCase()}
      </span>
    );
  };

  const Media = ({ src, title }: { src?: string; title?: string }) => (
    <div style={styles.imageContainer}>
      {src ? (
        <img src={getSafeImageUrl(src)} alt={title || 'Item'} style={styles.image} />
      ) : (
        <div style={styles.emptyImage}>No image</div>
      )}
    </div>
  );

  const renderListingCard = (item: any) => (
    <article key={item.id} className="scale-pressable-up" style={styles.card} onClick={() => navigateToDetail(item)}>
      <Media src={item.images?.[0]} title={item.title} />
      <div style={styles.cardContent}>
        <div style={styles.cardHeader}>
          <div style={styles.titleBlock}>
            <h3 style={styles.cardTitle}>{item.title}</h3>
            <p style={styles.cardMeta}>{item.category || 'Listed item'}</p>
          </div>
          <button
            className="scale-pressable"
            aria-label={`Delete ${item.title}`}
            style={styles.deleteButton}
            onClick={(event) => { event.stopPropagation(); handleDelete(item); }}
          >
            <Trash2 size={15} color="var(--text-subtle)" />
          </button>
        </div>
        <div style={styles.cardFooter}>
          <StatusPill status={item.status} />
          <span style={styles.price}>{formatCurrency(item.daily_rate)}<span style={styles.priceUnit}>/day</span></span>
        </div>
      </div>
    </article>
  );

  const renderBookingCard = (item: any) => (
    <article key={item.id} className="scale-pressable-up" style={styles.card} onClick={() => { if (item.items) navigateToDetail(item.items); }}>
      <Media src={item.items?.images?.[0]} title={item.items?.title} />
      <div style={styles.cardContent}>
        <div style={styles.cardHeader}>
          <div style={styles.titleBlock}>
            <h3 style={styles.cardTitle}>{item.items?.title || 'Unknown item'}</h3>
            <p style={styles.cardMeta}>{new Date(item.start_date || item.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div style={styles.cardFooter}>
          <StatusPill status={item.status} />
          {item.status === 'pending' && <span style={styles.helperText}>Waiting for confirmation</span>}
        </div>
      </div>
    </article>
  );

  const renderOfferCard = (item: any) => {
    const totalCost = Math.ceil((item.offered_price * item.duration_hours) / 24);
    return (
      <article key={item.id} className="scale-pressable-up" style={styles.card} onClick={() => { if (item.items) navigateToDetail(item.items); }}>
        <Media src={item.items?.images?.[0]} title={item.items?.title} />
        <div style={styles.cardContent}>
          <div style={styles.cardHeader}>
            <div style={styles.titleBlock}>
              <h3 style={styles.cardTitle}>{item.items?.title || 'Item'}</h3>
              <p style={styles.cardMeta}>{formatCurrency(item.offered_price)}/day · {formatDays(item.duration_hours)} request</p>
            </div>
          </div>
          <div style={styles.cardFooter}><StatusPill status={item.status} /></div>
          {item.status === 'countered' && (
            <div style={styles.actionRow}>
              <button className="scale-pressable" style={styles.primarySmallButton} onClick={(event) => { event.stopPropagation(); handleAcceptCounter(item); }}>
                Accept
              </button>
              <button className="scale-pressable" style={styles.secondarySmallButton} onClick={(event) => { event.stopPropagation(); handleDeclineCounter(item); }}>
                Decline
              </button>
            </div>
          )}
          {item.status === 'accepted' && (
            <button className="scale-pressable" onClick={(event) => { event.stopPropagation(); openPaymentModal(item); }} style={styles.payButton}>
              <CreditCard size={16} color="var(--accent-solid-text)" />
              <span>Pay {formatCurrency(totalCost)}</span>
            </button>
          )}
          {!['countered', 'accepted'].includes(item.status) && (
            <span style={styles.helperText}>{formatDays(item.duration_hours)} request</span>
          )}
        </div>
      </article>
    );
  };

  const activeData = activeTab === 'listings' ? listings : activeTab === 'offers' ? offers : bookings;
  const renderCard = activeTab === 'listings' ? renderListingCard : activeTab === 'offers' ? renderOfferCard : renderBookingCard;

  return (
    <div style={{ background: 'var(--background)', minHeight: '100%', paddingBottom: 100 }}>
      <AppTopBar />
      <div style={styles.header}>
        <h1 className="font-serif" style={styles.title}>My Listings</h1>
        {activeTab === 'listings' && (
          <button className="scale-pressable" onClick={() => setCurrentStack('AddItem')} style={styles.addButton}>
            <Plus size={24} color="var(--accent-solid-text)" />
          </button>
        )}
      </div>

      <div style={styles.tabRow}>
        {(['listings', 'offers', 'bookings'] as const).map((tab) => (
          <button key={tab} className="scale-pressable" onClick={() => setActiveTab(tab)} style={{
            ...styles.segment,
            ...(activeTab === tab ? styles.segmentActive : {}),
          }}>
            {tab === 'listings' ? 'All Items' : tab === 'offers' ? 'Offers' : 'Borrowed'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '8px 20px' }}><ListSkeleton count={5} /></div>
      ) : activeData.length === 0 ? (
        <p style={styles.emptyState}>Nothing here yet.</p>
      ) : (
        <div style={styles.list}>{activeData.map(renderCard)}</div>
      )}

      {showPaymentModal && selectedOfferForPayment && (
        <PaymentSheet
          offer={selectedOfferForPayment}
          handoverCode={handoverCode}
          paying={paying}
          paymentSuccess={paymentSuccess}
          setHandoverCode={setHandoverCode}
          onClose={() => { if (!paying) setShowPaymentModal(false); }}
          onPay={handleProcessPayment}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
};

const PaymentSheet = ({
  offer,
  handoverCode,
  paying,
  paymentSuccess,
  setHandoverCode,
  onClose,
  onPay,
  formatCurrency,
}: {
  offer: any;
  handoverCode: string;
  paying: boolean;
  paymentSuccess: boolean;
  setHandoverCode: (value: string) => void;
  onClose: () => void;
  onPay: () => void;
  formatCurrency: (value?: number | string | null) => string;
}) => {
  const baseCost = Math.ceil((offer.offered_price * offer.duration_hours) / 24);
  const insurance = offer.items?.market_price > 3000 ? 9 : 0;
  const total = baseCost + insurance;

  return (
    <div className="alert-overlay" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} style={styles.sheet}>
        {paymentSuccess ? (
          <div style={styles.successState}>
            <div style={styles.successIcon}><ShieldCheck size={40} color="#10B981" /></div>
            <h3 style={styles.sheetTitle}>Payment Successful!</h3>
            <p style={styles.sheetCopy}>Rental started. Enjoy your item!</p>
          </div>
        ) : (
          <>
            <div style={styles.sheetHeader}>
              <h3 style={styles.sheetTitle}>Complete Payment</h3>
              <button className="scale-pressable" onClick={onClose} style={styles.closeButton}>
                <X size={20} color="var(--text-primary)" />
              </button>
            </div>

            <div style={styles.paymentItem}>
              {offer.items?.images?.[0] ? (
                <img src={getSafeImageUrl(offer.items.images[0])} alt="" style={styles.paymentImage} />
              ) : (
                <div style={styles.paymentImageFallback}><Camera size={24} color="var(--text-light)" /></div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={styles.paymentTitle}>{offer.items?.title}</span>
                <span style={styles.paymentMeta}>{formatCurrency(offer.offered_price)}/day · {Math.max(1, Math.round(offer.duration_hours / 24))} days</span>
              </div>
            </div>

            <div style={styles.costCard}>
              <div style={styles.costRow}><span>Rental subscription</span><strong>{formatCurrency(baseCost)}</strong></div>
              {insurance > 0 && <div style={styles.costRow}><span>Security insurance</span><strong>{formatCurrency(insurance)}</strong></div>}
              <div style={styles.costDivider} />
              <div style={styles.costTotal}><span>Total amount</span><strong>{formatCurrency(total)}</strong></div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={styles.handoverLabel}>
                <ShieldCheck size={16} color="var(--text-primary)" />
                <label>Handover verification</label>
              </div>
              <input
                type="text"
                maxLength={6}
                value={handoverCode}
                onChange={(event) => setHandoverCode(event.target.value.toUpperCase())}
                placeholder="••••••"
                style={styles.handoverInput}
              />
              <p style={styles.handoverHelp}>Enter the 6-character code from the item owner</p>
            </div>

            <button className="login-btn scale-pressable" onClick={onPay} disabled={paying || handoverCode.length !== 6} style={{
              borderRadius: 18,
              opacity: handoverCode.length !== 6 ? 0.5 : 1,
            }}>
              {paying ? <div className="spinner" /> : 'Pay & Start Rental'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px 14px',
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: -0.5,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    background: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--warm-glow)',
  },
  tabRow: {
    display: 'flex',
    padding: '0 24px',
    marginBottom: 16,
    gap: 8,
    overflowX: 'auto',
  },
  segment: {
    whiteSpace: 'nowrap',
    padding: '10px 16px',
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border-light)',
    background: 'var(--surface)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '-0.01em',
  },
  segmentActive: {
    borderColor: 'transparent',
    background: 'var(--primary)',
    color: 'var(--accent-solid-text)',
  },
  list: {
    padding: '8px 18px 0',
  },
  card: {
    display: 'flex',
    flexDirection: 'row',
    gap: 14,
    background: 'linear-gradient(180deg, var(--surface), var(--surface-container-lowest))',
    borderRadius: 24,
    padding: 14,
    marginBottom: 14,
    border: '1px solid var(--border-light)',
    boxShadow: '0 10px 28px rgba(45,49,66,0.06)',
    alignItems: 'stretch',
    cursor: 'pointer',
  },
  imageContainer: {
    width: 92,
    height: 92,
    borderRadius: 20,
    background: 'var(--img-placeholder)',
    overflow: 'hidden',
    border: '1px solid var(--border-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 20,
  },
  emptyImage: {
    color: 'var(--text-light)',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.02em',
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '3px 0',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleBlock: {
    minWidth: 0,
    flex: 1,
  },
  cardTitle: {
    margin: 0,
    color: 'var(--text-primary)',
    fontSize: 15,
    lineHeight: 1.25,
    fontWeight: 700,
    letterSpacing: '-0.01em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  cardMeta: {
    margin: '5px 0 0',
    color: 'var(--text-secondary)',
    fontSize: 12,
    lineHeight: 1.35,
    fontWeight: 600,
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    padding: '5px 9px',
    borderRadius: 999,
    fontSize: 9,
    lineHeight: 1,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border-light)',
    letterSpacing: '0.06em',
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  price: {
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 800,
    letterSpacing: '-0.01em',
  },
  priceUnit: {
    color: 'var(--text-secondary)',
    fontSize: 11,
    fontWeight: 700,
    marginLeft: 2,
  },
  helperText: {
    color: 'var(--text-light)',
    fontSize: 12,
    fontWeight: 600,
    marginTop: 8,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 14,
    background: 'var(--muted)',
    border: '1px solid var(--border-light)',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },
  actionRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginTop: 12,
  },
  primarySmallButton: {
    padding: '10px 12px',
    borderRadius: 14,
    background: 'var(--accent-solid)',
    color: 'var(--accent-solid-text)',
    fontSize: 13,
    fontWeight: 800,
  },
  secondarySmallButton: {
    padding: '10px 12px',
    borderRadius: 14,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--text-subtle)',
    fontSize: 13,
    fontWeight: 800,
  },
  payButton: {
    width: '100%',
    justifyContent: 'center',
    padding: '12px 16px',
    borderRadius: 16,
    background: 'var(--accent-solid)',
    color: 'var(--accent-solid-text)',
    fontSize: 14,
    fontWeight: 800,
    marginTop: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 8px 18px rgba(241,115,80,0.24)',
  },
  emptyState: {
    textAlign: 'center',
    marginTop: 60,
    color: 'var(--text-light)',
    fontSize: 15,
    fontWeight: 600,
  },
  sheet: {
    background: 'var(--surface)',
    borderRadius: '32px 32px 0 0',
    width: '100%',
    maxWidth: 430,
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '24px 24px 110px',
    animation: 'slideUp 0.3s ease-out',
    boxShadow: '0 -8px 32px rgba(0,0,0,0.1)',
  },
  successState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 0',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    background: '#D1FAE5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  sheetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: 800,
    color: 'var(--text-primary)',
    letterSpacing: '-0.02em',
    margin: 0,
  },
  sheetCopy: {
    fontSize: 15,
    color: 'var(--text-secondary)',
    textAlign: 'center',
    margin: 0,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    background: 'var(--muted)',
  },
  paymentItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    background: 'var(--surface-alt)',
    padding: 14,
    borderRadius: 20,
    border: '1px solid var(--border-light)',
    marginBottom: 20,
  },
  paymentImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    objectFit: 'cover',
  },
  paymentImageFallback: {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: 'var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTitle: {
    fontSize: 17,
    fontWeight: 800,
    color: 'var(--text-primary)',
    display: 'block',
    marginBottom: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  paymentMeta: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  costCard: {
    background: 'var(--surface-alt)',
    padding: 18,
    borderRadius: 20,
    border: '1px solid var(--border-light)',
    marginBottom: 24,
  },
  costRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 10,
  },
  costDivider: {
    height: 1,
    background: 'var(--border)',
    margin: '12px 0',
  },
  costTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'var(--text-primary)',
    fontSize: 16,
    fontWeight: 800,
  },
  handoverLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    marginLeft: 4,
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 800,
    textTransform: 'capitalize',
  },
  handoverInput: {
    width: '100%',
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: 12,
    padding: '20px 0',
    borderRadius: 20,
    border: '2px solid var(--border)',
    color: 'var(--text-primary)',
    fontFamily: 'monospace',
    outline: 'none',
    background: 'var(--surface)',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
    transition: 'all 0.2s ease',
  },
  handoverHelp: {
    fontSize: 13,
    color: 'var(--text-light)',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: 600,
  },
};

export default RentalsScreen;
