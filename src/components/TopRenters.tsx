import styles from './TopRenters.module.css';
import { TOP_RENTERS } from '@/lib/data';
import { Gift } from 'lucide-react';

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
                <div className={`${styles.rankBadge} ${renter.rank === 1 ? styles.rank1 : ''}`}>
                  {renter.rank}
                </div>
                {renter.avatar && (
                  <img src={renter.avatar} alt={renter.name} className={styles.avatar} />
                )}
                <h3 className={styles.name}>{renter.name}</h3>
                <p className={styles.society}>{renter.society}</p>
                
                <div className={styles.earnings}>
                  <span className={styles.earningsLabel}>Earnings</span>
                  <div className={styles.earningsValue}>{renter.earnings}</div>
                </div>

                {renter.rank <= 3 && (
                  <div className={styles.giftBadge}>
                    <Gift size={16} />
                    <span>Won Free Gift!</span>
                  </div>
                )}
             </div>
          ))}
        </div>
      </div>
    </section>
  )
}
