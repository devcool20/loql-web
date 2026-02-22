'use client';

import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: number;
  borderRadius?: number;
  style?: React.CSSProperties;
}

export const Skeleton = ({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) => {
  return (
    <div
      className="skeleton"
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: `${height}px`,
        borderRadius: `${borderRadius}px`,
        ...style,
      }}
    />
  );
};

export const ItemCardSkeleton = () => (
  <div className="skeleton-card">
    <div className="skeleton-card-image" />
    <div className="skeleton-card-content">
      <Skeleton width="80%" height={14} borderRadius={6} />
      <Skeleton width="50%" height={12} borderRadius={6} />
    </div>
  </div>
);

export const HomeSkeletonGrid = ({ count = 6 }: { count?: number }) => (
  <div className="skeleton-grid">
    {Array.from({ length: count }).map((_, i) => (
      <ItemCardSkeleton key={i} />
    ))}
  </div>
);

export const ListCardSkeleton = () => (
  <div style={{
    display: 'flex',
    background: 'var(--surface)',
    borderRadius: '20px',
    padding: '14px',
    marginBottom: '16px',
    border: '1px solid var(--muted)',
  }}>
    <Skeleton width={80} height={80} borderRadius={14} />
    <div style={{ flex: 1, marginLeft: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
      <Skeleton width="70%" height={14} borderRadius={6} />
      <Skeleton width="40%" height={12} borderRadius={6} />
      <Skeleton width="55%" height={12} borderRadius={6} />
    </div>
  </div>
);

export const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div style={{ padding: '8px 20px 0' }}>
    {Array.from({ length: count }).map((_, i) => (
      <ListCardSkeleton key={i} />
    ))}
  </div>
);
