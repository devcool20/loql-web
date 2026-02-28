'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, Share2, MapPin, MessageCircle, Clock, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { createNotification } from '@/lib/notificationManager';
import UserProfileModal from '../modals/UserProfileModal';
import { getSafeImageUrl } from '@/lib/imageUtils';

const ItemDetailScreen = () => {
  const { user, selectedItem: item, closeStack, showAlert, openChat } = useStore();
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

  const handleSendOffer = async () => {
    if (requesting || !offerPrice) return;
    setRequesting(true);
    try {
      const { data, error } = await supabase.from('offers').insert({
        item_id: item.id, sender_id: user.id, receiver_id: item.owner_id,
        offered_price: Number(offerPrice), duration_hours: Number(offerHours), status: 'pending',
      }).select().single();
      if (error) throw error;
      if (data) {
        const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.raw_user_meta_data?.full_name || 'Someone';
        const finalName = userName === 'undefined' ? 'Someone' : userName;

        await createNotification({
          user_id: item.owner_id,
          title: 'New Offer Received',
          message: `${finalName} offered ₹${offerPrice} for ${item.title}.`,
          type: 'offer_request', related_user_id: user.id, related_rental_id: data.id,
          action_buttons: ['accept', 'decline', 'counter'],
        });
      }
      setShowOfferModal(false);
      showAlert('Offer Sent', 'The owner has been notified of your offer.', 'success', closeStack);
    } catch (error: any) {
      showAlert('Error', error.message, 'error');
    } finally { setRequesting(false); }
  };

  if (!item) return null;

  const images = item.images || [];
  const isRented = !!activeRental;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'var(--surface)', zIndex: 200, overflowY: 'auto',
    }}>
      {/* Floating Header */}
      <div style={{
        position: 'fixed', top: 16, left: 16, right: 16, zIndex: 20,
        display: 'flex', justifyContent: 'space-between',
      }}>
        <button className="scale-pressable" onClick={closeStack}
          style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--overlay-btn-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <ChevronLeft size={24} color="var(--text-primary)" />
        </button>
        <button className="scale-pressable"
          style={{ width: 40, height: 40, borderRadius: 20, background: 'var(--overlay-btn-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Share2 size={24} color="var(--text-primary)" />
        </button>
      </div>

      {/* Image Carousel */}
      <div style={{ width: '100%', height: 400, position: 'relative', overflow: 'hidden', background: 'var(--img-placeholder)' }}>
        {images.length > 0 ? (
          <div style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', width: '100%', height: '100%' }}
            onScroll={(e) => {
              const el = e.target as HTMLDivElement;
              setActiveIndex(Math.round(el.scrollLeft / el.offsetWidth));
            }}>
            {images.map((imgUri: string, idx: number) => (
              <img key={idx} src={getSafeImageUrl(imgUri)} alt="" onClick={() => setFullScreenImage(imgUri)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', flexShrink: 0, scrollSnapAlign: 'start', cursor: 'pointer' }} />
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
      <div style={{
        background: 'var(--surface)', borderRadius: '32px 32px 0 0', padding: 24,
        marginTop: -40, position: 'relative', minHeight: 400,
        boxShadow: '0 -3px 8px rgba(0,0,0,0.1)', paddingBottom: 100,
      }}>
        <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 20px' }} />
        <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{item.title}</h1>
        <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 24 }}>₹{item.daily_rate}/day</p>

        <div style={{ height: 1, background: 'var(--border-light)', margin: '0 0 24px' }} />

        {/* Availability */}
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>AVAILABILITY</h3>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 16, background: 'var(--surface-alt)', borderRadius: 16, border: '1px solid var(--border-light)', marginBottom: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isRented ? (
              activeRental.renter?.avatar_url ? (
                <img src={getSafeImageUrl(activeRental.renter.avatar_url)} alt="" style={{ width: 48, height: 48, borderRadius: 24, background: 'var(--border)', objectFit: 'cover' }} />
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

        {/* Description */}
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Description</h3>
        <p style={{ fontSize: 15, color: 'var(--text-subtle)', lineHeight: 1.6, marginBottom: 24 }}>
          {item.description?.trim() || `Professional grade ${item.category?.toLowerCase() || 'item'} suitable for your daily needs. Well maintained and ready for use.`}
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
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: 12, background: 'var(--surface-alt)', borderRadius: 12, marginBottom: 12, border: '1px solid var(--border-light)',
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
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Owner Card */}
            <div className="scale-pressable" onClick={() => !loadingOwner && owner && setShowOwnerProfile(true)} style={{
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
              <button className="scale-pressable" onClick={(e) => { e.stopPropagation(); owner && openChat(owner); }}
                style={{ padding: '8px 16px', background: 'var(--muted)', borderRadius: 20, fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>Chat</button>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border-light)',
            }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block' }}>Total for 1 day</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>₹{item.daily_rate}</span>
              </div>
              <button className="scale-pressable" onClick={() => setShowOfferModal(true)} disabled={requesting}
                style={{ background: 'var(--accent-solid)', padding: '16px 32px', borderRadius: 16, color: 'var(--accent-solid-text)', fontWeight: 700, fontSize: 16 }}>
                Make Offer
              </button>
            </div>
          </>
        )}
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="alert-overlay" onClick={() => setShowOfferModal(false)}>
          <div className="alert-card" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'left', maxWidth: 400 }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Make Offer for {item.title}</h3>
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
              <button className="alert-btn alert-btn-primary" onClick={handleSendOffer}>
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
