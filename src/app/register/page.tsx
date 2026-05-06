'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import styles from './page.module.css';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    societyName: '',
    itemType: '',
  });
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;
    
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong.');
      }

      setStatus('success');
      
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage((err as Error).message || 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <section className={`${styles.splitLayout} ${styles.scale75}`}>
      <aside className={styles.mediaPane}>
        <Image
          src="/sign-up-image.jpeg"
          alt="Loql neighborhood inspiration"
          fill
          priority
          className={styles.mediaImage}
        />
        <div className={styles.mediaOverlay} />
        <div className={styles.mediaQuote}>
          <p className={styles.quoteLine}>Aas-Paas: Connected by heart.</p>
          <h2 className={styles.quoteTitle}>Neighbors sharing smarter, living lighter.</h2>
        </div>
      </aside>

      <div className={styles.formPane}>
        <div className={styles.formTopBar}>
          <span className={styles.brandMark}>Loql</span>
          <Link href="/" className={styles.homeLink}>
            Back to home
          </Link>
        </div>

        <div className={styles.formContainer}>
          <div className={styles.header}>
            <p className={styles.eyebrow}>Register Interest</p>
            <h1 className={styles.title}>Bring Loql to your society</h1>
            <p className={styles.subtitle}>
              Once we hit critical mass in your area, you&apos;ll be the first to know.
            </p>
          </div>

          {status === 'success' ? (
            <div className={`${styles.successMessage} fade-in`}>
              <CheckCircle2 size={48} className={styles.successIcon} />
              <h2>You&apos;re on the list!</h2>
              <p>We&apos;ve recorded your interest for <strong>{formData.societyName}</strong>.</p>
              <p>We&apos;ll notify you as soon as Loql opens in your neighborhood.</p>
              <button
                className={`btn btn-primary ${styles.returnBtn}`}
                onClick={() => window.location.href = '/'}
              >
                Return Home
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={`${styles.form} fade-in`}>
              {status === 'error' && (
                <div className={styles.errorBanner}>{errorMessage}</div>
              )}
              
              <div className={styles.inputGroup}>
                <label htmlFor="name">Full Name <span className={styles.required}>*</span></label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Jane Doe"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="phone">Phone Number (Optional)</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="societyName">Society / Community Name <span className={styles.required}>*</span></label>
                <input
                  id="societyName"
                  name="societyName"
                  type="text"
                  placeholder="e.g. Prestige Shantiniketan"
                  required
                  value={formData.societyName}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="itemType">One item you would definitely rent? <span className={styles.required}>*</span></label>
                <input
                  id="itemType"
                  name="itemType"
                  type="text"
                  placeholder="e.g. Power Drill, Camping Tent, Projector"
                  required
                  value={formData.itemType}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <button
                type="submit"
                className={`btn btn-primary ${styles.submitBtn}`}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? (
                <>
                  <Loader2 size={18} className="spin" style={{ marginRight: 8, animation: 'spin 1s linear infinite' }} />
                  Processing...
                </>
              ) : (
                <>
                  Join Waitlist <ArrowRight size={18} style={{ marginLeft: 8 }} />
                </>
              )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
