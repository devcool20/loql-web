'use client';
import styles from './ProductWorkingDemo.module.css';
import VideoPlayer from './VideoPlaceholder';

export default function ProductWorkingDemo() {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <span className={styles.tagline}>See it in action</span>
          <h2>Renter & Rentee Workflow</h2>
          <p>
            Watch how easy it is to list, find, and rent items using loql. 
            Our seamless handover process ensures security for both parties.
          </p>
        </div>

        <div className={styles.videoGrid}>
          <div className={styles.videoWrapper}>
            <div className={styles.label}>Full App Walkthrough</div>
            <VideoPlayer 
              videoUrl="/product-working.mp4" 
              title="Full App Walkthrough"
              description="From listing an item as a rentee to requesting and receiving as a renter."
            />
          </div>
          
          <div className={styles.info}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>01</div>
              <div className={styles.stepContent}>
                <h3>The Renter Flow</h3>
                <p>Browse local listings, check item availability, and send a request with one tap.</p>
              </div>
            </div>
            
            <div className={styles.step}>
              <div className={styles.stepNumber}>02</div>
              <div className={styles.stepContent}>
                <h3>The Rentee (Owner) Flow</h3>
                <p>Receive requests, review the renter's profile, and approve with a secure digital handshake.</p>
              </div>
            </div>
            
            <div className={styles.step}>
              <div className={styles.stepNumber}>03</div>
              <div className={styles.stepContent}>
                <h3>Secure Handover</h3>
                <p>Verify item condition through the app during physical handover for peace of mind.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
