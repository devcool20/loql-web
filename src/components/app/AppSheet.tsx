'use client';

import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { modalBackdropVariants, sheetSpring, sheetVariants } from '@/components/motion/motionPrimitives';

const focusables = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';

const AppSheet = ({ open, onClose, children, labelledBy, className = '' }: { open: boolean; onClose: () => void; children: React.ReactNode; labelledBy?: string; className?: string }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const wasOpenRef = useRef(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) {
      if (wasOpenRef.current) restoreRef.current?.focus();
      wasOpenRef.current = false;
      return;
    }
    if (!wasOpenRef.current) {
      restoreRef.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => (panelRef.current?.querySelector(focusables) as HTMLElement | null)?.focus());
      wasOpenRef.current = true;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab' || !panelRef.current) return;
      const nodes = Array.from(panelRef.current.querySelectorAll<HTMLElement>(focusables));
      if (!nodes.length) return;
      const first = nodes[0]; const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return <AnimatePresence>{open && <motion.div className="app-sheet-backdrop" onClick={onClose} variants={reduceMotion ? undefined : modalBackdropVariants} initial={reduceMotion ? false : 'initial'} animate={reduceMotion ? undefined : 'animate'} exit={reduceMotion ? undefined : 'exit'}>
    <motion.div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={labelledBy} className={`app-sheet ${className}`.trim()} onClick={event => event.stopPropagation()} variants={reduceMotion ? undefined : sheetVariants} initial={reduceMotion ? false : 'initial'} animate={reduceMotion ? undefined : 'animate'} exit={reduceMotion ? undefined : 'exit'} transition={sheetSpring}>
      <span className="grab" aria-hidden="true" />{children}
    </motion.div>
  </motion.div>}</AnimatePresence>;
};
export default AppSheet;
