'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, Check, ChevronLeft, FileText, ImagePlus, Loader2, Package, Tag, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { cacheInvalidate, CACHE_KEYS } from '@/lib/cache';
import { assertGeofenceAllowed, createItemGeofenced } from '@/lib/geofence';
import { resizeImageFile } from '@/lib/clientImage';
import SmartImage from '@/components/app/SmartImage';

const CATEGORIES = ['DIY Tools', 'Party', 'Gaming', 'Fitness', 'Electronics', 'Kitchen', 'Other'];

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
};

const AddItemScreen = () => {
  const { user, closeStack, showAlert, refreshApp, setPermission, setCoords, refreshGeofence } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [userSocietyId, setUserSocietyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUserSociety = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase.from('profiles').select('society_id').eq('id', user.id).single();
      if (data?.society_id) setUserSocietyId(data.society_id);
    } catch (e) { console.error(e); }
  }, [user?.id]);

  useEffect(() => { fetchUserSociety(); }, [fetchUserSociety]);

  const handleSelectImages = () => { fileInputRef.current?.click(); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const processed = await Promise.all(Array.from(files).map(file => resizeImageFile(file)));
    setImages(prev => [...prev, ...processed]);
    e.target.value = '';
  };

  const removeImage = (index: number) => { setImages(prev => prev.filter((_, i) => i !== index)); };

  const handleMarketPriceChange = (val: string) => {
    setMarketPrice(val);
    if (val) {
      const mp = Number(val);
      if (mp <= 500) setDailyRate(Math.round(mp * 0.10).toString());
      else if (mp <= 2000) setDailyRate(Math.round(mp * 0.08).toString());
      else if (mp <= 5000) setDailyRate(Math.round(mp * 0.06).toString());
      else setDailyRate(Math.round(mp * 0.04).toString());
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) { showAlert('Required', 'Please add a title', 'error'); return; }
    if (!dailyRate) { showAlert('Required', 'Please set a daily rate', 'error'); return; }
    if (!category) { showAlert('Required', 'Please select a category', 'error'); return; }
    if (!userSocietyId) { showAlert('Error', 'Society not found', 'error'); return; }

    setLoading(true);
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

      const uploadedUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.startsWith('data:')) {
          const base64Data = img.split(',')[1];
          const mimeType = img.split(';')[0].split(':')[1];
          const ext = mimeType.split('/')[1] || 'jpg';
          const fileName = `${user.id}/${Date.now()}_${i}.${ext}`;

          const byteCharacters = atob(base64Data);
          const byteArray = new Uint8Array(byteCharacters.length);
          for (let j = 0; j < byteCharacters.length; j++) byteArray[j] = byteCharacters.charCodeAt(j);

          const { error: uploadError } = await supabase.storage.from('item-images').upload(fileName, byteArray, { contentType: mimeType, upsert: true });
          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('item-images').getPublicUrl(fileName);
            uploadedUrls.push(urlData.publicUrl);
          } else {
            console.error('Upload Error:', uploadError);
            showAlert('Upload Warning', `Image ${i + 1} failed: ` + uploadError.message, 'error');
          }
        }
      }

      await createItemGeofenced({
        userId: user.id,
        title: title.trim(),
        description: description.trim(),
        dailyRate: Number(dailyRate),
        marketPrice: marketPrice ? Number(marketPrice) : null,
        category,
        images: uploadedUrls,
        coords,
      });

      cacheInvalidate(CACHE_KEYS.listings(user.id));
      if (userSocietyId) {
        cacheInvalidate(CACHE_KEYS.homeItems(userSocietyId));
      }

      refreshApp();
      showAlert('Success!', 'Your item has been listed.', 'success', closeStack);
    } catch (e: unknown) {
      showAlert('Error', getErrorMessage(e), 'error');
    } finally {
      setLoading(false);
    }
  };

  const estimatedRateLabel = dailyRate ? `Rs ${dailyRate}/day` : 'Auto-calculates from market price';

  return (
    <motion.div
      className="add-item-screen"
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="add-item-topbar">
        <motion.button
          type="button"
          className="add-item-back"
          onClick={closeStack}
          whileTap={{ scale: 0.92 }}
          aria-label="Go back"
        >
          <ChevronLeft size={22} />
        </motion.button>
        <div className="add-item-heading">
          <h1>Naya Samaan</h1>
          <p>List something useful for neighbors to borrow.</p>
        </div>
      </div>

      <div className="add-item-content">
        <section className="add-item-card add-item-photo-card">
          <div className="add-item-section-title">
            <span><ImagePlus size={16} /> Photos</span>
            <small>{images.length}/6</small>
          </div>

          <div className="add-item-image-row">
            <motion.button
              type="button"
              className="add-item-photo-drop"
              onClick={handleSelectImages}
              whileTap={{ scale: 0.97 }}
            >
              <span className="add-item-photo-icon"><Camera size={22} /></span>
              <strong>Add photo</strong>
              <small>Tap to upload</small>
            </motion.button>

            {images.map((img, idx) => (
              <motion.div
                key={`${img}-${idx}`}
                className="add-item-image-preview"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.22 }}
              >
                <SmartImage
                  src={img}
                  alt=""
                  fallbackLabel={title || 'Item'}
                  rounded={18}
                  style={{ width: '100%', height: '100%', borderRadius: 18, objectFit: 'cover' }}
                />
                <motion.button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="add-item-remove-image"
                  whileTap={{ scale: 0.9 }}
                  aria-label="Remove image"
                >
                  <X size={13} />
                </motion.button>
              </motion.div>
            ))}
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
        </section>

        <section className="add-item-card add-item-form-card">
          <label className="add-item-field">
            <span className="add-item-label"><Package size={14} /> Item name *</span>
            <input
              className={`add-item-input ${focusedField === 'title' ? 'is-focused' : ''}`}
              placeholder="What are you listing?"
              value={title}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="add-item-field">
            <span className="add-item-label"><FileText size={14} /> Description</span>
            <textarea
              className={`add-item-textarea ${focusedField === 'description' ? 'is-focused' : ''}`}
              placeholder="Condition, pickup notes, accessories included..."
              value={description}
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
        </section>

        <section className="add-item-card add-item-price-card">
          <div className="add-item-section-title">
            <span><Tag size={16} /> Pricing</span>
            <small>{estimatedRateLabel}</small>
          </div>

          <div className="add-item-price-grid">
            <label className="add-item-field">
              <span className="add-item-label">Market price</span>
              <input
                className={`add-item-input ${focusedField === 'marketPrice' ? 'is-focused' : ''}`}
                type="number"
                placeholder="Original price"
                value={marketPrice}
                onFocus={() => setFocusedField('marketPrice')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => handleMarketPriceChange(e.target.value)}
              />
            </label>

            <label className="add-item-field">
              <span className="add-item-label">Daily rate *</span>
              <input
                className={`add-item-input ${focusedField === 'dailyRate' ? 'is-focused' : ''}`}
                type="number"
                placeholder="Auto rate"
                value={dailyRate}
                onFocus={() => setFocusedField('dailyRate')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setDailyRate(e.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="add-item-card">
          <div className="add-item-section-title">
            <span>Category *</span>
          </div>
          <div className="add-item-category-grid">
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <motion.button
                  type="button"
                  key={cat}
                  className={`add-item-category ${active ? 'active' : ''}`}
                  onClick={() => setCategory(cat)}
                  whileTap={{ scale: 0.95 }}
                  layout
                >
                  {active && <Check size={13} />}
                  {cat}
                </motion.button>
              );
            })}
          </div>
        </section>

        <motion.button
          type="button"
          className="login-btn add-item-submit"
          onClick={handleSubmit}
          disabled={loading}
          whileTap={{ scale: 0.97 }}
        >
          {loading ? (
            <Loader2 size={18} className="auth-spin" />
          ) : (
            <>
              List item
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default AddItemScreen;
