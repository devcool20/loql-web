'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type DemoStep = {
  id: string;
  title: string;
  moment: string;
  youDo: string;
  appDoes: string;
};

const STEP_IMAGES = {
  dwarHero: '/brand/loql-neighborhood-hero.png',
  kathaMain: '/brand/tent-listing.jpg',
  discoverA:
    'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80',
  discoverB:
    'https://images.unsplash.com/photo-1586208958839-06c17cacdf08?auto=format&fit=crop&w=900&q=80',
} as const;

const STORY_STEPS: DemoStep[] = [
  {
    id: 'need',
    title: 'Need appears',
    moment: 'You need a camping tent for a weekend trip.',
    youDo: 'Start the guided experience.',
    appDoes: 'Shows how borrowing nearby is faster than buying new.',
  },
  {
    id: 'dwar',
    title: 'Open Dwar',
    moment: 'You open Loql and enter your neighborhood context.',
    youDo: 'Continue from the welcome entry.',
    appDoes: 'Sets tone, trust, and clear direction into discovery.',
  },
  {
    id: 'discover',
    title: 'Explore Aas-Paas',
    moment: 'You browse nearby listings in the discovery feed.',
    youDo: 'Open an item card that fits your need.',
    appDoes: 'Surfaces relevant options with local context.',
  },
  {
    id: 'katha',
    title: 'Read Katha',
    moment: 'You read the item story and trust details.',
    youDo: 'Check note, availability, and owner context.',
    appDoes: 'Builds confidence before you request.',
  },
  {
    id: 'samvaad',
    title: 'Complete Samvaad',
    moment: 'You choose dates and send a polite request.',
    youDo: 'Confirm with a short message.',
    appDoes: 'Captures a clear request flow and timeline.',
  },
  {
    id: 'success',
    title: 'Virtual handshake',
    moment: 'Your borrow request is confirmed.',
    youDo: 'Finish the walkthrough.',
    appDoes: 'Completes the trust loop with a success state.',
  },
];

const isMobileViewport = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

const preloadImages = (urls: string[]) => {
  urls.forEach((url) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
  });
};

function DemoPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [stepIndex, setStepIndex] = useState(0);
  const [checkingDevice, setCheckingDevice] = useState(true);

  useEffect(() => {
    if (isMobileViewport()) {
      router.replace('/app');
      return;
    }
    setCheckingDevice(false);

    preloadImages([
      STEP_IMAGES.dwarHero,
      STEP_IMAGES.kathaMain,
      STEP_IMAGES.discoverA,
      STEP_IMAGES.discoverB,
    ]);
  }, [router]);

  useEffect(() => {
    if (checkingDevice) return;
    const requestedStep = searchParams.get('step');
    if (!requestedStep) {
      setStepIndex(0);
      return;
    }
    const idx = STORY_STEPS.findIndex((item) => item.id === requestedStep);
    setStepIndex(idx >= 0 ? idx : 0);
  }, [checkingDevice, searchParams]);

  useEffect(() => {
    if (checkingDevice) return;
    const currentStepId = STORY_STEPS[stepIndex].id;
    if (searchParams.get('step') === currentStepId) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('step', currentStepId);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [checkingDevice, stepIndex, pathname, router, searchParams]);

  const step = useMemo(() => STORY_STEPS[stepIndex], [stepIndex]);
  const setStepById = (id: DemoStep['id']) => {
    const idx = STORY_STEPS.findIndex((item) => item.id === id);
    if (idx >= 0) setStepIndex(idx);
  };

  if (checkingDevice) {
    return (
      <main style={{ minHeight: '100vh', background: 'var(--background)', display: 'grid', placeItems: 'center' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Preparing your experience...</p>
      </main>
    );
  }

  return (
    <main
      style={{
        height: '100vh',
        background: 'var(--background)',
        color: 'var(--text-primary)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="mitti-noise-layer" aria-hidden="true" />
      <div className="demo-aura demo-aura-left" aria-hidden="true" />
      <div className="demo-aura demo-aura-right" aria-hidden="true" />
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1220, width: '100%', margin: '0 auto', padding: '24px 24px 18px' }}>
        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
            <span className="font-serif" style={{ fontSize: 34, color: 'var(--primary)', fontWeight: 700 }}>Loql Guided Demo</span>
            <p style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word' }}>
              A story-style walkthrough of the full experience. On phone, you are routed to <code>/app</code>.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/" className="btn btn-outline">Back to landing</Link>
            <Link href="/app" className="btn btn-primary">Open real app</Link>
          </div>
        </header>
      </div>

      <section style={{ flex: 1, minHeight: 0, maxWidth: 1220, width: '100%', margin: '0 auto', padding: '0 24px 18px' }}>
        <div style={{ height: '100%', display: 'grid', gap: 20, gridTemplateColumns: 'minmax(300px, 460px) minmax(320px, 1fr)', alignItems: 'stretch' }}>
          <aside className="demo-panel" style={{ minWidth: 0, background: 'var(--surface-container-lowest)', border: '1px solid var(--border-light)', borderRadius: 24, padding: 16, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h1 className="font-serif" style={{ fontSize: 30 }}>Experience Walkthrough</h1>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--secondary)', letterSpacing: '0.08em' }}>
                CHAPTER {stepIndex + 1}/{STORY_STEPS.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {STORY_STEPS.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setStepIndex(idx)}
                  className="scale-pressable demo-chip"
                  style={{
                    borderRadius: 999,
                    border: idx === stepIndex ? 'none' : '1px solid var(--border-light)',
                    background: idx === stepIndex ? 'var(--primary)' : 'var(--surface)',
                    color: idx === stepIndex ? 'white' : 'var(--text-secondary)',
                    padding: '7px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {item.title}
                </button>
              ))}
            </div>

            <div key={step.id} className="demo-step-card" style={{ borderRadius: 18, background: 'var(--surface)', border: '1px solid var(--border-light)', padding: 14 }}>
              <h2 className="font-serif" style={{ fontSize: 28, lineHeight: 1.1, marginBottom: 8 }}>{step.title}</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 14 }}>{step.moment}</p>
              <ul style={{ display: 'grid', gap: 12, listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ borderLeft: '3px solid var(--secondary)', paddingLeft: 10 }}>
                  <strong style={{ display: 'block', fontSize: 12, color: 'var(--secondary)' }}>You do</strong>
                  <span style={{ color: 'var(--text-primary)' }}>{step.youDo}</span>
                </li>
                <li style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 10 }}>
                  <strong style={{ display: 'block', fontSize: 12, color: 'var(--primary)' }}>Loql does</strong>
                  <span style={{ color: 'var(--text-primary)' }}>{step.appDoes}</span>
                </li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 12 }}>
              <button
                className="btn btn-outline"
                onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
                disabled={stepIndex === 0}
                style={{ opacity: stepIndex === 0 ? 0.4 : 1 }}
              >
                Back
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setStepIndex((prev) => Math.min(STORY_STEPS.length - 1, prev + 1))}
                disabled={stepIndex === STORY_STEPS.length - 1}
                style={{ opacity: stepIndex === STORY_STEPS.length - 1 ? 0.4 : 1 }}
              >
                Continue
              </button>
            </div>
          </aside>

          <section style={{ display: 'grid', placeItems: 'center', padding: 4, minHeight: 0 }}>
            <div
              className="demo-phone-shell"
              style={{
                height: '100%',
                maxHeight: 700,
                aspectRatio: '9 / 19',
                width: 'auto',
                borderRadius: 34,
                border: '8px solid #1f1714',
                background: 'var(--background)',
                boxShadow: '0 28px 54px rgba(45,49,66,0.22)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 86, height: 18, borderRadius: 999, background: '#1f1714', zIndex: 2 }} />
              <div className="demo-phone-glass" />
              <div key={step.id} className="phone-step" style={{ height: '100%', paddingTop: 34 }}>
                {renderPhoneScreen(step.id, setStepById)}
              </div>
            </div>
          </section>
        </div>
      </section>

      <style jsx global>{`
        .demo-aura {
          position: absolute;
          width: 360px;
          height: 360px;
          border-radius: 999px;
          filter: blur(70px);
          opacity: 0.28;
          pointer-events: none;
          z-index: 0;
          animation: auraFloat 9s ease-in-out infinite;
        }
        .demo-aura-left {
          left: -120px;
          top: 120px;
          background: radial-gradient(circle, rgba(65,179,163,0.55), rgba(65,179,163,0));
        }
        .demo-aura-right {
          right: -140px;
          bottom: 70px;
          background: radial-gradient(circle, rgba(241,115,80,0.55), rgba(241,115,80,0));
          animation-delay: -2.2s;
        }
        .demo-panel {
          animation: demoFadeUp 420ms ease;
        }
        .demo-step-card {
          animation: demoFadeUp 340ms ease;
        }
        .demo-chip {
          transition: transform 180ms ease, box-shadow 180ms ease;
        }
        .demo-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 12px rgba(45,49,66,0.08);
        }
        .demo-phone-shell {
          animation: demoPhoneIn 460ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .demo-hit {
          cursor: pointer;
          transition: transform 180ms ease, box-shadow 180ms ease, filter 180ms ease;
        }
        .demo-hit:hover {
          transform: translateY(-1px);
          filter: brightness(1.02);
        }
        .demo-hit:active {
          transform: scale(0.985);
        }
        .demo-hit-pulse {
          animation: pulseHint 1.8s ease-in-out infinite;
        }
        .demo-phone-glass {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(120deg, rgba(255,255,255,0.08), rgba(255,255,255,0) 26%);
          z-index: 1;
        }
        .phone-step {
          animation: magicStep 420ms cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        @keyframes demoFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes magicStep {
          0% { opacity: 0; transform: translateY(14px) scale(0.985); filter: blur(3px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes demoPhoneIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes auraFloat {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-18px) translateX(10px); }
        }
        @keyframes pulseHint {
          0%, 100% { box-shadow: 0 0 0 0 rgba(241,115,80,0.0); }
          50% { box-shadow: 0 0 0 6px rgba(241,115,80,0.12); }
        }
      `}</style>
    </main>
  );
}

const demoSuspenseFallback = (
  <main style={{ minHeight: '100vh', background: 'var(--background)', display: 'grid', placeItems: 'center' }}>
    <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Preparing your experience...</p>
  </main>
);

export default function DemoPage() {
  return (
    <Suspense fallback={demoSuspenseFallback}>
      <DemoPageContent />
    </Suspense>
  );
}

function renderPhoneScreen(stepId: string, setStepById: (id: DemoStep['id']) => void) {
  if (stepId === 'need') {
    return (
      <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <span className="font-serif" style={{ fontSize: 32, color: 'var(--primary)', fontWeight: 700 }}>Loql</span>
        <div
          className="demo-hit demo-hit-pulse"
          onClick={() => setStepById('dwar')}
          style={{ marginTop: 14, background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 20, padding: 14 }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Saturday plan</p>
          <h3 className="font-serif" style={{ fontSize: 26, marginTop: 6, lineHeight: 1.1 }}>Need a camping tent for two days.</h3>
          <p style={{ marginTop: 8, color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Instead of buying, open Loql and borrow from neighbors nearby.
          </p>
        </div>
        <div className="demo-hit" onClick={() => setStepById('dwar')} style={{ marginTop: 12, borderRadius: 16, border: '1px solid var(--border-light)', background: 'var(--surface)', padding: 10 }}>
          <img
            src={STEP_IMAGES.discoverA}
            alt="Preview item"
            loading="eager"
            decoding="async"
            style={{ width: '100%', height: 154, borderRadius: 12, objectFit: 'cover' }}
          />
        </div>
      </div>
    );
  }

  if (stepId === 'dwar') {
    return (
      <div style={{ height: '100%', display: 'grid', gridTemplateRows: 'minmax(0, 56%) minmax(0, 44%)', minHeight: 0 }}>
        <div style={{ position: 'relative', overflow: 'hidden', minHeight: 0 }}>
          <img
            src={STEP_IMAGES.dwarHero}
            alt="Neighborhood welcome art"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(253,251,247,0.35))' }} />
          <span className="font-serif" style={{ position: 'absolute', top: 14, left: 0, right: 0, textAlign: 'center', fontSize: 26, color: 'var(--primary)', fontWeight: 700, textShadow: '0 1px 2px rgba(255,255,255,0.6)' }}>Loql</span>
        </div>
        <div
          style={{
            padding: '10px 12px 12px',
            background: 'var(--background)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 8,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <h3 className="font-serif" style={{ fontSize: 16, lineHeight: 1.25, margin: 0, flexShrink: 0 }}>
            Discover your neighborhood&apos;s hidden treasures.
          </h3>
          <button
            type="button"
            className="btn btn-primary demo-hit demo-hit-pulse"
            onClick={() => setStepById('discover')}
            style={{
              width: '100%',
              borderRadius: 999,
              padding: '10px 12px',
              flexShrink: 0,
              whiteSpace: 'normal',
              lineHeight: 1.25,
              fontSize: 14,
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            Step Into Your Neighborhood
          </button>
        </div>
      </div>
    );
  }

  if (stepId === 'discover') {
    return (
      <div style={{ padding: 12, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="font-serif" style={{ color: 'var(--primary)', fontSize: 28 }}>Loql</span>
          <div style={{ width: 34, height: 34, borderRadius: 999, background: 'var(--surface-container-high)' }} />
        </div>
        <div style={{ marginTop: 8, borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--border-light)', padding: '9px 13px', color: 'var(--text-secondary)' }}>
          Search your neighborhood...
        </div>
        <div style={{ marginTop: 8, borderRadius: 18, padding: 12, background: 'rgba(65,179,163,0.2)', border: '1px solid rgba(65,179,163,0.28)' }}>
          <p style={{ fontSize: 12, color: 'var(--secondary)', fontWeight: 700 }}>The Loql Hero</p>
          <h4 className="font-serif" style={{ fontSize: 22, marginTop: 5, lineHeight: 1.1 }}>Borrow what you need from trusted neighbors.</h4>
        </div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, flex: 1 }}>
          {[
            { name: 'Drill Kit', image: STEP_IMAGES.discoverA },
            { name: 'Microwave', image: STEP_IMAGES.discoverB },
          ].map((item) => (
            <div
              key={item.name}
              className="demo-hit"
              onClick={() => setStepById('katha')}
              style={{ background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 18, padding: 12 }}
            >
              <img
                src={item.image}
                alt={item.name}
                loading="eager"
                decoding="async"
                style={{ width: '100%', height: 108, borderRadius: 12, objectFit: 'cover', background: 'var(--surface-container-high)' }}
              />
              <p style={{ marginTop: 8, fontSize: 13, fontWeight: 700 }}>{item.name}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (stepId === 'katha') {
    return (
      <div style={{ padding: 12, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <img
          src={STEP_IMAGES.kathaMain}
          alt="Tent listing"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          style={{ height: 188, width: '100%', borderRadius: 20, objectFit: 'cover', background: 'var(--surface-container-high)' }}
        />
        <div style={{ marginTop: 10, borderRadius: 14, padding: 10, background: '#FFF9E6', border: '1px solid rgba(141,153,174,0.2)' }}>
          <p className="font-serif" style={{ fontStyle: 'italic', fontSize: 16, lineHeight: 1.3 }}>
            "Easy setup, waterproof fabric, and perfect for a 2-night weekend."
          </p>
        </div>
        <h3 className="font-serif" style={{ fontSize: 24, marginTop: 8 }}>2-Person Tent</h3>
        <p style={{ color: 'var(--secondary)', fontWeight: 700 }}>₹350/day</p>
        <button className="btn btn-primary demo-hit demo-hit-pulse" onClick={() => setStepById('samvaad')} style={{ width: '100%', marginTop: 10, borderRadius: 999 }}>Borrow with Love</button>
      </div>
    );
  }

  if (stepId === 'samvaad') {
    return (
      <div style={{ padding: 12, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <h3 className="font-serif" style={{ fontSize: 26 }}>Samvaad</h3>
        <div style={{ marginTop: 8, background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Borrow from Priya • Verified Neighbor</p>
        </div>
        <div style={{ marginTop: 8, background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Dates</p>
          <p style={{ fontWeight: 700 }}>Sat, 6 Apr → Mon, 8 Apr</p>
        </div>
        <div style={{ marginTop: 8, background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 12, minHeight: 76 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Say hi to your neighbor...</p>
        </div>
        <button className="btn btn-primary demo-hit demo-hit-pulse" onClick={() => setStepById('success')} style={{ width: '100%', marginTop: 10, borderRadius: 999 }}>Confirm Request</button>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 22 }}>
      <div>
        <div style={{ width: 86, height: 86, borderRadius: 999, background: 'rgba(65,179,163,0.22)', margin: '0 auto', display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 999, background: 'var(--secondary)' }} />
        </div>
        <h3 className="font-serif" style={{ fontSize: 34, marginTop: 14 }}>Virtual Handshake</h3>
        <p style={{ marginTop: 8, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Booking confirmed. Pickup details shared in chat.
        </p>
      </div>
    </div>
  );
}
