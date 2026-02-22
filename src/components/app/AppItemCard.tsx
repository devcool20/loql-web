'use client';

import React from 'react';

interface ItemCardProps {
  item: any;
  onPress: (item: any) => void;
}

const AppItemCard = ({ item, onPress }: ItemCardProps) => {
  return (
    <div
      className="item-card scale-pressable"
      onClick={() => onPress(item)}
      id={`item-card-${item.id}`}
      style={{ cursor: 'pointer' }}
    >
      <div className="item-card-image-container">
        {item.images && item.images.length > 0 ? (
          <img
            src={item.images[0]}
            alt={item.title}
            className="item-card-image"
            loading="lazy"
          />
        ) : (
          <div className="item-card-no-image">No Image</div>
        )}
        <div className="item-card-price-tag">₹{item.daily_rate}/day</div>
      </div>
      <div className="item-card-content">
        <div className="item-card-title">{item.title}</div>
        <div className="item-card-distance">{item.distance || '2 mins away'}</div>
      </div>
    </div>
  );
};

export default React.memo(AppItemCard);
