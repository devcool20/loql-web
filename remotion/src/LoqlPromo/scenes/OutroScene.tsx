import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Montserrat';
import { COLORS } from '../theme';

const { fontFamily } = loadFont('normal', {
  weights: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
});

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 60 },
  });
  const logoY = interpolate(logoScale, [0, 1], [50, 0]);

  const taglineOpacity = interpolate(frame, [fps * 1, fps * 1.6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const taglineY = interpolate(frame, [fps * 1, fps * 1.6], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
  });

  const ctaOpacity = interpolate(frame, [fps * 2, fps * 2.6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ctaScale = spring({
    frame: frame - fps * 2,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  const lineWidth = interpolate(frame, [fps * 0.6, fps * 1.4], [0, 160], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const dotPulse = interpolate(
    frame % (fps * 1.5),
    [0, fps * 0.75, fps * 1.5],
    [0.6, 1, 0.6],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.primary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
      }}
    >
      {/* Subtle dot grid background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: dotPulse * 0.04,
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Logo */}
      <div
        style={{
          fontSize: 120,
          fontWeight: 700,
          color: COLORS.accentSolidText,
          letterSpacing: -3,
          transform: `scale(${logoScale}) translateY(${logoY}px)`,
        }}
      >
        loql
      </div>

      {/* Separator */}
      <div
        style={{
          width: lineWidth,
          height: 2,
          background: 'rgba(255,255,255,0.25)',
          marginTop: 20,
          marginBottom: 28,
        }}
      />

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.4,
          }}
        >
          Rent things from
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: COLORS.accentSolidText,
            lineHeight: 1.4,
          }}
        >
          your neighbors
        </div>
      </div>

      {/* CTA */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaScale})`,
          marginTop: 60,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(255,255,255,0.12)',
            borderRadius: 50,
            padding: '18px 40px',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7,10 12,15 17,10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: COLORS.accentSolidText,
              letterSpacing: 0.5,
            }}
          >
            Download Now
          </span>
        </div>
      </div>

      {/* Bottom text */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          textAlign: 'center',
          opacity: ctaOpacity * 0.5,
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.35)',
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          Available for Android
        </div>
      </div>
    </AbsoluteFill>
  );
};
