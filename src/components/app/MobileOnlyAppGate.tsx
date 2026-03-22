'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const MOBILE_MQ = '(max-width: 768px)';

type MobileOnlyAppGateProps = {
  children: React.ReactNode;
};

/**
 * `/app` is intended for phone-sized viewports only. Desktop users see a clear notice.
 */
export function MobileOnlyAppGate({ children }: MobileOnlyAppGateProps) {
  const [allow, setAllow] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setAllow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  if (allow === null) {
    return (
      <div className="splash-screen" style={{ minHeight: '100vh', background: 'var(--background)' }}>
        <img src="/logo.png" alt="" className="splash-logo" />
      </div>
    );
  }

  if (!allow) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--background)',
          color: 'var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div className="mitti-noise-layer" aria-hidden="true" />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 420 }}>
          <span className="font-serif" style={{ fontSize: 36, fontWeight: 700, color: 'var(--primary)' }}>
            Loql
          </span>
          <p style={{ marginTop: 20, fontSize: 18, lineHeight: 1.55, color: 'var(--text-secondary)' }}>
            Please use mobile for accessing this.
          </p>
          <div style={{ marginTop: 28 }}>
            <Link href="/" className="btn btn-primary">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
