'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';

interface ProfileCreationScreenProps {
  onComplete: () => void;
}

const ProfileCreationScreen = ({ onComplete }: ProfileCreationScreenProps) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedSociety, setSelectedSociety] = useState<string | null>(null);
  const [societies, setSocieties] = useState<any[]>([]);
  const [showSocietyDropdown, setShowSocietyDropdown] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, setUser, showAlert } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSocieties();
  }, []);

  const fetchSocieties = async () => {
    try {
      const { data, error } = await supabase
        .from('societies')
        .select('*')
        .order('name');

      if (error) throw error;
      setSocieties(data || []);
    } catch (e) {
      console.error('Error fetching societies:', e);
    }
  };

  const handleSelectImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUri(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!selectedSociety) {
      showAlert('Required', 'Please select your society', 'error');
      return;
    }

    if (!fullName.trim()) {
      showAlert('Required', 'Please enter your full name', 'error');
      return;
    }

    setLoading(true);
    try {
      if (!user) throw new Error('No authenticated user');

      let publicUrl = avatarUri;

      // Upload avatar if one was selected
      if (avatarUri && avatarUri.startsWith('data:')) {
        const base64Data = avatarUri.split(',')[1];
        const mimeType = avatarUri.split(';')[0].split(':')[1];
        const ext = mimeType.split('/')[1] || 'jpg';
        const fileName = `${user.id}/avatar.${ext}`;

        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, byteArray, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
          publicUrl = urlData.publicUrl;
        }
      }

      const finalPhone = user.phone || phoneNumber;

      const updates = {
        id: user.id,
        full_name: fullName,
        avatar_url: publicUrl,
        phone: finalPhone,
        email: user.email,
        society_id: selectedSociety,
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      const { data: { user: updatedUser }, error: updateError } = await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: publicUrl, phone: finalPhone },
      });

      if (updateError) throw updateError;

      if (updatedUser) {
        setUser(updatedUser);
      }

      showAlert('Welcome!', 'Your profile has been created.', 'success', onComplete);
    } catch (error: any) {
      showAlert('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-creation-screen animate-fade-in">
      <h1 className="profile-creation-title">Create Profile</h1>
      <p className="profile-creation-subtitle">Let&apos;s get to know you better</p>

      <div className="profile-creation-form">
        {/* Avatar */}
        <div className="avatar-picker">
          <div
            className="avatar-circle scale-pressable"
            onClick={handleSelectImage}
            style={{ position: 'relative' }}
          >
            {avatarUri ? (
              <img src={avatarUri} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <User size={40} color="#9CA3AF" />
            )}
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              background: '#111827',
              padding: 8,
              borderRadius: 20,
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Camera size={16} color="#FFFFFF" />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
        <p style={{ textAlign: 'center', color: '#6B7280', fontSize: 14, fontWeight: 500, marginBottom: 32 }}>
          Add Profile Photo (Optional)
        </p>

        {/* Full Name */}
        <div className="input-group">
          <label className="input-label">Full Name</label>
          <div className="icon-input">
            <input
              className="text-input"
              placeholder="Alex Johnson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        </div>

        {/* Phone */}
        <div className="input-group">
          <label className="input-label">Phone Number {user?.phone ? '' : '(Optional)'}</label>
          <div className="icon-input">
            <input
              className="text-input"
              placeholder={user?.phone || 'Add phone number'}
              value={user?.phone || phoneNumber}
              onChange={(e) => !user?.phone && setPhoneNumber(e.target.value)}
              disabled={!!user?.phone}
              type="tel"
              style={user?.phone ? { color: '#9CA3AF', background: '#F3F4F6' } : {}}
            />
          </div>
        </div>

        {/* Society Selection */}
        <div className="input-group" style={{ position: 'relative' }}>
          <label className="input-label">Society *</label>
          <button
            className="icon-input"
            onClick={() => setShowSocietyDropdown(!showSocietyDropdown)}
            style={{
              width: '100%',
              padding: '14px 16px',
              textAlign: 'left',
              cursor: 'pointer',
              color: selectedSociety ? '#111827' : '#9CA3AF',
              fontSize: 16,
            }}
          >
            {selectedSociety
              ? societies.find((s) => s.id === selectedSociety)?.name
              : 'Select your society'}
          </button>

          {showSocietyDropdown && (
            <div style={{
              position: 'absolute',
              top: 78,
              left: 0,
              right: 0,
              background: 'white',
              border: '1px solid var(--border)',
              borderRadius: 12,
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              maxHeight: 200,
              overflowY: 'auto',
            }}>
              {societies.map((society) => (
                <div
                  key={society.id}
                  style={{
                    padding: 16,
                    borderBottom: '1px solid var(--muted)',
                    cursor: 'pointer',
                    fontSize: 16,
                    color: '#111827',
                  }}
                  onClick={() => {
                    setSelectedSociety(society.id);
                    setShowSocietyDropdown(false);
                  }}
                >
                  {society.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          className="login-btn scale-pressable"
          onClick={handleSubmit}
          disabled={loading}
          style={{ marginTop: 32, borderRadius: 16 }}
        >
          {loading ? <div className="spinner" /> : 'Complete Setup'}
        </button>
      </div>
    </div>
  );
};

export default ProfileCreationScreen;
