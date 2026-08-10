'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Clock3, MapPin } from 'lucide-react';
import StatusTag from './StatusTag';
import { getSafeImageUrl } from '@/lib/imageUtils';
import SmartImage from '@/components/app/SmartImage';
import { iosEase, iosSpring } from '@/components/motion/motionPrimitives';

interface ItemCardProps {
  item: any;
  index?: number;
  onPress: (item: any) => void;
}

const AppItemCard = ({ item, index = 0, onPress }: ItemCardProps) => {
  const shouldReduceMotion = useReducedMotion();
  const hoverRotate = index % 2 === 0 ? -1.15 : 1.15;

  return (
    <motion.button
      type="button"
      layout
      className="item-card"
      onClick={() => onPress(item)}
      id={`item-card-${item.id}`}
      aria-label={`Open ${item.title || 'item'} details`}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 22, scale: 0.95, rotate: hoverRotate * 0.45 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0, scale: 1, rotate: 0 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.96 }}
      whileHover={shouldReduceMotion ? undefined : { y: -8, rotate: hoverRotate, scale: 1.012 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.984, y: -2 }}
      transition={shouldReduceMotion ? undefined : {
        layout: iosSpring,
        rotate: { duration: 0.28, ease: iosEase },
        scale: iosSpring,
        y: iosSpring,
        opacity: { duration: 0.24, delay: Math.min(index, 7) * 0.06, ease: iosEase },
      }}
      style={{ cursor: 'pointer' }}
    >
      <div className="item-card-image-container">
        {item.images && item.images.length > 0 ? (
          <SmartImage
            src={getSafeImageUrl(item.images[0])}
            alt={item.title}
            className="item-card-image"
            loading="lazy"
            fallbackLabel={item.title}
            rounded={0}
          />
        ) : (
          <div className="item-card-no-image">No Image</div>
        )}
        <div className="item-card-status"><StatusTag label={item.status === 'rented' ? 'In use' : 'Available'} tone={item.status === 'rented' ? 'active' : 'available'} /></div>
      </div>
      <div className="item-card-content">
        <div className="item-card-title">{item.title}</div>
        <div className="item-card-meta-row">
          <strong>₹{item.daily_rate}<small>/day</small></strong>
          <span className="item-card-distance">
            {String(item.distance || '').toLowerCase().includes('min') ? <Clock3 size={11} /> : <MapPin size={11} />}
            {item.distance || '2 min walk'}
          </span>
        </div>
      </div>
    </motion.button>
  );
};

export default React.memo(AppItemCard);
