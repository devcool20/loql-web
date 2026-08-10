'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, User, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { cacheInvalidate, CACHE_KEYS } from '@/lib/cache';
import { getSafeImageUrl } from '@/lib/imageUtils';
import { resizeImageFile } from '@/lib/clientImage';
import SmartImage from '@/components/app/SmartImage';
import AppTopBar from '@/components/app/AppTopBar';
import AppPageIntro from '@/components/app/AppPageIntro';

const EditProfileScreen = () => {
  const { user, setUser, showAlert, closeStack } = useStore();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.user_metadata?.avatar_url || null);
  const [newAvatarData, setNewAvatarData] = useState<string | null>(null);
  const [selectedSociety, setSelectedSociety] = useState<string | null>(null);
  const [societies, setSocieties] = useState<any[]>([]);
  const [showSocietyDropdown, setShowSocietyDropdown] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSocieties();
    fetchCurrentSociety();
  }, []);

  const fetchSocieties = async () => {
    try {
      const { data } = await supabase.from('societies').select('*').order('name');
      setSocieties(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchCurrentSociety = async () => {
    try {
      const { data } = await supabase.from('profiles').select('society_id, phone').eq('id', user.id).single();
      if (data?.society_id) setSelectedSociety(data.society_id);
      if (data?.phone) setPhoneNumber(data.phone);
    } catch (e) { console.error(e); }
  };

  const handleSelectImage = () => { fileInputRef.current?.click(); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await resizeImageFile(file, { maxSize: 900, quality: 0.76 });
    setAvatarUri(result);
    setNewAvatarData(result);
    e.target.value = '';
  };

  const handleDeleteAvatar = () => {
    setAvatarUri(null);
    setNewAvatarData(null);
  };

  const handleSave = async () => {
    if (!fullName.trim()) { showAlert('Error', 'Name cannot be empty', 'error'); return; }
    setLoading(true);
    try {
      let publicUrl = avatarUri;

      if (newAvatarData?.startsWith('data:')) {
        const base64Data = newAvatarData.split(',')[1];
        const mimeType = newAvatarData.split(';')[0].split(':')[1];
        const ext = mimeType.split('/')[1] || 'jpg';
        const fileName = `${user.id}/avatar_${Date.now()}.${ext}`;

        const byteChars = atob(base64Data);
        const byteArray = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteArray[i] = byteChars.charCodeAt(i);

        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, byteArray, { contentType: mimeType, upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          publicUrl = urlData.publicUrl;
        }
      }

      const { data: currentProfile } = await supabase.from('profiles').select('society_id').eq('id', user.id).single();
      const societyChanged = currentProfile?.society_id !== selectedSociety;

      const { error: dbError } = await supabase.from('profiles').update({
        full_name: fullName, avatar_url: publicUrl, society_id: selectedSociety,
        phone: phoneNumber.trim() || null,
      }).eq('id', user.id);
      if (dbError) throw dbError;

      const { data: { user: updatedUser }, error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: publicUrl },
      });
      if (authError) throw authError;
      if (updatedUser) setUser(updatedUser);
      else setUser({ ...user, user_metadata: { ...user.user_metadata, full_name: fullName, avatar_url: publicUrl } });

      if (societyChanged) {
        if (currentProfile?.society_id) {
          cacheInvalidate(CACHE_KEYS.homeItems(currentProfile.society_id));
          cacheInvalidate(CACHE_KEYS.societyName(currentProfile.society_id));
        }
        if (selectedSociety) {
          cacheInvalidate(CACHE_KEYS.homeItems(selectedSociety));
          cacheInvalidate(CACHE_KEYS.societyName(selectedSociety));
        }
        cacheInvalidate(CACHE_KEYS.listings(user.id));
        showAlert('Success', 'Profile updated! Loading your new society items...', 'success', closeStack);
      } else {
        showAlert('Success', 'Profile updated successfully!', 'success', closeStack);
      }
    } catch (error: any) {
      showAlert('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    showAlert('Delete Account', 'Are you sure? This action is irreversible.', 'error', async () => {
      setLoading(true);
      try {
        const { error } = await supabase.rpc('delete_own_account');
        if (error) throw error;
        await supabase.auth.signOut();
        setUser(null);
      } catch (error: any) {
        showAlert('Error', 'Failed to delete: ' + error.message, 'error');
        setLoading(false);
      }
    }, true);
  };

  return (
    <div className="utility-screen edit-profile-screen" style={{ width: '100%', minHeight: '100%', background: 'var(--background)' }}>
      <AppTopBar onBack={closeStack} title="Edit profile" textAction={{ label: loading ? 'Saving…' : 'Save', onClick: handleSave, disabled: loading }} />
      <div className="utility-content edit-profile-content" style={{ padding: 24, paddingBottom: 120 }}>
        <AppPageIntro eyebrow="Personal details" title="Keep your identity current." description="A recognisable profile makes every handover easier." compact />
        {/* Avatar */}
        <div className="edit-profile-avatar-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div onClick={handleSelectImage} className="scale-pressable"
            style={{ position: 'relative', cursor: 'pointer', marginBottom: 12 }}>
            {avatarUri ? (
              <SmartImage src={getSafeImageUrl(avatarUri)} alt={fullName || 'Profile'} fallbackLabel={fullName} rounded={50} style={{ width: 100, height: 100, borderRadius: 50, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 100, height: 100, borderRadius: 50, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={40} color="var(--text-light)" />
              </div>
            )}
            <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--accent-solid)', padding: 8, borderRadius: 20, border: '2px solid var(--surface)' }}>
              <Camera size={16} color="white" />
            </div>
          </div>
          {avatarUri && (
            <button className="scale-pressable" onClick={handleDeleteAvatar}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'var(--muted)', border: '1px solid var(--border)' }}>
              <Trash2 size={14} color="var(--text-subtle)" />
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-subtle)' }}>Remove Photo</span>
            </button>
          )}
          <span style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, marginTop: 8 }}>
            {avatarUri ? 'Tap to change photo' : 'Add a profile photo'}
          </span>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

        {/* Full Name */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-label)', marginBottom: 8, display: 'block', marginLeft: 4 }}>Full Name</label>
          <input style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', fontSize: 16, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none' }}
            value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        {/* Email (Read Only) */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-label)', marginBottom: 8, display: 'block', marginLeft: 4 }}>Email Address</label>
          <input style={{ width: '100%', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', fontSize: 16, color: 'var(--text-light)', fontFamily: 'inherit', outline: 'none' }}
            value={user?.email || ''} readOnly placeholder="No email linked" />
        </div>

        {/* Phone */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-label)', marginBottom: 8, display: 'block', marginLeft: 4 }}>Phone Number</label>
          <input style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', fontSize: 16, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none' }}
            type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="Enter phone number" />
        </div>

        {/* Society Selection */}
        <div style={{ marginBottom: 32, position: 'relative' }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-label)', marginBottom: 8, display: 'block', marginLeft: 4 }}>Society</label>
          <div onClick={() => setShowSocietyDropdown(!showSocietyDropdown)}
            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', cursor: 'pointer' }}>
            <span style={{ color: selectedSociety ? 'var(--text-primary)' : 'var(--text-light)' }}>
              {selectedSociety ? societies.find(s => s.id === selectedSociety)?.name : 'Select your society'}
            </span>
          </div>
          {showSocietyDropdown && (
            <div style={{
              position: 'absolute', top: 80, left: 0, right: 0, background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 12, zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: 200, overflowY: 'auto',
            }}>
              {societies.map((s) => (
                <div key={s.id} onClick={() => { setSelectedSociety(s.id); setShowSocietyDropdown(false); }}
                  style={{ padding: 16, borderBottom: '1px solid var(--border-light)', cursor: 'pointer', fontSize: 16, color: 'var(--text-primary)' }}
                  className="scale-pressable">
                  {s.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="society-note"><strong>Neighbourhood</strong><span>Changing society resets your feed. Location verification will run again.</span></div>

        {/* Delete Account */}
        <button className="scale-pressable" onClick={handleDeleteAccount} disabled={loading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: 16, borderRadius: 16, border: '1px solid var(--border)', background: 'var(--muted)',
          }}>
          <Trash2 size={20} color="var(--text-subtle)" />
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-subtle)' }}>Delete Account</span>
        </button>
      </div>
    </div>
  );
};

export default EditProfileScreen;
