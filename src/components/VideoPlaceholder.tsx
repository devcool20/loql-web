'use client';
import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import styles from './VideoPlaceholder.module.css';

interface VideoPlayerProps {
  videoUrl?: string; 
}

export default function VideoPlayer({ videoUrl }: VideoPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const actualVideoUrl = videoUrl || "/demo.mp4";

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.embeddedContainer} onClick={togglePlay}>
        <video 
          ref={videoRef}
          src={actualVideoUrl}
          className={styles.mainVideo}
          muted={isMuted}
          loop
          playsInline
        />
        
        <div className={styles.videoOverlay}>
            {!isPlaying && (
              <div className={styles.playCenter}>
                <div className={styles.playCircle}>
                  <Play fill="white" size={32} />
                </div>
              </div>
            )}

            <div className={styles.content}>
               <h3 className={styles.videoTitle}>Real Neighbors, Real Items</h3>
               <p className={styles.videoDesc}>See how loql is changing the way we share.</p>
            </div>
            
            <button 
              className={styles.muteButton} 
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
        </div>
      </div>
    </div>
  );
}
