'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import TrustRow from '@/components/app/TrustRow';

const WelcomeScreen = ({ onStart }: { onStart: () => void }) => {
  const reduceMotion = useReducedMotion();
  return <main className="welcome-experience">
    <motion.section className="welcome-media" initial={reduceMotion ? false : { opacity:0, scale:1.03 }} animate={{ opacity:1, scale:1 }} transition={{ duration:.55 }}>
      <img src="/brand/loql-neighborhood-hero.png" alt="Neighbours sharing useful things" />
      <div className="welcome-media-fade" />
      <span className="welcome-logo font-serif">Loql</span>
    </motion.section>
    <motion.section className="welcome-copy-panel" initial={reduceMotion ? false : { opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:.42, delay:.08 }}>
      <div className="welcome-handle" />
      <span className="v2-eyebrow">Borrow • share • belong</span>
      <h1 className="welcome-headline font-serif">Your neighbourhood has more than you think.</h1>
      <p className="welcome-support">Borrow trusted tools, tech, and celebration gear from people who live nearby.</p>
      <TrustRow label="Verified neighbours in your society" />
      <button className="welcome-cta scale-pressable" onClick={onStart}>Explore your neighbourhood <ArrowRight size={18} /></button>
      <button className="welcome-login-link" onClick={onStart}>I already have an account</button>
    </motion.section>
  </main>;
};
export default WelcomeScreen;
