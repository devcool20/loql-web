import React from 'react';
import { COLORS } from '../theme';

type PhoneMockupProps = {
  children: React.ReactNode;
  scale?: number;
};

export const PhoneMockup: React.FC<PhoneMockupProps> = ({
  children,
  scale = 1,
}) => {
  const phoneWidth = 340;
  const phoneHeight = 700;
  const borderRadius = 44;
  const bezelWidth = 8;

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: phoneWidth + bezelWidth * 2,
          height: phoneHeight + bezelWidth * 2,
          borderRadius: borderRadius + bezelWidth,
          background: COLORS.primary,
          padding: bezelWidth,
          boxShadow: '0 40px 80px rgba(0,0,0,0.25), 0 10px 20px rgba(0,0,0,0.15)',
          position: 'relative',
        }}
      >
        {/* Notch */}
        <div
          style={{
            position: 'absolute',
            top: bezelWidth,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 28,
            background: COLORS.primary,
            borderRadius: '0 0 18px 18px',
            zIndex: 10,
          }}
        />
        {/* Screen */}
        <div
          style={{
            width: phoneWidth,
            height: phoneHeight,
            borderRadius: borderRadius,
            background: COLORS.background,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {children}
        </div>
        {/* Home indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: bezelWidth + 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 100,
            height: 4,
            background: 'rgba(255,255,255,0.4)',
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
};
