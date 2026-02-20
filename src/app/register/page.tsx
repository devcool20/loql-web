'use client';

import { useState } from 'react';
import { AuroraBackground } from '@/components/AuroraBackground';
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
      
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <AuroraBackground showRadialGradient>
      <div className={styles.formContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Bring loql to your society!</h1>
          <p className={styles.subtitle}>
            Register below. Once we hit critical mass in your area, you'll be the first to know!
          </p>
        </div>

        {status === 'success' ? (
          <div className={`${styles.successMessage} fade-in`}>
            <CheckCircle2 size={48} className={styles.successIcon} />
            <h2>You've been added!</h2>
            <p>We've recorded your interest for <strong>{formData.societyName}</strong>.</p>
            <p>Waitlist confirmation sent (virtually). We'll ping you when we launch!</p>
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
                  Register Society <ArrowRight size={18} style={{ marginLeft: 8 }} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </AuroraBackground>
  );
}
