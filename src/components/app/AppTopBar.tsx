'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import SmartImage from '@/components/app/SmartImage';
import { iosSpring } from '@/components/motion/motionPrimitives';

type AppTopBarProps = {
  avatarUrl?: string | null; avatarLabel?: string; showAvatar?: boolean; onAvatarClick?: () => void;
  rightSlot?: React.ReactNode; onBack?: () => void; title?: string;
  textAction?: { label: string; onClick?: () => void; disabled?: boolean };
};

const AppTopBar = ({ avatarUrl, avatarLabel, showAvatar = false, onAvatarClick, rightSlot, onBack, title, textAction }: AppTopBarProps) => {
  const reduceMotion = useReducedMotion();
  const initial = (avatarLabel || 'N').trim().charAt(0).toUpperCase();
  return <header className="app-topbar">
    <div className="app-topbar-brand-wrap">
      {onBack && <motion.button type="button" className="app-icon-button app-topbar-back" onClick={onBack} aria-label="Go back" whileTap={reduceMotion ? undefined : { scale:.96 }}><ArrowLeft size={20} /></motion.button>}
      <span className="app-topbar-title font-serif">{title || 'Loql'}</span>
    </div>
    <div className="app-topbar-actions">
      {textAction && <button type="button" className="app-topbar-text-action" onClick={textAction.onClick} disabled={textAction.disabled}>{textAction.label}</button>}
      {rightSlot}
      {showAvatar && <motion.button type="button" className="home-avatar-button" onClick={onAvatarClick} aria-label="Open profile" whileTap={reduceMotion ? undefined : { scale:.96 }} transition={iosSpring}>
        {avatarUrl ? <SmartImage src={avatarUrl} alt="Profile" fallbackLabel={avatarLabel} rounded="50%" /> : <span>{initial}</span>}
      </motion.button>}
    </div>
  </header>;
};
export default AppTopBar;
