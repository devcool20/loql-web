'use client';

import React from 'react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="welcome-screen animate-fade-in">
      <div className="welcome-logo-container">
        <img src="/logo.png" alt="loql" className="welcome-logo" />
      </div>

      <div style={{ marginBottom: 32 }}>
        <h1 className="welcome-title">
          Welcome back to<br />loql
        </h1>
        <p className="welcome-subtitle">
          Your neighborhood library. Rent anything from neighbors in your society instantly.
        </p>
      </div>

      <button className="welcome-btn scale-pressable" onClick={onStart}>
        Get Started
      </button>
    </div>
  );
};

export default WelcomeScreen;
