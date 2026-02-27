'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Navbar.module.css';
import { Download } from 'lucide-react';

export default function Navbar() {
  const [logoSrc, setLogoSrc] = useState('/logo.png');

  useEffect(() => {
    // Only add cache busting on the client after mount
    setLogoSrc(`/logo.png?v=${Date.now()}`);
  }, []);

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.navContent}`}>
        <Link href="/" className={styles.logo}>
          <span className={styles.brandName}>loql</span>
        </Link>
        <div className={styles.actions}>
          <Link href="/register" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center' }}>
            Join Waitlist
          </Link>
          <a href="/app" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center' }}>
            Sign In
          </a>
        </div>
      </div>
    </nav>
  );
}
