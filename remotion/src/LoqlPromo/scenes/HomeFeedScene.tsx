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

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const categories = ['All', 'DIY Tools', 'Party', 'Gaming', 'Fitness', 'Kitchen'];

const items = [
  { title: 'Power Drill', price: '₹80/day', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&h=400&fit=crop&crop=center' },
  { title: 'Projector', price: '₹150/day', image: 'https://images.unsplash.com/photo-1626379953822-baec19c3accd?w=400&h=400&fit=crop&crop=center' },
  { title: 'Camping Tent', price: '₹200/day', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=400&fit=crop&crop=center' },
  { title: 'PS5 Controller', price: '₹50/day', image: 'https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=400&h=400&fit=crop&crop=center' },
  { title: 'Yoga Mat', price: '₹30/day', image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop&crop=center' },
  { title: 'Stand Mixer', price: '₹120/day', image: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=400&h=400&fit=crop&crop=center' },
];

export const HomeFeedScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const phoneEnter = spring({
    frame,
    fps,
    config: { damping: 15, stiffness: 80 },
  });
  const phoneY = interpolate(phoneEnter, [0, 1], [200, 0]);
  const phoneOpacity = interpolate(phoneEnter, [0, 0.5], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const labelOpacity = interpolate(frame, [fps * 2.5, fps * 3], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const labelY = interpolate(frame, [fps * 2.5, fps * 3], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
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
          Browse
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: COLORS.primary,
            lineHeight: 1.2,
          }}
        >
          Items near you
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
          <div style={{ padding: '40px 16px 16px' }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 9,
                    color: COLORS.textSecondary,
                    fontWeight: 500,
                    letterSpacing: 0.3,
                  }}
                >
                  GOOD MORNING
                </div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: COLORS.primary,
                    letterSpacing: -0.3,
                  }}
                >
                  Arjun
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    marginTop: 2,
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={COLORS.textSecondary} strokeWidth="2.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span style={{ fontSize: 8, color: COLORS.textSecondary, fontWeight: 500 }}>
                    Prestige Lakeside
                  </span>
                </div>
              </div>
              {/* Bell icon */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.muted}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
            </div>

            {/* Search bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: COLORS.surface,
                borderRadius: 12,
                padding: '8px 10px',
                marginBottom: 12,
                border: `1px solid ${COLORS.muted}`,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.textLight} strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <span
                style={{
                  marginLeft: 6,
                  fontSize: 10,
                  color: COLORS.textLight,
                  fontWeight: 500,
                }}
              >
                Search items...
              </span>
            </div>

            {/* Categories */}
            <div
              style={{
                display: 'flex',
                gap: 5,
                marginBottom: 14,
                overflow: 'hidden',
              }}
            >
              {categories.map((cat, i) => {
                const chipDelay = fps * 0.8 + i * 3;
                const chipOpacity = interpolate(
                  frame,
                  [chipDelay, chipDelay + 8],
                  [0, 1],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );

                return (
                  <div
                    key={cat}
                    style={{
                      background: i === 0 ? COLORS.primary : COLORS.surface,
                      borderRadius: 12,
                      padding: '5px 10px',
                      border: `1px solid ${i === 0 ? COLORS.primary : COLORS.muted}`,
                      fontSize: 8,
                      fontWeight: 600,
                      color: i === 0 ? COLORS.accentSolidText : COLORS.secondary,
                      whiteSpace: 'nowrap',
                      opacity: chipOpacity,
                    }}
                  >
                    {cat}
                  </div>
                );
              })}
            </div>

            {/* Item Grid */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              {items.map((item, i) => {
                const cardDelay = fps * 1 + i * 5;
                const cardSpring = spring({
                  frame: frame - cardDelay,
                  fps,
                  config: { damping: 15, stiffness: 100 },
                });
                const cardOpacity = interpolate(cardSpring, [0, 0.5], [0, 1], {
                  extrapolateRight: 'clamp',
                });
                const cardScale = interpolate(cardSpring, [0, 1], [0.85, 1]);

                return (
                  <div
                    key={i}
                    style={{
                      width: 'calc(50% - 4px)',
                      background: COLORS.surface,
                      borderRadius: 14,
                      overflow: 'hidden',
                      border: `1px solid ${COLORS.muted}`,
                      opacity: cardOpacity,
                      transform: `scale(${cardScale})`,
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <Img
                        src={item.image}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      {/* Price tag */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 6,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: COLORS.surface,
                          padding: '4px 10px',
                          borderRadius: 10,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                          fontSize: 8,
                          fontWeight: 600,
                          color: COLORS.primary,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.price}
                      </div>
                    </div>
                    <div style={{ padding: 8 }}>
                      <div
                        style={{
                          fontSize: 9,
                          fontWeight: 600,
                          color: COLORS.primary,
                          marginBottom: 2,
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          fontSize: 7,
                          color: COLORS.textSecondary,
                        }}
                      >
                        2 min away
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </PhoneMockup>
      </div>
    </AbsoluteFill>
  );
};
