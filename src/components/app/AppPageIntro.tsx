'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { iosEase } from '@/components/motion/motionPrimitives';

type AppPageIntroProps = {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
  className?: string;
};

const AppPageIntro = ({ eyebrow, title, description, action, compact = false, className = '' }: AppPageIntroProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.header
      className={`v2-page-intro ${compact ? 'is-compact' : ''} ${className}`.trim()}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.38, ease: iosEase }}
    >
      <div className="v2-page-intro-copy">
        {eyebrow && <span className="v2-eyebrow">{eyebrow}</span>}
        <h1 className="font-serif">{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="v2-page-intro-action">{action}</div>}
    </motion.header>
  );
};

export default AppPageIntro;
