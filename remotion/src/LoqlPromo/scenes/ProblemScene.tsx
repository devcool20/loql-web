import React from 'react';
import {
  AbsoluteFill,
  interpolate,
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

const lines = [
  { text: 'Need a drill for', bold: 'one day?' },
  { text: 'A projector for', bold: 'movie night?' },
  { text: 'A tent for the', bold: 'weekend trip?' },
];

const answerLine = 'Your neighbor has it.';

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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
      {lines.map((line, i) => {
        const startFrame = i * fps * 1.2;
        const opacity = interpolate(
          frame,
          [startFrame, startFrame + fps * 0.5],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        const y = interpolate(
          frame,
          [startFrame, startFrame + fps * 0.5],
          [30, 0],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.quad),
          }
        );

        return (
          <div
            key={i}
            style={{
              opacity,
              transform: `translateY(${y}px)`,
              marginBottom: 32,
              textAlign: 'center',
            }}
          >
            <span
              style={{
                fontSize: 44,
                color: COLORS.textSecondary,
                fontWeight: 400,
              }}
            >
              {line.text}{' '}
            </span>
            <span
              style={{
                fontSize: 44,
                color: COLORS.primary,
                fontWeight: 700,
              }}
            >
              {line.bold}
            </span>
          </div>
        );
      })}

      {/* Answer */}
      {(() => {
        const answerStart = lines.length * fps * 1.2 + fps * 0.3;
        const answerOpacity = interpolate(
          frame,
          [answerStart, answerStart + fps * 0.6],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );
        const answerScale = interpolate(
          frame,
          [answerStart, answerStart + fps * 0.6],
          [0.9, 1],
          {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.out(Easing.quad),
          }
        );

        const underlineWidth = interpolate(
          frame,
          [answerStart + fps * 0.4, answerStart + fps * 1],
          [0, 100],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        return (
          <div
            style={{
              opacity: answerOpacity,
              transform: `scale(${answerScale})`,
              marginTop: 40,
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontSize: 52,
                fontWeight: 700,
                color: COLORS.primary,
              }}
            >
              {answerLine}
            </div>
            <div
              style={{
                width: `${underlineWidth}%`,
                height: 4,
                background: COLORS.primary,
                borderRadius: 2,
                margin: '12px auto 0',
              }}
            />
          </div>
        );
      })()}
    </AbsoluteFill>
  );
};
