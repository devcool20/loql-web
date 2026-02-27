'use client';
import Link from 'next/link';
import styles from './Hero.module.css';
import { Download, PlayCircle } from 'lucide-react';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className="container">
        <h1 className={`${styles.title} fade-in`}>
          Rent things from<br/>your neighbors
        </h1>
        <p className={`${styles.subtitle} fade-in`} style={{animationDelay: '0.1s'}}>
          SocietyShare is now <strong>loql</strong>. The easiest way to rent items within your community.
          Save money, earn from idle items, and connect with neighbors.
        </p>
        
        <div className={`${styles.ctaGroup} fade-in`} style={{animationDelay: '0.2s'}}>
          <a href="/loql.apk" download className="btn btn-primary">
            <Download size={20} style={{marginRight: 8}} />
            Download APK
          </a>
          <button 
            className="btn btn-outline"
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <PlayCircle size={20} style={{marginRight: 8}} />
            How it works
          </button>
        </div>
      </div>
    </section>
  );
}
