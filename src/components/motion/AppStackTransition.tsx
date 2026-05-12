'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { iosEase, stackVariants } from './motionPrimitives';

const AppStackTransition = ({ children }: { children: React.ReactNode }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="app-stack-screen"
      variants={shouldReduceMotion ? undefined : stackVariants}
      initial={shouldReduceMotion ? false : 'initial'}
      animate={shouldReduceMotion ? undefined : 'animate'}
      exit={shouldReduceMotion ? undefined : 'exit'}
      transition={{ duration: 0.24, ease: iosEase }}
    >
      {children}
    </motion.div>
  );
};

export default AppStackTransition;
