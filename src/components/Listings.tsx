import ItemCard from './ItemCard';
import { FEATURED_ITEMS } from '@/lib/data';
import styles from './Listings.module.css';

export default function Listings() {
  return (
    <section className="section container">
      <div className={styles.header}>
         <h2 className={styles.title}>Rent Anything</h2>
         <p className={styles.subtitle}>Discover items available in your neighborhood</p>
      </div>
      
      <div className={styles.grid}>
        {FEATURED_ITEMS.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
