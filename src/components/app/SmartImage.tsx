'use client';

import React, { useEffect, useState } from 'react';
import { getSafeImageUrl } from '@/lib/imageUtils';

type SmartImageProps = {
  src?: string | null;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
  fallbackLabel?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  rounded?: number | string;
  onClick?: () => void;
};

const fallbackInitial = (label?: string) => (label || 'L').trim().charAt(0).toUpperCase();

const SmartImage = ({
  src,
  alt = '',
  className,
  style,
  containerStyle,
  fallbackLabel,
  loading = 'lazy',
  fetchPriority = 'auto',
  rounded,
  onClick,
}: SmartImageProps) => {
  const safeSrc = getSafeImageUrl(src);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(!safeSrc);

  useEffect(() => {
    setLoaded(false);
    setFailed(!safeSrc);

    if (!safeSrc) return;

    const image = new Image();
    image.decoding = 'async';
    image.src = safeSrc;
    image.onload = () => setLoaded(true);
    image.onerror = () => setFailed(true);
  }, [safeSrc]);

  const radius = rounded ?? style?.borderRadius ?? containerStyle?.borderRadius;

  return (
    <span
      className="smart-image-shell"
      style={{
        position: 'relative',
        display: 'block',
        width: style?.width ?? containerStyle?.width ?? '100%',
        height: style?.height ?? containerStyle?.height ?? '100%',
        overflow: 'hidden',
        borderRadius: radius,
        background: 'var(--img-placeholder)',
        ...containerStyle,
      }}
      onClick={onClick}
    >
      {!loaded && !failed && <span className="smart-image-shimmer" aria-hidden="true" />}
      {failed ? (
        <span className="smart-image-fallback" aria-hidden={!alt}>
          {fallbackInitial(fallbackLabel || alt)}
        </span>
      ) : (
        <img
          src={safeSrc}
          alt={alt}
          className={className}
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'scale(1)' : 'scale(1.025)',
            transition: 'opacity 240ms var(--ease-out), transform 420ms var(--ease-out)',
            ...style,
          }}
        />
      )}
    </span>
  );
};

export default SmartImage;
