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
import { PhoneMockup } from '../components/PhoneMockup';

const { fontFamily } = loadFont('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

const messages = [
  { text: 'Hi! Is the drill still available?', sent: true },
  { text: 'Yes! When do you need it?', sent: false },
  { text: 'Tomorrow morning would be great', sent: true },
  { text: "Sure, I'll keep it ready for you 👍", sent: false },
];

export const ChatScene: React.FC = () => {
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
          Connect
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: COLORS.primary,
            lineHeight: 1.2,
          }}
        >
          Chat with neighbors
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
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Chat header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '36px 14px 12px',
                borderBottom: `1px solid ${COLORS.border}`,
                gap: 8,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.primary} strokeWidth="2.5">
                <path d="m15 18-6-6 6-6" />
              </svg>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: COLORS.muted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: COLORS.primary,
                }}
              >
                R
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.primary }}>
                  Rahul S.
                </div>
                <div style={{ fontSize: 8, color: COLORS.success, fontWeight: 500 }}>
                  Online
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              style={{
                flex: 1,
                padding: '14px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {messages.map((msg, i) => {
                const msgDelay = fps * 0.8 + i * fps * 0.6;
                const msgSpring = spring({
                  frame: frame - msgDelay,
                  fps,
                  config: { damping: 14, stiffness: 120 },
                });
                const msgOpacity = interpolate(msgSpring, [0, 0.3], [0, 1], {
                  extrapolateRight: 'clamp',
                });
                const msgScale = interpolate(msgSpring, [0, 1], [0.8, 1]);
                const msgY = interpolate(msgSpring, [0, 1], [10, 0]);

                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: msg.sent ? 'flex-end' : 'flex-start',
                      opacity: msgOpacity,
                      transform: `scale(${msgScale}) translateY(${msgY}px)`,
                      transformOrigin: msg.sent ? 'right bottom' : 'left bottom',
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '75%',
                        padding: '8px 12px',
                        borderRadius: msg.sent
                          ? '12px 12px 4px 12px'
                          : '12px 12px 12px 4px',
                        background: msg.sent ? COLORS.primary : COLORS.surfaceAlt,
                        color: msg.sent ? COLORS.accentSolidText : COLORS.primary,
                        fontSize: 9,
                        fontWeight: 500,
                        lineHeight: 1.4,
                        border: msg.sent ? 'none' : `1px solid ${COLORS.border}`,
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px 14px',
                gap: 8,
                borderTop: `1px solid ${COLORS.border}`,
              }}
            >
              <div
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: COLORS.surfaceAlt,
                  borderRadius: 16,
                  border: `1px solid ${COLORS.border}`,
                  fontSize: 9,
                  color: COLORS.textLight,
                }}
              >
                Type a message...
              </div>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: COLORS.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={COLORS.accentSolidText} strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22,2 15,22 11,13 2,9" />
                </svg>
              </div>
            </div>
          </div>
        </PhoneMockup>
      </div>
    </AbsoluteFill>
  );
};
