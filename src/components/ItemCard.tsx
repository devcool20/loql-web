'use client';
import { MapPin, Loader2, Check } from 'lucide-react';
import { useState } from 'react';
import styles from './ItemCard.module.css';

export default function ItemCard({ item }: { item: any }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleRent = () => {
    if (status !== 'idle') return;
    
    setStatus('loading');
    // Simulate transaction
    setTimeout(() => {
      setStatus('success');
      // Reset after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <div className={styles.card}>
      <div className={styles.imageContainer}>
        {item.image ? (
          <img src={item.image} alt={item.title} className={styles.image} />
        ) : (
          <div className={styles.placeholder}>
            <span>No Image</span>
          </div>
        )}
        <div className={styles.priceTag}>₹{item.price}/day</div>
      </div>
      <div className={styles.content}>
        <div className={styles.details}>
          <h3 className={styles.title}>{item.title}</h3>
          <div className={styles.meta}>
            <MapPin size={14} />
            <span>{item.distance}</span>
          </div>
        </div>
        
        <button 
          className={`btn ${status === 'success' ? 'btn-success animate-success' : 'btn-primary'} ${status === 'loading' ? 'btn-loading' : ''} ${styles.rentButton}`}
          onClick={handleRent}
          disabled={status !== 'idle'}
        >
          {status === 'loading' ? (
            <>
              <Loader2 size={18} className={styles.loadingIcon} />
              <span>Processing...</span>
            </>
          ) : status === 'success' ? (
            <>
              <Check size={18} style={{ marginRight: 8 }} />
              <span>Rented!</span>
            </>
          ) : (
            'Rent Now'
          )}
        </button>
      </div>
    </div>
  );
}
