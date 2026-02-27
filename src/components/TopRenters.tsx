import styles from './TopRenters.module.css';
import { User } from 'lucide-react';
import { TOP_RENTERS } from '@/lib/data';

export default function TopRenters() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2>Top Renters</h2>
          <p>Top renters from each society get free products from brands!</p>
        </div>
        
        <div className={styles.grid}>
          {TOP_RENTERS.map((renter) => (
            <div key={renter.id} className={styles.card}>
              <div className={styles.rankBadge}>{renter.rank}</div>
              <div className={styles.avatarContainer}>
                <div className={styles.genericAvatar}>
                  <User size={40} />
                </div>
              </div>
              <h3 className={styles.name}>{renter.name}</h3>
              <p className={styles.society}>{renter.society}</p>
              
              <div className={styles.earningsContainer}>
                <span className={styles.earningsLabel}>EARNINGS</span>
                <span className={styles.earningsValue}>{renter.earnings}</span>
              </div>
              
              <div className={styles.giftBadge}>
                🎁 Won Free Gift!
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
