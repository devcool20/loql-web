import { ShieldCheck, MapPin, Zap, Lock } from 'lucide-react';
import styles from './Ecosystem.module.css';

export default function Ecosystem() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <span className={styles.tagline}>The Loql Ecosystem</span>
          <h2>The future of neighborhood sharing</h2>
          <p>
            Loql is high-trust rental engine designed to unlock the "frozen capital" trapped inside modern gated communities. 
            We believe proximity equals trust.
          </p>
        </div>

        <div className={styles.grid}>
          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <MapPin size={32} />
            </div>
            <h3>Walk-to-Borrow</h3>
            <p>
              The most efficient way to access an asset is not to buy it, but to walk 200 meters and borrow it from a neighbor. 
              Zero logistics cost, zero packing, and zero carbon footprint.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <ShieldCheck size={32} />
            </div>
            <h3>Smart Trust Layer</h3>
            <p>
              Mandatory "Digital Handshakes" and real-time photo logs verify condition instantly. 
              We turn thousands of individual apartments into a managed community library.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <Lock size={32} />
            </div>
            <h3>Financial Safety</h3>
            <p>
              Smart escrow engines manage security deposits automatically. 
              Payouts are instant, and your assets are always protected by our high-fidelity verification system.
            </p>
          </div>

          <div className={styles.card}>
            <div className={styles.iconWrapper}>
              <Zap size={32} />
            </div>
            <h3>Operational Flywheel</h3>
            <p>
              By hardcoding trust into a digital handshake, we enable seamless peer-to-peer exchange 
              that makes idle assets liquid and productive within your own society.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
