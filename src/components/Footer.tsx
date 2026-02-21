import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.content}`}>
        <div className={styles.brand}>
           <div className={styles.logo}>
             <span>loql</span>
           </div>
           <p className={styles.description}>
             SocietyShare is now loql. Renting simplified for communities.
           </p>
        </div>
        
        <div className={styles.links}>
           <div className={styles.linkGroup}>
             <h4>Company</h4>
             <div className={styles.linkList}>
               <Link href="#">About</Link>
               <Link href="#">Careers</Link>
               <Link href="#">Blog</Link>
             </div>
           </div>
           <div className={styles.linkGroup}>
             <h4>Support</h4>
             <div className={styles.linkList}>
               <Link href="#">Help Center</Link>
               <Link href="/terms">Terms of Service</Link>
               <Link href="/privacy">Privacy Policy</Link>
             </div>
           </div>
        </div>
      </div>
      <div className={`container ${styles.copyright}`}>
        © {new Date().getFullYear()} loql. All rights reserved.
      </div>
    </footer>
  );
}
