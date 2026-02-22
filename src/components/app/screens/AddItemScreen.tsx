'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Camera, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { cacheInvalidate, CACHE_KEYS } from '@/lib/cache';

const CATEGORIES = ['DIY Tools', 'Party', 'Gaming', 'Fitness', 'Electronics', 'Kitchen', 'Other'];

const AddItemScreen = () => {
  const { user, closeStack, showAlert, refreshApp } = useStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [marketPrice, setMarketPrice] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [userSocietyId, setUserSocietyId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchUserSociety(); }, []);

  const fetchUserSociety = async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase.from('profiles').select('society_id').eq('id', user.id).single();
      if (data?.society_id) setUserSocietyId(data.society_id);
    } catch (e) { console.error(e); }
  };

  const handleSelectImages = () => { fileInputRef.current?.click(); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => { setImages(prev => [...prev, reader.result as string]); };
      reader.readAsDataURL(file);
    });
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

      const { error } = await supabase.from('items').insert({
        title: title.trim(), description: description.trim(),
        daily_rate: Number(dailyRate), market_price: marketPrice ? Number(marketPrice) : null,
        category, images: uploadedUrls, owner_id: user.id, society_id: userSocietyId, status: 'available',
      });

      if (error) throw error;
      
      // Clear caches so the new item shows immediately
      cacheInvalidate(CACHE_KEYS.listings(user.id));
      if (userSocietyId) {
        cacheInvalidate(CACHE_KEYS.homeItems(userSocietyId));
      }

      refreshApp(); // force reload on home feed
      // Close the modal and let the UI refresh cleanly
      showAlert('Success!', 'Your item has been listed.', 'success', closeStack);
    } catch (e: any) {
      showAlert('Error', e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: '#FFFFFF', zIndex: 200, overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #F3F4F6', gap: 12 }}>
        <button className="scale-pressable" onClick={closeStack}
          style={{ padding: 8, borderRadius: 20, background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <ChevronLeft size={24} color="#111827" />
        </button>
        <span style={{ flex: 1, fontSize: 17, fontWeight: 700, color: '#111827' }}>Add Item</span>
      </div>

      <div style={{ padding: 24, paddingBottom: 100 }}>
        {/* Images */}
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', marginBottom: 24, paddingBottom: 4 }}>
          <button className="scale-pressable" onClick={handleSelectImages}
            style={{
              width: 100, height: 100, borderRadius: 16, border: '2px dashed #E5E7EB', background: '#F9FAFB',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, flexShrink: 0,
            }}>
            <Camera size={24} color="#9CA3AF" />
            <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>Add Photo</span>
          </button>
          {images.map((img, idx) => (
            <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
              <img src={img} alt="" style={{ width: 100, height: 100, borderRadius: 16, objectFit: 'cover' }} />
              <button onClick={() => removeImage(idx)}
                style={{ position: 'absolute', top: -8, right: -8, width: 24, height: 24, borderRadius: 12, background: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} color="white" />
              </button>
            </div>
          ))}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />

        {/* Title */}
        <div className="input-group" style={{ marginBottom: 20 }}>
          <label className="input-label">Title *</label>
          <input className="text-input" placeholder="What are you listing?" value={title}
            onChange={(e) => setTitle(e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', width: '100%', background: '#F9FAFB' }} />
        </div>

        {/* Description */}
        <div className="input-group" style={{ marginBottom: 20 }}>
          <label className="input-label">Description</label>
          <textarea placeholder="Add a description..." value={description} onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', background: '#F9FAFB', fontSize: 16, fontFamily: 'inherit', minHeight: 100, resize: 'vertical', outline: 'none' }} />
        </div>

        {/* Market Price → Auto Daily Rate */}
        <div className="input-group" style={{ marginBottom: 20 }}>
          <label className="input-label">Market Price (₹)</label>
          <input className="text-input" type="number" placeholder="Enter original price" value={marketPrice}
            onChange={(e) => handleMarketPriceChange(e.target.value)}
            style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', width: '100%', background: '#F9FAFB' }} />
        </div>

        <div className="input-group" style={{ marginBottom: 20 }}>
          <label className="input-label">Daily Rate (₹) *</label>
          <input className="text-input" type="number" placeholder="Auto-calculated" value={dailyRate}
            onChange={(e) => setDailyRate(e.target.value)}
            style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', width: '100%', background: '#F9FAFB' }} />
        </div>

        {/* Category */}
        <div className="input-group" style={{ marginBottom: 32 }}>
          <label className="input-label">Category *</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <button key={cat} className="scale-pressable" onClick={() => setCategory(cat)}
                style={{
                  padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${category === cat ? '#111827' : '#E5E7EB'}`,
                  background: category === cat ? '#111827' : '#FFFFFF', color: category === cat ? 'white' : '#6B7280',
                  fontSize: 13, fontWeight: 500,
                }}>{cat}</button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button className="login-btn scale-pressable" onClick={handleSubmit} disabled={loading}
          style={{ borderRadius: 16 }}>
          {loading ? <div className="spinner" /> : 'List Item'}
        </button>
      </div>
    </div>
  );
};

export default AddItemScreen;
