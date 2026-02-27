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
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const steps = [
  { num: '01', title: 'Browse', desc: 'Find items in your society' },
  { num: '02', title: 'Make Offer', desc: 'Set your price and duration' },
  { num: '03', title: 'Pick Up', desc: 'Collect from your neighbor' },
  { num: '04', title: 'Return', desc: 'Give it back when done' },
];

export const HowItWorksScene: React.FC = () => {
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
        backgroundColor: COLORS.background,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily,
        padding: 80,
      }}
    >
      {/* Title */}
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
            color: COLORS.textSecondary,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          How it works
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: COLORS.primary,
          }}
        >
          Four simple steps
        </div>
      </div>

      {/* Steps */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 40,
          width: '100%',
        }}
      >
        {steps.map((step, i) => {
          const stepDelay = fps * 0.6 + i * fps * 0.6;
          const stepSpring = spring({
            frame: frame - stepDelay,
            fps,
            config: { damping: 14, stiffness: 80 },
          });
          const stepOpacity = interpolate(stepSpring, [0, 0.4], [0, 1], {
            extrapolateRight: 'clamp',
          });
          const stepX = interpolate(stepSpring, [0, 1], [80, 0]);

          const lineHeight = interpolate(
            frame,
            [stepDelay + fps * 0.3, stepDelay + fps * 0.8],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 24,
                opacity: stepOpacity,
                transform: `translateX(${stepX}px)`,
                position: 'relative',
              }}
            >
              {/* Number circle */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    background: COLORS.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    fontWeight: 700,
                    color: COLORS.accentSolidText,
                    flexShrink: 0,
                  }}
                >
                  {step.num}
                </div>
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      height: 40,
                      background: COLORS.border,
                      marginTop: 0,
                      transformOrigin: 'top',
                      transform: `scaleY(${lineHeight})`,
                    }}
                  />
                )}
              </div>
              {/* Text */}
              <div style={{ paddingTop: 4 }}>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 700,
                    color: COLORS.primary,
                    marginBottom: 4,
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    fontSize: 20,
                    color: COLORS.textSecondary,
                    fontWeight: 400,
                  }}
                >
                  {step.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
