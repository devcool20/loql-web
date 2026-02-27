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
import { PhoneMockup } from '../components/PhoneMockup';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Secure Payments',
    desc: 'Wallet-based system with handover verification',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2">
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 1 0-16 0" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    title: 'Trust Scores',
    desc: 'Every neighbor is rated for reliability',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
    title: 'Society-Gated',
    desc: 'Only people in your apartment community',
  },
];

export const WalletScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const titleY = interpolate(frame, [0, fps * 0.5], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.quad),
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
        padding: 80,
      }}
    >
      {/* Section title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: 'center',
          marginBottom: 80,
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          Built on trust
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: COLORS.accentSolidText,
            lineHeight: 1.15,
          }}
        >
          Safe, secure,{'\n'}community-first
        </div>
      </div>

      {/* Feature cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 28,
          width: '100%',
        }}
      >
        {features.map((feat, i) => {
          const cardDelay = fps * 0.8 + i * fps * 0.5;
          const cardSpring = spring({
            frame: frame - cardDelay,
            fps,
            config: { damping: 14, stiffness: 80 },
          });
          const cardOpacity = interpolate(cardSpring, [0, 0.4], [0, 1], {
            extrapolateRight: 'clamp',
          });
          const cardX = interpolate(cardSpring, [0, 1], [-60, 0]);

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                opacity: cardOpacity,
                transform: `translateX(${cardX}px)`,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <div style={{ color: COLORS.accentSolidText }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                    {i === 0 && <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></>}
                    {i === 1 && <><circle cx="12" cy="8" r="4" /><path d="M20 21a8 8 0 1 0-16 0" /><path d="M16 3l2 2-4 4" /></>}
                    {i === 2 && <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9,22 9,12 15,12 15,22" /></>}
                  </svg>
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: COLORS.accentSolidText,
                    marginBottom: 4,
                  }}
                >
                  {feat.title}
                </div>
                <div
                  style={{
                    fontSize: 18,
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 400,
                  }}
                >
                  {feat.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
