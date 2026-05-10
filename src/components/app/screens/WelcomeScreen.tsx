'use client';

import React from 'react';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen = ({ onStart }: WelcomeScreenProps) => {
  return (
    <div className="welcome-experience animate-fade-in">
      <section className="welcome-media">
        <img
          src="/brand/loql-neighborhood-hero.png"
          alt="Neighbors sharing in the neighborhood"
        />
        <div className="welcome-media-fade" />
      </section>

      <section className="welcome-copy-panel">
        <div className="welcome-copy">
          <div className="welcome-handle" />
          <div className="welcome-brand font-serif">
            Loql
          </div>
          <h1 className="welcome-headline font-serif">
            Discover your neighborhood&apos;s hidden treasures.
          </h1>
        </div>

        <button
          className="welcome-cta scale-pressable"
          onClick={onStart}
        >
          Step Into Your Neighborhood
        </button>
      </section>
    </div>
  );
};

export default WelcomeScreen;
