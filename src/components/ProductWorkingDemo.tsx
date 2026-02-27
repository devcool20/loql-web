'use client';
import { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import styles from './ProductWorkingDemo.module.css';
import { StickyScroll } from './ui/sticky-scroll-reveal';

function PortraitVideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const next = !isMuted;
    videoRef.current.muted = next;
    setIsMuted(next);
  };

  return (
    <div className={styles.portraitFrame} onClick={togglePlay}>
      <video
        ref={videoRef}
        src="/product-working.mp4"
        className={styles.portraitVideo}
        loop
        playsInline
        muted={isMuted}
      />

      {/* Play overlay */}
      {!isPlaying && (
        <div className={styles.playOverlay}>
          <div className={styles.playCircle}>
            <Play fill="white" size={28} />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className={styles.videoControls} onClick={e => e.stopPropagation()}>
        <button className={styles.controlBtn} onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={16} /> : <Play size={16} fill="white" />}
        </button>
        <button className={styles.controlBtn} onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>

      {/* Home indicator */}
      <div className={styles.homeIndicator} />
    </div>
  );
}

const content = [
  {
    title: "The Renter Flow",
    description: "Browse local listings, check item availability, and send a request with one tap. Finding what you need in your community has never been easier.",
  },
  {
    title: "The Rentee (Owner) Flow",
    description: "Receive requests, review the renter's profile, and approve with a secure digital handshake. Monetize your idle items with confidence.",
  },
  {
    title: "Secure Handover",
    description: "Verify item condition through the app during physical handover for peace of mind. Our process ensures transparency and trust for every transaction.",
  },
];

export default function ProductWorkingDemo() {
  return (
    <section className={styles.section} id="how-it-works">
      <div className="container">
        <div className={styles.header}>
          <span className={styles.tagline}>See it in action</span>
          <h2>Renter & Rentee Workflow</h2>
          <p>
            Watch how easy it is to list, find, and rent items using loql.{' '}
            Our seamless handover process ensures security for both parties.
          </p>
        </div>

        <StickyScroll 
          content={content}
          persistentContent={<PortraitVideoPlayer />}
        />
      </div>
    </section>
  );
}
