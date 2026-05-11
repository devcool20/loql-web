'use client';

import React, { useEffect, useState } from 'react';
import { Ban, Check, ChevronLeft, MessageCircle, Share2, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { createNotification } from '@/lib/notificationManager';
import UserProfileModal from '../modals/UserProfileModal';
import { getSafeImageUrl } from '@/lib/imageUtils';
import SmartImage from '@/components/app/SmartImage';
import { assertGeofenceAllowed, createOfferGeofenced } from '@/lib/geofence';
import { cacheInvalidate, CACHE_KEYS } from '@/lib/cache';

const ItemDetailScreen = () => {
  const {
    user,
    selectedItem: item,
    closeStack,
    showAlert,
    openChat,
    setPermission,
    setCoords,
    refreshGeofence,
    setCurrentTab,
    setRentalsMode,
    refreshApp,
  } = useStore();
  const [owner, setOwner] = useState<any>(null);
  const [loadingOwner, setLoadingOwner] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [activeRental, setActiveRental] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showOwnerProfile, setShowOwnerProfile] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerHours, setOfferHours] = useState('24');

  const isOwner = user?.id === item?.owner_id;

  useEffect(() => {
    if (!item) return;
    checkActiveRental();
    if (!isOwner) fetchOwnerDetails();
    else fetchItemRequests();
  }, [item?.id]);

  const fetchOwnerDetails = async () => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', item.owner_id).single();
      if (data) setOwner(data);
    } catch (e) { console.log('Error:', e); }
    finally { setLoadingOwner(false); }
  };

  const fetchItemRequests = async () => {
    try {
      const { data: offersData, error } = await supabase
        .from('offers').select('*').eq('item_id', item.id)
        .neq('status', 'declined').order('created_at', { ascending: false });
      if (error) throw error;
      if (offersData && offersData.length > 0) {
        const senderIds = [...new Set(offersData.map((o: any) => o.sender_id))];
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', senderIds);
        const enriched = offersData.map((o: any) => ({
          ...o, renter: profiles?.find((p: any) => p.id === o.sender_id),
        }));
        setRequests(enriched.filter((o: any) => ['pending', 'countered', 'accepted'].includes(o.status)));
      }
    } catch (e: any) { console.error(e); }
  };

  const checkActiveRental = async () => {
    try {
      const { data: rental } = await supabase.from('rentals').select('*').eq('item_id', item.id).eq('status', 'active').maybeSingle();
      if (rental) {
        const { data: renterProfile } = await supabase.from('profiles').select('*').eq('id', rental.renter_id).single();
        setActiveRental({ ...rental, renter: renterProfile });
      }
    } catch (e) { console.error(e); }
  };

  const invalidateItemFlowCaches = async () => {
    if (!user?.id) return;
    await Promise.all([
      cacheInvalidate(CACHE_KEYS.offers(user.id)),
      cacheInvalidate(CACHE_KEYS.listings(user.id)),
      item?.society_id ? cacheInvalidate(CACHE_KEYS.homeItems(item.society_id)) : Promise.resolve(),
    ]);
    refreshApp();
  };

  const openOfferSheet = () => {
    setOfferPrice(String(item?.daily_rate || ''));
    setOfferHours('24');
    setShowOfferModal(true);
  };

  const handleSendOffer = async () => {
    if (requesting) return;

    const finalPrice = Number(offerPrice || item?.daily_rate);
    const finalHours = Number(offerHours || 24);

    if (!Number.isFinite(finalPrice) || finalPrice <= 0) {
      showAlert('Add a valid price', 'Enter a fair daily price before sending your offer.', 'error');
      return;
    }

    if (!Number.isFinite(finalHours) || finalHours < 1) {
      showAlert('Add a valid duration', 'Duration should be at least 1 hour.', 'error');
      return;
    }

    setRequesting(true);
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

      const data = await createOfferGeofenced({
        senderId: user.id,
        receiverId: item.owner_id,
        itemId: item.id,
        offeredPrice: finalPrice,
        durationHours: finalHours,
        coords,
      });
      if (data) {
        const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.raw_user_meta_data?.full_name || 'Someone';
        const finalName = userName === 'undefined' ? 'Someone' : userName;

        await createNotification({
          user_id: item.owner_id,
          title: 'New Offer Received',
          message: `${finalName} offered \u20B9${finalPrice} for ${item.title}.`,
          type: 'offer_request', related_user_id: user.id, related_rental_id: data.id,
          action_buttons: ['accept', 'decline'],
        });
      }
      await invalidateItemFlowCaches();
      setShowOfferModal(false);
      setRentalsMode('borrowing');
      setCurrentTab('Rentals');
      showAlert('Offer Sent', 'The owner has been notified. Track it from Kiraye Par.', 'success');
    } catch (error: any) {
      showAlert('Error', error.message, 'error');
    } finally { setRequesting(false); }
  };

  const handleOwnerRequestDecision = async (request: any, nextStatus: 'accepted' | 'declined') => {
    if (requesting) return;
    setRequesting(true);

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

      const { error } = await supabase.from('offers').update({ status: nextStatus }).eq('id', request.id);
      if (error) throw error;

      await createNotification({
        user_id: request.sender_id,
        title: nextStatus === 'accepted' ? 'Offer Accepted' : 'Offer Declined',
        message: nextStatus === 'accepted'
          ? `Your offer for ${item.title} was accepted. Use handover code ${request.id.slice(-6).toUpperCase()} to start the rental.`
          : `Your offer for ${item.title} was declined.`,
        type: nextStatus === 'accepted' ? 'offer_accepted' : 'offer_declined',
        related_user_id: user.id,
        related_rental_id: request.id,
      });

      await invalidateItemFlowCaches();
      await fetchItemRequests();
      showAlert(
        nextStatus === 'accepted' ? 'Request Accepted' : 'Request Declined',
        nextStatus === 'accepted' ? 'The borrower can now pay using the handover code.' : 'The borrower has been notified.',
        'success',
      );
    } catch (error: any) {
      showAlert('Error', error.message, 'error');
    } finally {
      setRequesting(false);
    }
  };

  const handleDeleteOwnedItem = () => {
    showAlert('Delete Item', `Remove "${item.title}" from Mera Samaan?`, 'info', undefined, false, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('items').delete().eq('id', item.id).eq('owner_id', user.id);
            if (error) throw error;
            await invalidateItemFlowCaches();
            closeStack();
          } catch (error: any) {
            showAlert('Error', error.message, 'error');
          }
        },
      },
    ]);
  };

  if (!item) return null;

  const images = item.images || [];
  const isRented = !!activeRental;

  return (
    <div className="item-detail-screen" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--surface)', zIndex: 200, overflowY: 'auto',
    }}>
      {/* Floating Header */}
      <div className="item-detail-floating-header" style={{
        position: 'fixed', top: 16, left: 16, right: 16, zIndex: 20,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <button className="scale-pressable" onClick={closeStack}
          style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--overlay-btn-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <ChevronLeft size={24} color="var(--text-primary)" />
        </button>
        <button
          className="scale-pressable"
          onClick={isOwner ? handleDeleteOwnedItem : undefined}
          aria-label={isOwner ? 'Delete item' : 'Share item'}
          style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--overlay-btn-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {isOwner ? <Trash2 size={20} color="#EF4444" /> : <Share2 size={24} color="var(--text-primary)" />}
        </button>
      </div>

      {/* Image Carousel */}
      <div className="item-detail-image-stage" style={{ width: '100%', height: 400, position: 'relative', overflow: 'hidden', background: 'var(--img-placeholder)' }}>
        {images.length > 0 ? (
          <div style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', width: '100%', height: '100%' }}
            onScroll={(e) => {
              const el = e.target as HTMLDivElement;
              setActiveIndex(Math.round(el.scrollLeft / el.offsetWidth));
            }}>
            {images.map((imgUri: string, idx: number) => (
              <SmartImage
                key={idx}
                src={getSafeImageUrl(imgUri)}
                alt={item.title || 'Item image'}
                fallbackLabel={item.title}
                loading={idx === 0 ? 'eager' : 'lazy'}
                fetchPriority={idx === 0 ? 'high' : 'auto'}
                onClick={() => setFullScreenImage(imgUri)}
                containerStyle={{ width: '100%', height: '100%', flexShrink: 0, scrollSnapAlign: 'start', cursor: 'pointer' }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ))}
          </div>
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--img-placeholder)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)' }}>No Image</div>
        )}
        {images.length > 1 && (
          <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
            {images.map((_: any, i: number) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: 4, background: i === activeIndex ? 'white' : 'rgba(255,255,255,0.5)' }} />
            ))}
          </div>
        )}
      </div>

      {/* Content Card */}
      <div className="item-detail-content-card" style={{
        background: 'var(--surface)', borderRadius: '32px 32px 0 0', padding: 24,
        marginTop: -40, position: 'relative', minHeight: 400,
        boxShadow: '0 -3px 8px rgba(0,0,0,0.1)', paddingBottom: 100,
      }}>
        <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 20px' }} />
        <h1 className="item-detail-title" style={{ fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.2 }}>{item.title}</h1>
        <p className="item-detail-rate" style={{ fontSize: 18, fontWeight: 600, color: 'var(--secondary)', marginBottom: 24 }}>₹{item.daily_rate}/day</p>

        <div style={{ height: 1, background: 'var(--border-light)', margin: '0 0 24px' }} />

        {/* Availability */}
        <h3 className="item-detail-section-title" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>AVAILABILITY</h3>
        <div className="item-detail-info-card" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 16, background: 'var(--surface-alt)', borderRadius: 16, border: '1px solid var(--border-light)', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isRented ? (
              activeRental.renter?.avatar_url ? (
                <SmartImage src={getSafeImageUrl(activeRental.renter.avatar_url)} alt="" fallbackLabel={activeRental.renter?.full_name} rounded={24} style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--accent-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-solid-text)', fontSize: 18, fontWeight: 700 }}>{activeRental.renter?.full_name?.[0] || 'N'}</div>
              )
            ) : (
              <div style={{ width: 48, height: 48, borderRadius: 24, background: '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 12, height: 12, borderRadius: 6, background: '#10B981' }} />
              </div>
            )}
            <div>
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 2 }}>
                {isRented ? `Currently with ${activeRental.renter?.full_name?.split(' ')[0] || 'Neighbor'}` : 'Currently Available'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>
                {isRented ? `Available from ${new Date(activeRental.end_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}` : 'Ready to rent instantly'}
              </span>
            </div>
          </div>
          <span style={{
            padding: '6px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface)',
            fontSize: 12, fontWeight: 600, color: isRented ? 'var(--text-secondary)' : 'var(--text-primary)',
          }}>{isRented ? 'Busy' : 'Available'}</span>
        </div>

        <div className="item-detail-quote" style={{ background: '#FFF9E6', borderRadius: 16, padding: '14px 16px', marginBottom: 20, border: '1px solid rgba(141,153,174,0.2)' }}>
          <span style={{ fontStyle: 'normal', fontSize: 20, lineHeight: 1.5, color: 'var(--text-primary)', opacity: 0.9 }}>
            "{item.description?.trim() || `This ${item.category?.toLowerCase() || 'item'} has helped many neighbors and is ready for its next story.`}"
          </span>
        </div>

        {/* Description */}
        <h3 className="item-detail-section-title" style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Katha</h3>
        <p className="item-detail-body" style={{ fontSize: 15, color: 'var(--text-subtle)', lineHeight: 1.6, marginBottom: 24 }}>
          Professional grade {item.category?.toLowerCase() || 'item'} suitable for your daily needs. Well maintained and ready for use.
        </p>

        {/* Owner/Renter Split View */}
        {isOwner ? (
          <div style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
              {activeRental ? 'Current Rental' : `Interested People (${requests.length})`}
            </h3>
            {requests.length === 0 && !activeRental && (
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: 20 }}>No requests yet.</p>
            )}
            {requests.map((req) => (
              <div key={req.id} style={{
                display: 'grid', gap: 12,
                padding: 14, background: 'var(--surface-alt)', borderRadius: 18, marginBottom: 12, border: '1px solid var(--border-light)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {req.renter?.avatar_url ? (
                    <img src={getSafeImageUrl(req.renter.avatar_url)} alt="" style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--border)', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--accent-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-solid-text)', fontSize: 14, fontWeight: 700 }}>{req.renter?.full_name?.[0] || 'N'}</div>
                  )}
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>{req.renter?.full_name || 'Neighbor'}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-subtle)', fontWeight: 600 }}>
                      Offer: ₹{req.offered_price} ({req.duration_hours}h) • {req.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                <button className="scale-pressable" onClick={() => openChat({ ...req.renter, id: req.sender_id })}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--muted)', padding: '6px 12px', borderRadius: 20 }}>
                  <MessageCircle size={16} color="var(--text-primary)" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Chat</span>
                </button>
                {req.status === 'accepted' && (
                  <div style={{ padding: '10px 12px', borderRadius: 14, background: 'rgba(16,185,129,0.1)', color: '#047857', fontSize: 12, fontWeight: 700 }}>
                    Handover code: {req.id.slice(-6).toUpperCase()}
                  </div>
                )}
                {req.status === 'pending' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <button
                      className="scale-pressable"
                      onClick={() => handleOwnerRequestDecision(req, 'accepted')}
                      disabled={requesting}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'var(--accent-solid)', color: 'var(--accent-solid-text)', padding: '10px 12px', borderRadius: 14, fontSize: 12, fontWeight: 750 }}
                    >
                      <Check size={14} />
                      Accept
                    </button>
                    <button
                      className="scale-pressable"
                      onClick={() => handleOwnerRequestDecision(req, 'declined')}
                      disabled={requesting}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'var(--surface)', border: '1px solid var(--border-light)', color: '#DC2626', padding: '10px 12px', borderRadius: 14, fontSize: 12, fontWeight: 750 }}
                    >
                      <Ban size={14} />
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Owner Card */}
            <div className="item-detail-info-card item-detail-owner-card scale-pressable" onClick={() => !loadingOwner && owner && setShowOwnerProfile(true)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 16, background: 'var(--surface-alt)', borderRadius: 16, border: '1px solid var(--border-light)', cursor: 'pointer',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {owner?.avatar_url ? (
                  <img src={getSafeImageUrl(owner.avatar_url)} alt="" style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--border)', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--accent-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-solid-text)', fontSize: 18, fontWeight: 700 }}>{owner?.full_name?.[0] || 'N'}</div>
                )}
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                    {loadingOwner ? 'Loading...' : `Owned by ${owner?.full_name || 'Neighbor'}`}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>★ 4.8</span>
                </div>
              </div>
              <button className="scale-pressable" onClick={(e) => { e.stopPropagation(); if (owner) openChat(owner); }}
                style={{ padding: '8px 16px', background: 'var(--muted)', borderRadius: 20, fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>Chat</button>
            </div>

            {/* Footer */}
            <div className="item-detail-borrow-footer" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border-light)',
            }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block' }}>Total for 1 day</span>
                <span className="item-detail-total" style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>₹{item.daily_rate}</span>
              </div>
              <button className="item-detail-borrow-button scale-pressable" onClick={openOfferSheet} disabled={requesting}
                style={{ background: 'var(--primary)', padding: '16px 32px', borderRadius: 999, color: 'white', fontWeight: 700, fontSize: 16, boxShadow: 'var(--warm-glow)' }}>
                Borrow with Love
              </button>
            </div>
          </>
        )}
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="alert-overlay" onClick={() => setShowOfferModal(false)}>
          <div className="alert-card" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left', maxWidth: 400 }}>
            <h3 style={{ fontSize: 22, fontWeight: 650, marginBottom: 6, color: 'var(--text-primary)' }}>Samvaad for {item.title}</h3>
            <p style={{ margin: '0 0 18px', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.45 }}>Send a clear offer. The owner will accept or decline from Mera Samaan.</p>
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Price per day (₹)</label>
              <input className="text-input" type="number" placeholder={`${item.daily_rate}`} value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', width: '100%' }} />
            </div>
            <div className="input-group" style={{ marginBottom: 24 }}>
              <label className="input-label">Duration (hours)</label>
              <input className="text-input" type="number" placeholder="24" value={offerHours}
                onChange={(e) => setOfferHours(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="alert-btn alert-btn-cancel" onClick={() => setShowOfferModal(false)}>Cancel</button>
              <button className="alert-btn alert-btn-primary" onClick={handleSendOffer} disabled={requesting}>
                {requesting ? <div className="spinner" /> : 'Send Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Image */}
      {fullScreenImage && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'black', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setFullScreenImage(null)} style={{ position: 'absolute', top: 50, right: 20, padding: 8, borderRadius: 20, background: 'rgba(0,0,0,0.5)', zIndex: 20 }}>
            <X color="white" size={30} />
          </button>
          <img src={getSafeImageUrl(fullScreenImage)} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      )}

      {/* User Profile Modal */}
      {showOwnerProfile && owner && (
        <UserProfileModal
          visible={showOwnerProfile}
          userId={owner.id}
          user={owner}
          onClose={() => setShowOwnerProfile(false)}
        />
      )}
    </div>
  );
};

export default ItemDetailScreen;
