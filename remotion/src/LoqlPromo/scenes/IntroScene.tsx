import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Montserrat';
import { COLORS } from '../theme';

const { fontFamily } = loadFont('normal', {
  weights: ['300', '400', '600', '700'],
  subsets: ['latin'],
});

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 80 } });
  const logoY = interpolate(logoScale, [0, 1], [40, 0]);

  const taglineOpacity = interpolate(frame, [fps * 1, fps * 1.8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const taglineY = interpolate(frame, [fps * 1, fps * 1.8], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const lineWidth = interpolate(frame, [fps * 0.5, fps * 1.5], [0, 200], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
      {/* Logo text */}
      <div
        style={{
          fontSize: 140,
          fontWeight: 700,
          color: COLORS.accentSolidText,
          letterSpacing: -4,
          transform: `scale(${logoScale}) translateY(${logoY}px)`,
        }}
      >
        loql
      </div>

      {/* Separator line */}
      <div
        style={{
          width: lineWidth,
          height: 2,
          background: 'rgba(255,255,255,0.3)',
          marginTop: 16,
          marginBottom: 24,
        }}
      />

      {/* Tagline */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 300,
          color: 'rgba(255,255,255,0.7)',
          letterSpacing: 6,
          textTransform: 'uppercase',
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
        }}
      >
        your neighborhood
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 300,
          color: 'rgba(255,255,255,0.7)',
          letterSpacing: 6,
          textTransform: 'uppercase',
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          marginTop: 4,
        }}
      >
        library
      </div>
    </AbsoluteFill>
  );
};
