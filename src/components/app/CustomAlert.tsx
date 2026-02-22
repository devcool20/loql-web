'use client';

import React from 'react';
import { useStore } from '@/store/useStore';

const CustomAlert = () => {
  const { alert, hideAlert } = useStore();
  const { visible, title, message, type, onConfirm, showCancel, actions } = alert;

  if (!visible) return null;

  const handleConfirm = () => {
    hideAlert();
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    hideAlert();
  };

  return (
    <div className="alert-overlay" onClick={hideAlert}>
      <div className="alert-card" onClick={(e) => e.stopPropagation()}>
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
      </div>
    </div>
  );
};

export default CustomAlert;
