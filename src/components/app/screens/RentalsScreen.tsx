'use client';

/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  PackageOpen,
  Plus,
  ShieldCheck,
  X,
} from 'lucide-react';
import { ListSkeleton } from '@/components/app/Skeleton';
import { cacheGetStale, cacheInvalidate, cacheSet, dedupeRequest, CACHE_KEYS, TTL } from '@/lib/cache';
import { getSafeImageUrl } from '@/lib/imageUtils';
import SmartImage from '@/components/app/SmartImage';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { assertGeofenceAllowed } from '@/lib/geofence';

const RentalsScreen = () => {
  const {
    user,
    showAlert,
    navigateToDetail,
    setCurrentStack,
    setPermission,
    setCoords,
    refreshGeofence,
    rentalsMode,
    setRentalsMode,
    setRentalsData,
  } = useStore();

  const storeRentalsData = useStore((state) => state.rentalsData);
  const rentalsIsHydrated = useStore((state) => state.rentalsIsHydrated);
  const rentalsLastFetchedAt = useStore((state) => state.rentalsLastFetchedAt);
  const rentalsRefreshRequest = useStore((state) => state.refreshRequests.rentals);

  const [listings, setListings] = useState<any[]>(() => useStore.getState().rentalsData.listings);
  const [bookings, setBookings] = useState<any[]>(() => useStore.getState().rentalsData.bookings);
  const [offers, setOffers] = useState<any[]>(() => useStore.getState().rentalsData.offers);
  const [loading, setLoading] = useState(() => !useStore.getState().rentalsIsHydrated);
  const [userSocietyId, setUserSocietyId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOfferForPayment, setSelectedOfferForPayment] = useState<any>(null);
  const [handoverCode, setHandoverCode] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => { fetchUserSociety(); }, [user?.id]);
  useEffect(() => {
    if (!userSocietyId) return;
    if (rentalsIsHydrated && Date.now() - rentalsLastFetchedAt < TTL.SHORT) {
      setListings(storeRentalsData.listings);
      setBookings(storeRentalsData.bookings);
      setOffers(storeRentalsData.offers);
      setLoading(false);
      return;
    }
    loadData();
  }, [userSocietyId]);

  useEffect(() => {
    if (!rentalsIsHydrated) return;
    setListings(storeRentalsData.listings);
    setBookings(storeRentalsData.bookings);
    setOffers(storeRentalsData.offers);
  }, [storeRentalsData, rentalsIsHydrated]);

  useEffect(() => {
    if (userSocietyId && rentalsRefreshRequest > 0) {
      loadData(true);
    }
  }, [rentalsRefreshRequest]);

  const fetchUserSociety = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase.from('profiles').select('society_id').eq('id', user.id).single();
      if (data?.society_id) setUserSocietyId(data.society_id);
    } catch (error) {
      console.error('Error fetching society:', error);
    }
  };

  const loadData = async (forceRefresh = false) => {
    if (!user?.id || !userSocietyId) return;
    setLoading(true);

    if (!forceRefresh) {
      const [listingCache, bookingCache, offerCache] = await Promise.all([
        cacheGetStale<any[]>(CACHE_KEYS.listings(user.id)),
        cacheGetStale<any[]>(CACHE_KEYS.bookings(user.id)),
        cacheGetStale<any[]>(CACHE_KEYS.offers(user.id)),
      ]);

      const hasCachedData = listingCache.data || bookingCache.data || offerCache.data;
      if (hasCachedData) {
        setListings(listingCache.data || []);
        setBookings(bookingCache.data || []);
        setOffers(offerCache.data || []);
        setLoading(false);
        fetchFreshData();
        return;
      }
    }

    await fetchFreshData();
  };

  const fetchFreshData = async () => {
    if (!user?.id || !userSocietyId) return;

    try {
      const [listingsRes, bookingsRes, offersRes] = await dedupeRequest(`rentals:${user.id}:${userSocietyId}:fresh`, () => Promise.all([
        supabase.from('items')
          .select('id, title, daily_rate, images, category, status, created_at, owner_id, society_id')
          .eq('owner_id', user.id)
          .eq('society_id', userSocietyId)
          .order('created_at', { ascending: false }),
        supabase.from('rentals')
          .select('*, items(id, title, images, daily_rate, status, owner_id)')
          .eq('renter_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('offers')
          .select('*, items(id, title, images, daily_rate, market_price, owner_id, status)')
          .eq('sender_id', user.id)
          .neq('status', 'completed')
          .order('created_at', { ascending: false }),
      ]));

      if (listingsRes.error) throw listingsRes.error;
      if (bookingsRes.error) throw bookingsRes.error;
      if (offersRes.error) throw offersRes.error;

      const nextListings = listingsRes.data || [];
      const nextBookings = bookingsRes.data || [];
      const nextOffers = offersRes.data || [];

      setListings(nextListings);
      setBookings(nextBookings);
      setOffers(nextOffers);
      setRentalsData({ listings: nextListings, bookings: nextBookings, offers: nextOffers });

      cacheSet(CACHE_KEYS.listings(user.id), nextListings, TTL.SHORT);
      cacheSet(CACHE_KEYS.bookings(user.id), nextBookings, TTL.SHORT);
      cacheSet(CACHE_KEYS.offers(user.id), nextOffers, TTL.SHORT);
    } catch (error) {
      console.error(error);
      showAlert('Could not load Kiraya', 'Please try again in a moment.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toneForStatus = (status?: string) => {
    switch (status) {
      case 'accepted':
      case 'approved':
        return { bg: 'rgba(16,185,129,0.12)', text: '#047857', border: 'rgba(16,185,129,0.18)', label: 'Accepted' };
      case 'countered':
        return { bg: 'rgba(245,158,11,0.13)', text: '#B45309', border: 'rgba(245,158,11,0.2)', label: 'Counter' };
      case 'declined':
        return { bg: 'rgba(239,68,68,0.1)', text: '#DC2626', border: 'rgba(239,68,68,0.18)', label: 'Declined' };
      case 'active':
      case 'rented':
        return { bg: 'rgba(65,179,163,0.14)', text: 'var(--secondary)', border: 'rgba(65,179,163,0.24)', label: 'Active' };
      case 'completed':
        return { bg: 'rgba(141,153,174,0.13)', text: 'var(--text-subtle)', border: 'rgba(141,153,174,0.2)', label: 'Done' };
      case 'pending':
        return { bg: 'var(--muted)', text: 'var(--text-subtle)', border: 'var(--border-light)', label: 'Pending' };
      default:
        return { bg: 'rgba(65,179,163,0.12)', text: 'var(--secondary)', border: 'rgba(65,179,163,0.2)', label: 'Available' };
    }
  };

  const formatCurrency = (value?: number | string | null) => `\u20B9${Number(value || 0).toLocaleString('en-IN')}`;
  const formatDays = (hours?: number) => `${Math.max(1, Math.round((hours || 24) / 24))}d`;

  const invalidateRentalCaches = async () => {
    await Promise.all([
      cacheInvalidate(CACHE_KEYS.listings(user.id)),
      cacheInvalidate(CACHE_KEYS.bookings(user.id)),
      cacheInvalidate(CACHE_KEYS.offers(user.id)),
      userSocietyId ? cacheInvalidate(CACHE_KEYS.homeItems(userSocietyId)) : Promise.resolve(),
    ]);
  };

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
      showAlert('Offer Accepted', 'You can now complete the handover payment.', 'success');
      await invalidateRentalCaches();
      loadData(true);
    } catch (error: any) {
      showAlert('Error', error.message, 'error');
    }
  };

  const handleDeclineCounter = async (offer: any) => {
    try {
      const { error } = await supabase.from('offers').update({ status: 'declined' }).eq('id', offer.id);
      if (error) throw error;
      showAlert('Offer Declined', 'The offer has been removed from your active flow.', 'success');
      await invalidateRentalCaches();
      loadData(true);
    } catch (error: any) {
      showAlert('Error', error.message, 'error');
    }
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
      setRentalsMode('borrowing');
      await invalidateRentalCaches();

      setTimeout(() => {
        setShowPaymentModal(false);
        setSelectedOfferForPayment(null);
        loadData(true);
      }, 1400);
    } catch (error: any) {
      showAlert('Payment Failed', error.message, 'error');
    } finally {
      setPaying(false);
    }
  };

  const StatusPill = ({ status }: { status?: string }) => {
    const tone = toneForStatus(status);
    return (
      <span className="rentals-badge" style={{ ...styles.badge, background: tone.bg, color: tone.text, borderColor: tone.border }}>
        {tone.label}
      </span>
    );
  };

  const Media = ({ src, title }: { src?: string; title?: string }) => (
    <div className="rentals-image-container" style={styles.imageContainer}>
      <SmartImage
        src={src ? getSafeImageUrl(src) : null}
        alt={title || 'Item'}
        fallbackLabel={title || 'Item'}
        rounded={styles.imageContainer.borderRadius}
        style={styles.image}
      />
    </div>
  );

  const renderCoreCard = ({
    keyValue,
    image,
    title,
    price,
    status,
    meta,
    onClick,
    children,
  }: {
    keyValue: string;
    image?: string;
    title: string;
    price?: number | string | null;
    status?: string;
    meta?: string;
    onClick?: () => void;
    children?: React.ReactNode;
  }) => (
    <article key={keyValue} className="rentals-card scale-pressable-up" style={styles.card} onClick={onClick}>
      <Media src={image} title={title} />
      <div className="rentals-card-content" style={styles.cardContent}>
        <div className="rentals-card-topline" style={styles.cardTopLine}>
          <h3 className="rentals-card-title" style={styles.cardTitle}>{title}</h3>
          {price !== undefined && price !== null && (
            <span className="rentals-card-price" style={styles.price}>{formatCurrency(price)}<span style={styles.priceUnit}>/day</span></span>
          )}
        </div>
        {meta && <p className="rentals-card-meta" style={styles.cardMeta}>{meta}</p>}
        <div className="rentals-card-footer" style={styles.cardFooter}>
          <StatusPill status={status} />
          {children}
        </div>
      </div>
    </article>
  );

  const renderListingCard = (item: any) => renderCoreCard({
    keyValue: item.id,
    image: item.images?.[0],
    title: item.title,
    price: item.daily_rate,
    status: item.status,
    meta: item.category || 'Ready for neighborhood use',
    onClick: () => navigateToDetail(item),
  });

  const renderBookingCard = (rental: any) => {
    const item = rental.items;
    return renderCoreCard({
      keyValue: rental.id,
      image: item?.images?.[0],
      title: item?.title || 'Rental',
      price: item?.daily_rate || rental.final_price,
      status: rental.status,
      meta: rental.start_time ? `Started ${new Date(rental.start_time).toLocaleDateString()}` : 'Rental timeline',
      onClick: () => item && navigateToDetail(item),
    });
  };

  const renderOfferCard = (offer: any) => {
    const item = offer.items;
    const totalCost = Math.ceil((offer.offered_price * offer.duration_hours) / 24);
    return renderCoreCard({
      keyValue: offer.id,
      image: item?.images?.[0],
      title: item?.title || 'Item',
      price: offer.offered_price,
      status: offer.status,
      meta: `${formatDays(offer.duration_hours)} request`,
      onClick: () => item && navigateToDetail(item),
      children: (
        <>
          {offer.status === 'accepted' && (
            <button className="scale-pressable" onClick={(event) => { event.stopPropagation(); openPaymentModal(offer); }} style={styles.payButton}>
              <CreditCard size={14} color="var(--accent-solid-text)" />
              <span>Pay {formatCurrency(totalCost)}</span>
            </button>
          )}
          {offer.status === 'countered' && (
            <div style={styles.actionRow}>
              <button className="scale-pressable" style={styles.primarySmallButton} onClick={(event) => { event.stopPropagation(); handleAcceptCounter(offer); }}>
                Accept
              </button>
              <button className="scale-pressable" style={styles.secondarySmallButton} onClick={(event) => { event.stopPropagation(); handleDeclineCounter(offer); }}>
                Decline
              </button>
            </div>
          )}
        </>
      ),
    });
  };

  const isBorrowingEmpty = offers.length === 0 && bookings.length === 0;

  return (
    <div className="rentals-screen" style={styles.screen}>
      <div className="rentals-header" style={styles.header}>
        <div>
          <span className="rentals-eyebrow" style={styles.eyebrow}>Loql Kiraya</span>
        </div>
        {rentalsMode === 'owned' && (
          <button className="rentals-add-button scale-pressable" onClick={() => setCurrentStack('AddItem')} style={styles.addButton} aria-label="Add item">
            <Plus size={22} color="var(--accent-solid-text)" />
          </button>
        )}
      </div>

      <div className="rentals-mode-switch" style={styles.modeSwitch} role="tablist" aria-label="Kiraya view">
        {[
          { id: 'owned', label: 'Mera Samaan', icon: PackageOpen },
          { id: 'borrowing', label: 'Kiraye Par', icon: Clock3 },
        ].map((mode) => {
          const Icon = mode.icon;
          const active = rentalsMode === mode.id;
          return (
            <button
              key={mode.id}
              role="tab"
              aria-selected={active}
              className="rentals-mode-button scale-pressable"
              onClick={() => setRentalsMode(mode.id as 'owned' | 'borrowing')}
              style={{ ...styles.modeButton, ...(active ? styles.modeButtonActive : {}) }}
            >
              <Icon size={15} color={active ? 'var(--accent-solid-text)' : 'var(--text-secondary)'} />
              {mode.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="rentals-loading" style={{ padding: '8px 20px' }}><ListSkeleton count={4} /></div>
      ) : rentalsMode === 'owned' ? (
        listings.length === 0 ? (
          <EmptyState title="No items listed yet" copy="Add something useful from your room and let your society borrow it safely." />
        ) : (
          <div className="rentals-list" style={styles.list}>{listings.map(renderListingCard)}</div>
        )
      ) : isBorrowingEmpty ? (
        <EmptyState title="Nothing on kiraya yet" copy="Send an offer on any item and it will show up here." />
      ) : (
        <div className="rentals-list" style={styles.list}>
          {offers.length > 0 && (
            <section style={styles.section}>
              <SectionTitle title="Offers" count={offers.length} />
              {offers.map(renderOfferCard)}
            </section>
          )}
          {bookings.length > 0 && (
            <section style={styles.section}>
              <SectionTitle title="Rentals" count={bookings.length} />
              {bookings.map(renderBookingCard)}
            </section>
          )}
        </div>
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

const SectionTitle = ({ title, count }: { title: string; count: number }) => (
  <div style={styles.sectionHeader}>
    <h2 style={styles.sectionTitle}>{title}</h2>
    <span style={styles.sectionCount}>{count}</span>
  </div>
);

const EmptyState = ({ title, copy }: { title: string; copy: string }) => (
  <div style={styles.emptyCard}>
    <PackageOpen size={28} color="var(--primary)" />
    <h3 style={styles.emptyTitle}>{title}</h3>
    <p style={styles.emptyCopy}>{copy}</p>
  </div>
);

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
            <div style={styles.successIcon}><CheckCircle2 size={42} color="#10B981" /></div>
            <h3 style={styles.sheetTitle}>Rental Active</h3>
            <p style={styles.sheetCopy}>Payment is complete. The item is now in your Kiraye Par list.</p>
          </div>
        ) : (
          <>
            <div style={styles.sheetHeader}>
              <div>
                <span style={styles.sheetEyebrow}>Handover payment</span>
                <h3 style={styles.sheetTitle}>Start rental</h3>
              </div>
              <button className="scale-pressable" onClick={onClose} style={styles.closeButton} aria-label="Close payment">
                <X size={20} color="var(--text-primary)" />
              </button>
            </div>

            <div style={styles.paymentItem}>
              <SmartImage
                src={offer.items?.images?.[0] ? getSafeImageUrl(offer.items.images[0]) : null}
                alt={offer.items?.title || 'Item'}
                fallbackLabel={offer.items?.title || 'Item'}
                rounded={18}
                style={styles.paymentImage}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={styles.paymentTitle}>{offer.items?.title}</span>
                <span style={styles.paymentMeta}>{formatCurrency(offer.offered_price)}/day · {Math.max(1, Math.round(offer.duration_hours / 24))} days</span>
              </div>
            </div>

            <div style={styles.costCard}>
              <div style={styles.costRow}><span>Rental amount</span><strong>{formatCurrency(baseCost)}</strong></div>
              {insurance > 0 && <div style={styles.costRow}><span>Security insurance</span><strong>{formatCurrency(insurance)}</strong></div>}
              <div style={styles.costDivider} />
              <div style={styles.costTotal}><span>Total</span><strong>{formatCurrency(total)}</strong></div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={styles.handoverLabel}>
                <ShieldCheck size={16} color="var(--text-primary)" />
                <label>Owner handover code</label>
              </div>
              <input
                type="text"
                maxLength={6}
                value={handoverCode}
                onChange={(event) => setHandoverCode(event.target.value.toUpperCase())}
                placeholder="ABC123"
                style={styles.handoverInput}
              />
              <p style={styles.handoverHelp}>Ask the owner for the 6-character code shown on their request card.</p>
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
  screen: {
    background: 'var(--background)',
    minHeight: '100%',
    padding: '24px 0 108px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px 16px',
  },
  eyebrow: {
    color: 'var(--primary)',
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    lineHeight: '28px',
    fontWeight: 650,
    color: 'var(--text-primary)',
    letterSpacing: '-0.03em',
    marginTop: 4,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    background: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--warm-glow)',
  },
  modeSwitch: {
    margin: '0 20px 18px',
    padding: 5,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 5,
    borderRadius: 999,
    background: 'var(--surface)',
    border: '1px solid var(--border-light)',
    boxShadow: 'var(--shadow-sm)',
  },
  modeButton: {
    minHeight: 38,
    borderRadius: 999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 750,
    letterSpacing: '-0.01em',
  },
  modeButtonActive: {
    background: 'var(--primary)',
    color: 'var(--accent-solid-text)',
    boxShadow: '0 8px 18px rgba(241,115,80,0.2)',
  },
  list: {
    padding: '0 18px',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 4px 10px',
  },
  sectionTitle: {
    color: 'var(--text-primary)',
    fontSize: 16,
    fontWeight: 750,
    letterSpacing: '-0.02em',
  },
  sectionCount: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    display: 'grid',
    placeItems: 'center',
    background: 'var(--muted)',
    color: 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 800,
  },
  card: {
    display: 'flex',
    flexDirection: 'row',
    gap: 13,
    background: 'linear-gradient(180deg, var(--surface), var(--surface-container-lowest))',
    borderRadius: 24,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border-light)',
    boxShadow: '0 12px 30px rgba(45,49,66,0.07)',
    alignItems: 'center',
    cursor: 'pointer',
  },
  imageContainer: {
    width: 78,
    height: 78,
    borderRadius: 20,
    background: 'var(--img-placeholder)',
    overflow: 'hidden',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border-light)',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    borderRadius: 20,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  cardTopLine: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'start',
    gap: 10,
  },
  cardTitle: {
    margin: 0,
    color: 'var(--text-primary)',
    fontSize: 13,
    lineHeight: 1.25,
    fontWeight: 600,
    letterSpacing: '-0.015em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  cardMeta: {
    margin: 0,
    color: 'var(--text-secondary)',
    fontSize: 12,
    lineHeight: 1.35,
    fontWeight: 500,
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    padding: '5px 9px',
    borderRadius: 999,
    fontSize: 10,
    lineHeight: 1,
    borderWidth: 1,
    borderStyle: 'solid',
    letterSpacing: '0.02em',
    fontWeight: 750,
  },
  price: {
    color: 'var(--text-primary)',
    fontSize: 13,
    lineHeight: 1.2,
    fontWeight: 700,
    letterSpacing: '-0.01em',
    whiteSpace: 'nowrap',
  },
  priceUnit: {
    color: 'var(--text-secondary)',
    fontSize: 10,
    fontWeight: 650,
    marginLeft: 2,
  },
  actionRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    width: '100%',
    marginTop: 4,
  },
  primarySmallButton: {
    padding: '9px 12px',
    borderRadius: 14,
    background: 'var(--accent-solid)',
    color: 'var(--accent-solid-text)',
    fontSize: 12,
    fontWeight: 750,
  },
  secondarySmallButton: {
    padding: '9px 12px',
    borderRadius: 14,
    background: 'var(--surface)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    color: 'var(--text-subtle)',
    fontSize: 12,
    fontWeight: 750,
  },
  payButton: {
    justifyContent: 'center',
    padding: '8px 12px',
    borderRadius: 999,
    background: 'var(--accent-solid)',
    color: 'var(--accent-solid-text)',
    fontSize: 12,
    fontWeight: 750,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 8px 18px rgba(241,115,80,0.2)',
  },
  emptyCard: {
    margin: '12px 20px 0',
    padding: 22,
    borderRadius: 24,
    background: 'var(--surface)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border-light)',
    boxShadow: 'var(--shadow-sm)',
    textAlign: 'center',
  },
  emptyTitle: {
    color: 'var(--text-primary)',
    fontSize: 17,
    fontWeight: 750,
    margin: '10px 0 6px',
  },
  emptyCopy: {
    color: 'var(--text-secondary)',
    fontSize: 13,
    lineHeight: 1.5,
    margin: 0,
  },
  sheet: {
    background: 'var(--surface)',
    borderRadius: '30px 30px 0 0',
    width: '100%',
    maxWidth: 430,
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '22px 24px 110px',
    animation: 'slideUp 0.3s ease-out',
    boxShadow: '0 -8px 32px rgba(0,0,0,0.12)',
  },
  successState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '30px 0',
  },
  successIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    background: '#D1FAE5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  sheetHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
  },
  sheetEyebrow: {
    color: 'var(--primary)',
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: 750,
    color: 'var(--text-primary)',
    letterSpacing: '-0.025em',
    margin: 0,
  },
  sheetCopy: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    textAlign: 'center',
    margin: 0,
    lineHeight: 1.5,
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
    padding: 13,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border-light)',
    marginBottom: 18,
  },
  paymentImage: {
    width: 62,
    height: 62,
    borderRadius: 18,
    objectFit: 'contain',
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 750,
    color: 'var(--text-primary)',
    display: 'block',
    marginBottom: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  paymentMeta: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    fontWeight: 600,
  },
  costCard: {
    background: 'var(--surface-alt)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--border-light)',
    marginBottom: 22,
  },
  costRow: {
    display: 'flex',
    justifyContent: 'space-between',
    color: 'var(--text-secondary)',
    fontSize: 13,
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
    fontSize: 15,
    fontWeight: 800,
  },
  handoverLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    marginLeft: 4,
    color: 'var(--text-primary)',
    fontSize: 13,
    fontWeight: 750,
  },
  handoverInput: {
    width: '100%',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: 8,
    padding: '18px 0',
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: 'var(--border)',
    color: 'var(--text-primary)',
    fontVariantNumeric: 'tabular-nums',
    outline: 'none',
    background: 'var(--surface)',
  },
  handoverHelp: {
    fontSize: 12,
    color: 'var(--text-light)',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: 600,
  },
};

export default RentalsScreen;
