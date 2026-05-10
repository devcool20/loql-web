'use client';

import React from 'react';
import SmartImage from '@/components/app/SmartImage';

type AppTopBarProps = {
  avatarUrl?: string | null;
  avatarLabel?: string;
  showAvatar?: boolean;
  onAvatarClick?: () => void;
  rightSlot?: React.ReactNode;
};

const AppTopBar = ({ avatarUrl, avatarLabel, showAvatar = false, onAvatarClick, rightSlot }: AppTopBarProps) => {
  const avatarInitial = (avatarLabel || 'N').trim().charAt(0).toUpperCase();

  return (
    <header
      className="app-topbar"
    >
      <div className="app-topbar-brand-wrap">
        <span
          className="font-serif"
          style={{ color: 'var(--primary)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}
        >
          Loql
        </span>
      </div>

      <div className="app-topbar-actions">
        {rightSlot}
        {showAvatar && (
          <button
            className="scale-pressable"
            onClick={onAvatarClick}
            aria-label="Open profile"
            style={{
              borderRadius: 9999,
              border: '2px solid var(--app-tabbar-border)',
              background: 'var(--surface-container-high)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xs)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {avatarUrl ? (
              <SmartImage
                src={avatarUrl}
                alt="Profile"
                fallbackLabel={avatarLabel}
                loading="eager"
                fetchPriority="high"
                rounded="50%"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ color: 'var(--text-secondary)', fontSize: 16, fontWeight: 700 }}>{avatarInitial}</span>
            )}
          </button>
        )}
      </div>
    </header>
  );
};

export default AppTopBar;
