'use client';

import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Camera, ChevronDown, Loader2, MapPin, Phone, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { resizeImageFile } from '@/lib/clientImage';
import SmartImage from '@/components/app/SmartImage';

interface ProfileCreationScreenProps {
  onComplete: () => void;
}

interface Society {
  id: string;
  name: string;
}

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
};

const ProfileCreationScreen = ({ onComplete }: ProfileCreationScreenProps) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedSociety, setSelectedSociety] = useState<string | null>(null);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [showSocietyDropdown, setShowSocietyDropdown] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
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

    setAvatarUri(await resizeImageFile(file, { maxSize: 900, quality: 0.76 }));
    e.target.value = '';
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
    } catch (error: unknown) {
      showAlert('Error', getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedSocietyName = selectedSociety
    ? societies.find((society) => society.id === selectedSociety)?.name
    : null;

  return (
    <div className="profile-creation-screen auth-screen profile-setup-screen">
      <motion.div
        className="profile-setup-hero"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="profile-setup-copy">
          <h1 className="profile-creation-title font-serif">Set up your profile.</h1>
          <p className="profile-creation-subtitle">
            Add your name, photo, and society so neighbors know who they are renting with.
          </p>
        </div>

        <div className="avatar-picker">
          <motion.button
            type="button"
            className="avatar-circle profile-avatar-circle"
            onClick={handleSelectImage}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
          >
            {avatarUri ? (
              <SmartImage
                src={avatarUri}
                alt="Avatar"
                fallbackLabel={fullName || 'Profile'}
                rounded="50%"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              <User size={34} color="var(--text-secondary)" />
            )}
            <span className="profile-camera-badge">
              <Camera size={15} />
            </span>
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </motion.div>

      <div className="profile-setup-steps" aria-label="Profile setup progress">
        <span className={avatarUri ? 'done' : ''}>Photo</span>
        <span className={fullName.trim() ? 'done' : ''}>Name</span>
        <span className={selectedSociety ? 'done' : ''}>Society</span>
      </div>

      <div className="profile-creation-form auth-form profile-setup-form">
        <div className="input-group">
          <label className="input-label">Full Name</label>
          <div className={`icon-input auth-input-shell ${focusedField === 'name' ? 'is-focused' : ''}`}>
            <span className="auth-input-icon"><User size={18} /></span>
            <input
              className="text-input"
              placeholder="Alex Johnson"
              value={fullName}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Phone Number {user?.phone ? '' : '(Optional)'}</label>
          <div className={`icon-input auth-input-shell ${focusedField === 'phone' ? 'is-focused' : ''}`}>
            <span className="auth-input-icon"><Phone size={18} /></span>
            <input
              className="text-input"
              placeholder={user?.phone || 'Add phone number'}
              value={user?.phone || phoneNumber}
              onFocus={() => setFocusedField('phone')}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => !user?.phone && setPhoneNumber(e.target.value)}
              disabled={!!user?.phone}
              type="tel"
            />
          </div>
        </div>

        <div className="input-group profile-society-field">
          <label className="input-label">Society *</label>
          <motion.button
            type="button"
            className={`profile-society-trigger auth-input-shell ${showSocietyDropdown ? 'is-focused' : ''}`}
            onClick={() => setShowSocietyDropdown(!showSocietyDropdown)}
            whileTap={{ scale: 0.985 }}
          >
            <span className="auth-input-icon"><MapPin size={18} /></span>
            <span className={selectedSocietyName ? 'has-value' : ''}>
              {selectedSocietyName || 'Select your society'}
            </span>
            <ChevronDown size={18} className={showSocietyDropdown ? 'open' : ''} />
          </motion.button>

          <AnimatePresence>
            {showSocietyDropdown && (
              <motion.div
                className="profile-society-dropdown"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.18 }}
              >
                {societies.map((society) => (
                  <button
                    type="button"
                    key={society.id}
                    className="profile-society-option"
                    onClick={() => {
                      setSelectedSociety(society.id);
                      setShowSocietyDropdown(false);
                    }}
                  >
                    <span>{society.name}</span>
                    {selectedSociety === society.id && <span className="profile-society-dot" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.button
          type="button"
          className="login-btn auth-primary-btn profile-submit-btn"
          onClick={handleSubmit}
          disabled={loading}
          whileTap={{ scale: 0.97 }}
        >
          {loading ? (
            <Loader2 size={18} className="auth-spin" />
          ) : (
            <>
              Complete setup
          <ArrowRight size={18} />
            </>
          )}
        </motion.button>
      </div>

      <Image className="auth-diya-accent" src="/diya-removebg-preview.png" alt="" width={116} height={116} aria-hidden="true" />
    </div>
  );
};

export default ProfileCreationScreen;
