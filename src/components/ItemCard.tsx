import { MapPin } from 'lucide-react';
import styles from './ItemCard.module.css';

export default function ItemCard({ item }: { item: any }) {
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
        <h3 className={styles.title}>{item.title}</h3>
        <div className={styles.meta}>
          <MapPin size={14} />
          <span>{item.distance}</span>
        </div>
      </div>
    </div>
  );
}
