'use client';

import React from 'react';

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
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(253, 251, 247, 0.9)',
        borderBottom: '1px solid var(--border-light)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span
          className="font-serif"
          style={{ fontSize: 28, color: 'var(--primary)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}
        >
          Loql
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {rightSlot}
        {showAvatar && (
          <button
            className="scale-pressable"
            onClick={onAvatarClick}
            aria-label="Open profile"
            style={{
              width: 40,
              height: 40,
              borderRadius: 9999,
              border: '2px solid rgba(241, 115, 80, 0.22)',
              background: 'var(--surface-container-high)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xs)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
