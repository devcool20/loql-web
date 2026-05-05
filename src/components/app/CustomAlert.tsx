'use client';

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { iosSpring, modalBackdropVariants, modalCardVariants } from '@/components/motion/motionPrimitives';
import { useStore } from '@/store/useStore';

const CustomAlert = () => {
  const { alert, hideAlert } = useStore();
  const { visible, title, message, onConfirm, showCancel, actions } = alert;
  const shouldReduceMotion = useReducedMotion();

  const handleConfirm = () => {
    hideAlert();
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    hideAlert();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="alert-overlay"
          onClick={hideAlert}
          variants={shouldReduceMotion ? undefined : modalBackdropVariants}
          initial={shouldReduceMotion ? false : 'initial'}
          animate={shouldReduceMotion ? undefined : 'animate'}
          exit={shouldReduceMotion ? undefined : 'exit'}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="alert-card"
            onClick={(e) => e.stopPropagation()}
            variants={shouldReduceMotion ? undefined : modalCardVariants}
            transition={iosSpring}
          >
            <div className="alert-title">{title}</div>
            <div className="alert-message">{message}</div>

            {actions ? (
              <div className="alert-action-container">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    className={`alert-action-btn ${action.style === 'destructive' ? 'destructive' : ''} ${action.style === 'cancel' ? 'cancel' : ''}`}
                    onClick={() => {
                      hideAlert();
                      if (action.onPress) action.onPress();
                    }}
                  >
                    {action.text}
                  </button>
                ))}
              </div>
            ) : (
              <div className="alert-button-row">
                {showCancel && (
                  <button className="alert-btn alert-btn-cancel" onClick={handleCancel}>
                    Cancel
                  </button>
                )}
                <button className="alert-btn alert-btn-primary" onClick={handleConfirm}>
                  Okay
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomAlert;
