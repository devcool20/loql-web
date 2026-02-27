import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Montserrat';
import { COLORS } from '../theme';
import { PhoneMockup } from '../components/PhoneMockup';

const DRILL_IMAGE = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&h=500&fit=crop&crop=center';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

export const ItemDetailScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneEnter = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const phoneY = interpolate(phoneEnter, [0, 1], [120, 0]);
  const phoneOpacity = interpolate(phoneEnter, [0, 0.4], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const labelOpacity = interpolate(frame, [fps * 2, fps * 2.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const labelY = interpolate(frame, [fps * 2, fps * 2.5], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const offerBtnScale = spring({
    frame: frame - fps * 2.8,
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  const priceReveal = interpolate(frame, [fps * 1.5, fps * 2], [0, 1], {
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
      }}
    >
      {/* Feature label */}
      <div
        style={{
          position: 'absolute',
          top: 120,
          textAlign: 'center',
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: COLORS.textSecondary,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Rent
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: COLORS.primary,
            lineHeight: 1.2,
          }}
        >
          Anything, instantly
        </div>
      </div>

      {/* Phone */}
      <div
        style={{
          opacity: phoneOpacity,
          transform: `translateY(${phoneY}px)`,
          marginTop: 160,
        }}
      >
        <PhoneMockup scale={1.9}>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '100%',
                height: 220,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Img
                src={DRILL_IMAGE}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {/* Back button */}
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2.5">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </div>
              {/* Image dots */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 10,
                  display: 'flex',
                  gap: 4,
                }}
              >
                {[0, 1, 2].map((d) => (
                  <div
                    key={d}
                    style={{
                      width: d === 0 ? 16 : 5,
                      height: 5,
                      borderRadius: 3,
                      background: d === 0 ? COLORS.primary : 'rgba(0,0,0,0.2)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div
              style={{
                padding: 16,
                background: COLORS.surface,
                borderRadius: '20px 20px 0 0',
                marginTop: -16,
                position: 'relative',
              }}
            >
              {/* Drag handle */}
              <div
                style={{
                  width: 32,
                  height: 3,
                  background: COLORS.border,
                  borderRadius: 2,
                  margin: '0 auto 12px',
                }}
              />

              {/* Title + Price */}
              <div style={{ marginBottom: 12 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: COLORS.primary,
                    marginBottom: 4,
                  }}
                >
                  Bosch Power Drill
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: COLORS.primary,
                    opacity: priceReveal,
                  }}
                >
                  ₹80<span style={{ fontSize: 12, fontWeight: 500, color: COLORS.textSecondary }}>/day</span>
                </div>
              </div>

              {/* Availability badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: '#ECFDF5',
                  borderRadius: 8,
                  padding: '4px 10px',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: COLORS.success,
                  }}
                />
                <span style={{ fontSize: 9, fontWeight: 600, color: COLORS.success }}>
                  Available
                </span>
              </div>

              {/* Description */}
              <div
                style={{
                  fontSize: 9,
                  color: COLORS.textSecondary,
                  lineHeight: 1.5,
                  marginBottom: 14,
                }}
              >
                Professional-grade power drill. Comes with a full set of bits.
                Perfect for weekend DIY projects.
              </div>

              {/* Owner card */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: 10,
                  background: COLORS.surfaceAlt,
                  borderRadius: 12,
                  marginBottom: 14,
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: COLORS.muted,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: COLORS.primary,
                  }}
                >
                  R
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.primary }}>
                    Rahul S.
                  </div>
                  <div style={{ fontSize: 8, color: COLORS.textSecondary }}>
                    ★ 4.8 · Tower B
                  </div>
                </div>
                <div
                  style={{
                    padding: '5px 12px',
                    background: COLORS.primary,
                    borderRadius: 8,
                    fontSize: 8,
                    fontWeight: 600,
                    color: COLORS.accentSolidText,
                  }}
                >
                  Chat
                </div>
              </div>

              {/* Make offer button */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 12,
                  background: COLORS.primary,
                  borderRadius: 14,
                  transform: `scale(${offerBtnScale})`,
                }}
              >
                <div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)' }}>
                    Total
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.accentSolidText }}>
                    ₹80
                  </div>
                </div>
                <div
                  style={{
                    padding: '8px 20px',
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    color: COLORS.accentSolidText,
                  }}
                >
                  Make Offer →
                </div>
              </div>
            </div>
          </div>
        </PhoneMockup>
      </div>
    </AbsoluteFill>
  );
};
