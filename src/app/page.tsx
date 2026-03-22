import Link from 'next/link';

export default function Home() {
  return (
    <main className="landing-page" style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)', position: 'relative', overflowX: 'hidden' }}>
      <div className="mitti-noise-layer" aria-hidden="true" />
      <div className="landing-aura landing-aura-left" aria-hidden="true" />
      <div className="landing-aura landing-aura-right" aria-hidden="true" />

      <div style={{ position: 'relative', zIndex: 1, paddingBottom: 72 }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 30, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', background: 'rgba(253, 251, 247, 0.9)', borderBottom: '1px solid var(--border-light)' }}>
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 74, gap: 12, flexWrap: 'wrap', paddingTop: 8, paddingBottom: 8 }}>
            <span className="font-serif" style={{ fontSize: 32, color: 'var(--primary)', fontWeight: 700, letterSpacing: '-0.02em' }}>Loql</span>
          </div>
        </header>

        <section className="container" style={{ paddingTop: 44 }}>
          <div style={{ display: 'grid', gap: 26, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignItems: 'center' }}>
            <div className="landing-fadeup">
              <span style={{ display: 'inline-flex', borderRadius: 999, padding: '7px 12px', border: '1px solid rgba(65,179,163,0.3)', background: 'rgba(65,179,163,0.1)', color: 'var(--secondary)', fontSize: 12, letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase' }}>
                The Urban Bazaar Experience
              </span>
              <h1 className="font-serif" style={{ fontSize: 'clamp(2.1rem, 5.3vw, 4.2rem)', lineHeight: 1.03, letterSpacing: '-0.02em', marginTop: 14 }}>
                Borrow what you need from
                <br />
                your own neighborhood.
              </h1>
              <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: 660, marginTop: 14 }}>
                Loql combines warm storytelling with practical renting. Discover items in Aas-Paas, trust the Katha,
                request through Samvaad, and finish with a confident handshake.
              </p>
              <div style={{ marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link href="/app" className="btn btn-primary">I&apos;m on mobile</Link>
                <Link href="/demo?step=need" className="btn btn-outline">Show me full walkthrough</Link>
              </div>
            </div>

            <div className="landing-fadeup" style={{ display: 'grid', placeItems: 'center' }}>
              <div className="landing-phone-promo" style={{ width: 286, aspectRatio: '9 / 19', borderRadius: 32, border: '8px solid #1f1714', overflow: 'hidden', background: 'var(--background)', boxShadow: '0 22px 44px rgba(45,49,66,0.2)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 80, height: 16, borderRadius: 999, background: '#1f1714', zIndex: 2 }} />
                <div style={{ height: '100%', paddingTop: 30, display: 'flex', flexDirection: 'column' }}>
                  <img
                    src="/brand/loql-neighborhood-hero.png"
                    alt="Loql welcome art"
                    loading="eager"
                    decoding="async"
                    style={{ width: '100%', height: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '16px 14px 18px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1, textAlign: 'center' }}>
                    <span className="font-serif" style={{ fontSize: 30, fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                      Loql
                    </span>
                    <h3 className="font-serif" style={{ fontSize: 26, lineHeight: 1.08, margin: 0 }}>
                      Discover your neighborhood&apos;s hidden treasures.
                    </h3>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container" style={{ paddingTop: 30 }}>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            {[
              { id: 'dwar', name: 'The Dwar', body: 'Warm onboarding and neighborhood entry.', color: 'rgba(241,115,80,0.14)' },
              { id: 'discover', name: 'Aas-Paas', body: 'Search, categories, and bazaar-style discovery.', color: 'rgba(65,179,163,0.16)' },
              { id: 'katha', name: 'Katha', body: 'Story-rich details and trust before decisions.', color: 'rgba(141,153,174,0.15)' },
              { id: 'samvaad', name: 'Samvaad', body: 'Simple date + message request flow to book.', color: 'rgba(246,76,114,0.14)' },
            ].map((item, i) => (
              <Link key={item.name} href={`/demo?step=${item.id}`} className="scale-pressable-up" style={{ borderRadius: 22, padding: 18, border: '1px solid var(--border-light)', background: item.color, boxShadow: 'var(--shadow-sm)', transform: `rotate(${i % 2 === 0 ? '-0.6deg' : '0.6deg'})` }}>
                <h3 className="font-serif" style={{ fontSize: 30, color: 'var(--text-primary)', marginBottom: 6 }}>{item.name}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{item.body}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="container" style={{ paddingTop: 34 }}>
          <div style={{ borderRadius: 28, border: '1px solid var(--border-light)', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', padding: '22px 20px' }}>
            <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
              <div>
                <h2 className="font-serif" style={{ fontSize: 36, lineHeight: 1.05 }}>See and book in minutes.</h2>
                <p style={{ marginTop: 10, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                  The demo now mirrors a real buyer journey: Need → Dwar → Aas-Paas → Katha → Samvaad → success.
                  Every key action is clickable and advances the story naturally.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                <Link href="/demo?step=need" className="btn btn-primary">Play full demo</Link>
                <Link href="/app" className="btn btn-outline">Jump to /app</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
