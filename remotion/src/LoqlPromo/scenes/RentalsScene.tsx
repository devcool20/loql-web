import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { loadFont } from '@remotion/google-fonts/Montserrat';
import { COLORS } from '../theme';
import { PhoneMockup } from '../components/PhoneMockup';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const rentals = [
  { title: 'Bosch Power Drill', status: 'Active', statusColor: COLORS.primary, price: '₹80/day', daysLeft: '2 days left', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200&h=200&fit=crop&crop=center' },
  { title: 'Canon DSLR Camera', status: 'Returned', statusColor: COLORS.success, price: '₹250/day', daysLeft: 'Completed', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=200&h=200&fit=crop&crop=center' },
  { title: 'Camping Tent (4P)', status: 'Pending', statusColor: COLORS.textLight, price: '₹200/day', daysLeft: 'Awaiting approval', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=200&h=200&fit=crop&crop=center' },
];

const tabs = ['Listings', 'My Offers', 'Rentals'];

export const RentalsScene: React.FC = () => {
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
          Manage
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: COLORS.primary,
            lineHeight: 1.2,
          }}
        >
          Track everything
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
          <div style={{ padding: '36px 14px 14px' }}>
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: COLORS.primary,
                }}
              >
                My Rentals
              </div>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: COLORS.muted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                gap: 0,
                marginBottom: 14,
                background: COLORS.muted,
                borderRadius: 10,
                padding: 3,
              }}
            >
              {tabs.map((tab, i) => (
                <div
                  key={tab}
                  style={{
                    flex: 1,
                    padding: '7px 0',
                    borderRadius: 8,
                    fontSize: 9,
                    fontWeight: 600,
                    textAlign: 'center',
                    color: i === 2 ? COLORS.primary : COLORS.textSecondary,
                    background: i === 2 ? COLORS.surface : 'transparent',
                    boxShadow: i === 2 ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>

            {/* Rental cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rentals.map((rental, i) => {
                const cardDelay = fps * 0.8 + i * fps * 0.4;
                const cardSpring = spring({
                  frame: frame - cardDelay,
                  fps,
                  config: { damping: 14, stiffness: 100 },
                });
                const cardOpacity = interpolate(cardSpring, [0, 0.4], [0, 1], {
                  extrapolateRight: 'clamp',
                });
                const cardY = interpolate(cardSpring, [0, 1], [20, 0]);

                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 10,
                      background: COLORS.surface,
                      borderRadius: 14,
                      border: `1px solid ${COLORS.muted}`,
                      gap: 10,
                      opacity: cardOpacity,
                      transform: `translateY(${cardY}px)`,
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 12,
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      <Img
                        src={rental.image}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: COLORS.primary,
                          marginBottom: 3,
                        }}
                      >
                        {rental.title}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            padding: '2px 6px',
                            borderRadius: 5,
                            background: `${rental.statusColor}15`,
                          }}
                        >
                          <div
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: 2,
                              background: rental.statusColor,
                            }}
                          />
                          <span style={{ fontSize: 7, fontWeight: 600, color: rental.statusColor }}>
                            {rental.status}
                          </span>
                        </div>
                        <span style={{ fontSize: 7, color: COLORS.textSecondary }}>
                          {rental.daysLeft}
                        </span>
                      </div>
                    </div>
                    {/* Price */}
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: COLORS.primary,
                      }}
                    >
                      {rental.price}
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
