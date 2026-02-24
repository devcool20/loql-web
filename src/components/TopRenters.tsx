import styles from './TopRenters.module.css';
import { Gift, Award, Sparkles } from 'lucide-react';

export default function TopRenters() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2>Top Renters Rewards</h2>
          <p>How top contributors get rewarded with premium products from top brands</p>
        </div>
        <div className={styles.rewardsCard}>
          <div className={styles.rewardsContent}>
            <div className={styles.rewardsIcon}>
              <Gift size={28} />
            </div>
            <h3>Earn rewards as a top contributor</h3>
            <p>
              Become one of the top renters in your society by actively lending and renting items. 
              Top contributors get exclusive access to premium products from leading brands—free gifts, 
              early access to new releases, and special perks as a thank-you for building your community.
            </p>
            <ul className={styles.rewardsList}>
              <li>
                <Award size={18} />
                <span>Rank among the most active renters in your society</span>
              </li>
              <li>
                <Sparkles size={18} />
                <span>Receive curated products from top brands as rewards</span>
              </li>
              <li>
                <Gift size={18} />
                <span>Get exclusive perks and early access to new items</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
