'use client';
import { useState, useRef, useEffect } from 'react';
import { Play, Volume2, VolumeX, Maximize } from 'lucide-react';
import styles from './VideoPlaceholder.module.css';

interface VideoPlayerProps {
  videoUrl?: string; 
  title?: string;
  description?: string;
}

export default function VideoPlayer({ 
  videoUrl, 
  title = "Real Neighbors, Real Items", 
  description = "See how loql is changing the way we share." 
}: VideoPlayerProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const actualVideoUrl = videoUrl || "/demo.mp4";

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(err => console.error("Video play failed:", err));
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const nextMuteState = !isMuted;
      videoRef.current.muted = nextMuteState;
      setIsMuted(nextMuteState);
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  return (
    <div className={styles.wrapper}>
      <div 
        ref={containerRef} 
        className={styles.embeddedContainer} 
        onClick={togglePlay}
      >
        <video 
          ref={videoRef}
          src={actualVideoUrl}
          className={styles.mainVideo}
          loop
          playsInline
        />
        
        <div className={`${styles.videoOverlay} ${isPlaying ? styles.isPlayingOverlay : ''}`}>
            {!isPlaying && (
              <>
                <div className={styles.playCenter}>
                  <div className={styles.playCircle}>
                    <Play fill="white" size={32} />
                  </div>
                </div>
                
                <div className={styles.content}>
                   <h3 className={styles.videoTitle}>{title}</h3>
                   <p className={styles.videoDesc}>{description}</p>
                </div>
              </>
            )}
            
            <div className={styles.controls}>
              <button 
                className={styles.muteButton} 
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              
              <button 
                className={styles.fullscreenButton} 
                onClick={toggleFullscreen}
                aria-label="Toggle Fullscreen"
              >
                <Maximize size={20} />
              </button>
            </div>
        </div>
      </div>
    </div>
  );
}
