'use client';

import React from 'react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="animate-fade-in" style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
      <section style={{ height: '50vh', minHeight: 360, position: 'relative', overflow: 'hidden' }}>
        <img
          src="/brand/loql-neighborhood-hero.png"
          alt="Neighbors sharing in the neighborhood"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 35%, var(--background) 100%)' }} />
      </section>

      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '16px 28px 34px' }}>
        <div>
          <div style={{ width: 48, height: 4, borderRadius: 999, background: 'rgba(241, 115, 80, 0.24)', margin: '0 auto 18px' }} />
          <div className="font-serif" style={{ textAlign: 'center', fontSize: 34, lineHeight: 1, fontWeight: 700, color: 'var(--primary)', marginBottom: 16 }}>
            Loql
          </div>
          <h1 className="font-serif" style={{ fontSize: 34, lineHeight: 1.15, color: 'var(--text-primary)', textAlign: 'center', marginBottom: 10 }}>
            Discover your neighborhood&apos;s hidden treasures.
          </h1>
        </div>

        <button
          className="scale-pressable"
          onClick={onStart}
          style={{
            width: '100%',
            borderRadius: 999,
            border: 'none',
            background: 'var(--primary)',
            color: 'white',
            fontSize: 16,
            fontWeight: 700,
            padding: '16px 20px',
            boxShadow: 'var(--warm-glow)',
          }}
        >
          Step Into Your Neighborhood
        </button>
      </section>
    </div>
  );
};

export default WelcomeScreen;
