'use client';

import React from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { iosSpring, pageTransition, routeVariants } from './motionPrimitives';

const RouteMotion = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user" transition={iosSpring}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          className="route-motion-shell"
          variants={shouldReduceMotion ? undefined : routeVariants}
          initial={shouldReduceMotion ? false : 'initial'}
          animate={shouldReduceMotion ? undefined : 'animate'}
          exit={shouldReduceMotion ? undefined : 'exit'}
          transition={pageTransition}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  );
};

export default RouteMotion;
