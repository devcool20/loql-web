'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.classList.contains('scroll-revealed')) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add('scroll-revealed'), 50);
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px 60px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function usePageLoadReveal(index: number) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const timer = setTimeout(() => el.classList.add('page-load-active'), 100 + index * 120);
    return () => clearTimeout(timer);
  }, [index]);
  return ref;
}

/** Viewport ≤768px — matches common “mobile” breakpoint for app install / PWA flows */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isMobile;
}

type NavSectionId = 'hero' | 'bazaar' | 'katha' | 'community';

function useActiveNavSection() {
  const [active, setActive] = useState<NavSectionId>('hero');
  useEffect(() => {
    const ids: NavSectionId[] = ['hero', 'bazaar', 'katha', 'community'];
    const run = () => {
      const offset = 120;
      const y = window.scrollY + offset;
      let current: NavSectionId = 'hero';
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        if (y >= el.offsetTop - 1) current = id;
      }
      setActive(current);
    };
    run();
    window.addEventListener('scroll', run, { passive: true });
    window.addEventListener('resize', run);
    return () => {
      window.removeEventListener('scroll', run);
      window.removeEventListener('resize', run);
    };
  }, []);
  return active;
}

const heroImg = '/brand/loql-neighborhood-hero.png';

/** Indian-context listing imagery (Unsplash — stable IDs) */
const bazaarCamImg =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7nlz3EcdDm_2NLBq6gqugJ1iYNbRIR0aPLw&s?w=800&q=80&auto=format&fit=crop';
const bazaarApplianceImg =
  'https://assets.myntassets.com/w_360,q_50,,dpr_2,fl_progressive,f_webp/assets/images/2025/FEBRUARY/17/DHxs6eo5_71604aeeca584aefb1c2d443f3aa0d5c.jpg?w=800&q=80&auto=format&fit=crop';
const bazaarBooksImg =
  'https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRIOLW-FLxyKy9r31_5bNscfkA8qfKVhHKuvI68ZGwPJdwvq4uQvYQqXISHiZyFPiKlC7bkCklL5SRB31JfK1DvQNQ7Y5gTScslzTk8pExorS7Dd3rmFuFkHTkr9Au_ZVyCvBYmTmRt99s&usqp=CAc?w=800&q=80&auto=format&fit=crop';

const avatarImg =
  'https://img.freepik.com/premium-vector/portrait-indian-traditional-style-beautiful-girl-face-avatar-vector-illustration_55610-7375.jpg?w=128&h=128&fit=crop&q=80';

const kathaKitchenImg =
  'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=900&q=80&auto=format&fit=crop';

/** Indian society / community — Unsplash (street life, neighbourhood gathering) */
const impactImgLeft = '/left-image-1.png';
const impactImgRight = '/right-image-1.png';

function FloatingCardTop() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => ref.current?.classList.add('float-card-visible'), 700);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div
      ref={ref}
      className="absolute -top-10 -right-4 md:right-10 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl z-20 border border-white/50 w-64 animate-bounce-slow hidden md:block opacity-0 transition-opacity duration-600"
      id="hero-float-top"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary">
          <span className="material-symbols-outlined">volunteer_activism</span>
        </div>
        <div>
          <p className="text-sm font-bold text-on-surface">Priya is lending</p>
          <p className="text-xs text-on-surface-variant">Prestige Svachh 5L pressure cooker &bull; 200m away</p>
        </div>
      </div>
    </div>
  );
}

function FloatingCardBottom() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const timer = setTimeout(() => ref.current?.classList.add('float-card-visible'), 900);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div
      ref={ref}
      className="absolute bottom-10 -left-4 md:-left-10 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl z-20 border border-white/50 w-72 opacity-0 transition-opacity duration-600"
      id="hero-float-bottom"
    >
      <div className="flex items-center gap-4">
        <Image
          className="rounded-full border-2 border-primary object-cover"
          src={avatarImg}
          alt=""
          width={48}
          height={48}
          sizes="48px"
          unoptimized
        />
        <div>
          <p className="text-sm font-bold text-on-surface">Ananya shared a story</p>
          <div className="flex items-center gap-1 text-secondary">
            <span className="material-symbols-outlined text-sm">stars</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Verified Neighbor</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopAppDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-on-background/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="desktop-app-title"
      onClick={onClose}
    >
      <div
        className="max-w-md rounded-2xl bg-background p-6 shadow-2xl border border-stone-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="desktop-app-title" className="font-headline text-2xl text-on-background mb-3">
          Open Loql on your phone
        </h2>
        <p className="text-on-surface-variant text-base leading-relaxed mb-6">
          &quot;Step into your neighborhood&quot; works in the Loql app. Please switch to your mobile screen and open{' '}
          <span className="font-semibold text-on-background">loql.in</span> there — or scan the QR from a friend’s invite.
        </p>
        <button
          type="button"
          className="w-full rounded-full bg-primary px-6 py-3 font-bold text-white soft-pop"
          onClick={onClose}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const activeNav = useActiveNavSection();
  const [desktopAppOpen, setDesktopAppOpen] = useState(false);

  const goStepIntoNeighbourhood = useCallback(() => {
    if (isMobile) {
      router.push('/app');
    } else {
      setDesktopAppOpen(true);
    }
  }, [isMobile, router]);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const heroRef = usePageLoadReveal(0);
  const heroImgRef = usePageLoadReveal(1);
  const bazaarRef = useScrollReveal();
  const kathaCardRef = useScrollReveal();
  const kathaTextRef = useScrollReveal();
  const samvaadHeaderRef = useScrollReveal();
  const samvaadCardsRef = useScrollReveal();
  const samvaadCtaRef = useScrollReveal();
  const trustRef = useScrollReveal();

  return (
    <main className="bg-background text-on-background font-body selection:bg-primary/30 relative overflow-x-hidden">
      <div className="mitti-noise" aria-hidden="true" />
      <DesktopAppDialog open={desktopAppOpen} onClose={() => setDesktopAppOpen(false)} />

      {/* ── TopNavBar (narrow pill bar + visible primary CTA) ── */}
      <header className="fixed top-0 left-0 right-0 z-50 pointer-events-none px-3 pt-3 sm:pt-4">
        <nav
          className="pointer-events-auto mx-auto flex max-w-5xl items-center justify-between gap-2 rounded-full border border-stone-200/90 bg-white/95 py-2 pl-3 pr-2 shadow-md shadow-stone-900/5 backdrop-blur-xl md:gap-3 md:py-2.5 md:pl-5 md:pr-3"
          aria-label="Main"
        >
          <a
            href="#hero"
            className="shrink-0 pl-1 text-xl font-black tracking-tight text-[#f17350] transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] md:text-2xl"
          >
            Loql
          </a>

          <div className="hidden min-w-0 md:flex md:flex-1 md:justify-center">
            <div className="flex items-center gap-0.5 rounded-full bg-stone-100/80 p-1">
              <button
                type="button"
                onClick={() => scrollToId('hero')}
                className={`rounded-full px-3 py-1.5 text-xs font-bold tracking-tight transition-all duration-200 ease-out lg:px-4 lg:text-[13px] ${
                  activeNav === 'hero'
                    ? 'bg-white text-[#f17350] shadow-sm ring-1 ring-stone-200/80'
                    : 'text-[#2D3142] hover:bg-white/70 hover:text-[#f17350]'
                }`}
              >
                Neighborhoods
              </button>
              <button
                type="button"
                onClick={() => scrollToId('community')}
                className={`rounded-full px-3 py-1.5 text-xs font-bold tracking-tight transition-all duration-200 ease-out lg:px-4 lg:text-[13px] ${
                  activeNav === 'community'
                    ? 'bg-white text-[#f17350] shadow-sm ring-1 ring-stone-200/80'
                    : 'text-[#2D3142] hover:bg-white/70 hover:text-[#f17350]'
                }`}
              >
                Community
              </button>
              <button
                type="button"
                onClick={() => scrollToId('bazaar')}
                className={`rounded-full px-3 py-1.5 text-xs font-bold tracking-tight transition-all duration-200 ease-out lg:px-4 lg:text-[13px] ${
                  activeNav === 'bazaar'
                    ? 'bg-white text-[#f17350] shadow-sm ring-1 ring-stone-200/80'
                    : 'text-[#2D3142] hover:bg-white/70 hover:text-[#f17350]'
                }`}
              >
                Bazaar
              </button>
              <button
                type="button"
                onClick={() => scrollToId('katha')}
                className={`rounded-full px-3 py-1.5 text-xs font-bold tracking-tight transition-all duration-200 ease-out lg:px-4 lg:text-[13px] ${
                  activeNav === 'katha'
                    ? 'bg-white text-[#f17350] shadow-sm ring-1 ring-stone-200/80'
                    : 'text-[#2D3142] hover:bg-white/70 hover:text-[#f17350]'
                }`}
              >
                Stories
              </button>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="material-symbols-outlined flex h-10 w-10 items-center justify-center rounded-full text-[#2D3142] transition-colors duration-200 hover:bg-stone-100 hover:text-[#f17350] active:scale-95"
              aria-label="Search listings"
              onClick={() => scrollToId('bazaar')}
            >
              search
            </button>
            <button
              type="button"
              onClick={goStepIntoNeighbourhood}
              className="rounded-full bg-[#f17350] px-3 py-2 text-center text-xs font-bold leading-tight text-white shadow-md shadow-[#f17350]/35 transition-all duration-200 hover:bg-[#e06542] hover:shadow-lg hover:shadow-[#f17350]/45 active:scale-[0.97] sm:px-5 sm:py-2.5 sm:text-sm"
            >
              <span className="hidden min-[400px]:inline">Step Into Your Neighborhood</span>
              <span className="min-[400px]:hidden">Step In</span>
            </button>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section
        id="hero"
        className="relative scroll-mt-28 pt-32 sm:pt-36 md:pt-40 pb-12 md:pb-20 px-4 sm:px-8"
      >
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" aria-hidden="true" />
        <div
          className="absolute top-1/2 -right-20 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl opacity-50 pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-8 lg:gap-12 xl:gap-16 items-start">
          <div ref={heroRef} className="reveal-stagger z-10 min-w-0 max-w-full lg:max-w-[min(100%,36rem)] xl:max-w-xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container font-semibold text-sm mb-6">
              Aas-Paas: Connected by Heart
            </span>
            <h1 className="font-headline text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl text-on-background leading-[1.12] mb-6 text-balance">
              Discover your neighborhood&apos;s <span className="text-primary italic">hidden treasures.</span>
            </h1>
            <p className="text-lg sm:text-xl text-on-surface-variant max-w-lg mb-8 leading-relaxed">
              Loql turns every balcony and doorstep into a library of shared experiences. Borrow a mixer grinder for Diwali
              sweets, lend your DSLR for a cousin&apos;s wedding, or find a story — all aas-paas.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="px-8 py-4 bg-primary text-white rounded-full font-bold text-lg soft-pop flex items-center gap-2"
              >
                Start Exploring
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link
                href="/demo?step=need"
                className="px-8 py-4 bg-white/80 backdrop-blur text-on-surface rounded-full font-bold text-lg border border-stone-200 soft-pop"
              >
                How it works
              </Link>
            </div>
          </div>

          <div ref={heroImgRef} className="reveal-stagger relative min-w-0 w-full">
            <div className="relative w-full rounded-2xl overflow-hidden bg-surface-container shadow-2xl ring-1 ring-stone-200/60">
              {/* Full illustration visible (no bottom crop); letterboxing on wide screens */}
              <Image
                className="mx-auto block h-auto w-full max-h-[min(88vh,820px)] object-contain object-center"
                src={heroImg}
                alt="Illustration of neighbours sharing items across balconies in an Indian neighbourhood, with a phone and QR code"
                width={1600}
                height={900}
                priority
                fetchPriority="high"
                sizes="(max-width: 1023px) 100vw, 50vw"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/50 to-transparent" />
            </div>
            <FloatingCardTop />
            <FloatingCardBottom />
          </div>
        </div>
      </section>

      {/* ── Bazaar ── */}
      <section id="bazaar" className="scroll-mt-28 py-24 px-8 bg-surface-container">
        <div className="max-w-screen-2xl mx-auto">
          <div ref={bazaarRef} className="reveal-scroll">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div>
                <h2 className="font-headline text-5xl text-on-background mb-4">The Aas-Paas Bazaar</h2>
                <p className="text-on-surface-variant text-lg max-w-xl">
                  Curated picks from the people you pass by every day — pressure cookers to UPSC notes.
                </p>
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                  aria-label="Previous"
                >
                  <span className="material-symbols-outlined">west</span>
                </button>
                <button
                  type="button"
                  className="w-12 h-12 rounded-full border border-stone-200 flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                  aria-label="Next"
                >
                  <span className="material-symbols-outlined">east</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bazaar-card bg-white p-2 rounded-lg shadow-sm">
                <div className="relative mb-4 h-64 overflow-hidden rounded-lg">
                  <Image
                    src={bazaarCamImg}
                    alt="DSLR camera kit"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1023px) 50vw, 25vw"
                  />
                  <span className="absolute top-3 right-3 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-primary">
                    AVAILABLE
                  </span>
                </div>
                <div className="px-3 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-xl text-on-background">Sony Alpha mirrorless kit</h3>
                    <div className="diya-glow cursor-pointer">
                      <span className="material-symbols-outlined diya-icon text-on-surface-variant transition-all">
                        local_fire_department
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-4">Lent by Arjun in Dwarka Sector 6</p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-black">
                      ₹0 <span className="text-[10px] text-on-surface-variant font-normal">/ DAY</span>
                    </span>
                    <button type="button" className="text-secondary font-bold text-sm flex items-center gap-1">
                      View Details <span className="material-symbols-outlined text-sm">arrow_outward</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bazaar-card bg-white p-2 rounded-lg shadow-sm mt-8">
                <div className="relative mb-4 h-80 overflow-hidden rounded-lg">
                  <Image
                    src={bazaarApplianceImg}
                    alt="Mixer grinder"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1023px) 50vw, 25vw"
                  />
                  <span className="absolute top-3 left-3 bg-secondary text-white px-3 py-1 rounded-full text-xs font-bold">
                    COMMUNITY FAV
                  </span>
                </div>
                <div className="px-3 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-xl text-on-background">Bajaj Rex 750W mixer grinder</h3>
                    <div className="diya-glow cursor-pointer">
                      <span className="material-symbols-outlined diya-icon text-on-surface-variant transition-all">
                        local_fire_department
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-4">Lent by Mrs. Kapoor in Vasant Kunj</p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-black">₹0</span>
                    <button type="button" className="text-secondary font-bold text-sm flex items-center gap-1">
                      View Details <span className="material-symbols-outlined text-sm">arrow_outward</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bazaar-card bg-white p-2 rounded-lg shadow-sm">
                <div className="relative mb-4 h-72 overflow-hidden rounded-lg">
                  <Image
                    src={bazaarBooksImg}
                    alt="Stack of books"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1023px) 50vw, 25vw"
                  />
                </div>
                <div className="px-3 pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-xl text-on-background">UPSC Mains notes bundle (printed)</h3>
                    <div className="diya-glow cursor-pointer">
                      <span className="material-symbols-outlined diya-icon text-on-surface-variant transition-all">
                        local_fire_department
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-4">Lent by Karthik near JNU</p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-black">₹0</span>
                    <button type="button" className="text-secondary font-bold text-sm flex items-center gap-1">
                      View Details <span className="material-symbols-outlined text-sm">arrow_outward</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="bazaar-card bg-white p-2 rounded-lg shadow-sm mt-12">
                <div className="bg-primary-container/10 h-full min-h-[280px] rounded-lg flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-primary/20">
                  <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-primary">add</span>
                  </div>
                  <h3 className="font-headline text-2xl text-on-background mb-2">Your Item Here</h3>
                  <p className="text-sm text-on-surface-variant mb-6">Join 2,400+ neighbors sharing today.</p>
                  <Link href="/register" className="bg-primary text-white px-6 py-2 rounded-full font-bold text-sm soft-pop">
                    List an Item
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Katha ── */}
      <section id="katha" className="scroll-mt-28 py-24 px-8 overflow-x-hidden">
        <div className="max-w-screen-xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div ref={kathaCardRef} className="reveal-scroll relative order-2 lg:order-1">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-tertiary/10 rounded-full blur-2xl" aria-hidden="true" />
            <div className="relative bg-white p-6 shadow-2xl rounded-sm transform -rotate-3 hover:rotate-0 transition-transform duration-500 border-b-[40px] border-stone-50">
              <Image
                className="mb-4 h-[280px] w-full object-cover sm:h-[400px]"
                src={kathaKitchenImg}
                alt="Indian kitchen with mixer and utensils"
                width={900}
                height={600}
                sizes="(max-width: 1023px) 100vw, 50vw"
              />
              <p className="font-headline italic text-2xl text-on-background text-center">
                &quot;Shared with love from my kitchen to yours.&quot;
              </p>
              <div className="absolute bottom-[-30px] right-4">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-[#f17350] border-4 border-white shadow-lg flex items-center justify-center text-white overflow-hidden">
                    <span className="material-symbols-outlined text-3xl">verified_user</span>
                  </div>
                  <span className="text-[10px] font-black uppercase mt-1 text-primary">Wax Sealed Trust</span>
                </div>
              </div>
            </div>
          </div>

          <div ref={kathaTextRef} className="reveal-scroll order-1 lg:order-2 min-w-0">
            <h2 className="font-headline text-5xl text-on-background mb-8 leading-tight text-balance">
              Every item has a <span className="italic text-secondary">Katha</span>.
            </h2>
            <div className="flex flex-col gap-8">
              <div className="flex gap-6">
                <div className="shrink-0 w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined">history_edu</span>
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-2">Heritage Over Hardware</h4>
                  <p className="text-on-surface-variant">
                    We don&apos;t just share tools; we share the stories behind them. That mixer has churned out ladoos for
                    three generations of pujas.
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="shrink-0 w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined">edit_note</span>
                </div>
                <div>
                  <h4 className="font-bold text-xl mb-2">The Handwritten Note</h4>
                  <p className="text-on-surface-variant">
                    Digital handshakes are great, but every Loql exchange includes a physical or digital note of gratitude.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Samvaad ── */}
      <section className="py-24 px-8 bg-on-background text-background rounded-t-[48px]">
        <div className="max-w-screen-xl mx-auto text-center">
          <div ref={samvaadHeaderRef} className="reveal-scroll">
            <h2 className="font-headline text-5xl md:text-6xl mb-8">The Virtual Handshake</h2>
            <p className="text-xl text-stone-400 max-w-2xl mx-auto mb-16 leading-relaxed">
              Connect before you collect. Our &apos;Samvaad&apos; system ensures every interaction starts with respect and ends with a smile.
            </p>
          </div>

          <div ref={samvaadCardsRef} className="reveal-scroll">
            <div className="grid md:grid-cols-3 gap-8 md:gap-12 mb-16 md:mb-20">
              <div className="samvaad-feature-card group rounded-3xl border border-white/10 bg-white/5 p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-black/20">
                <span className="material-symbols-outlined mb-6 block text-4xl text-primary transition-transform duration-300 group-hover:scale-110">
                  chat_bubble
                </span>
                <h4 className="mb-4 font-bold text-2xl">Start Samvaad</h4>
                <p className="text-sm text-stone-400">Introduce yourself and explain why you&apos;d love to borrow the item.</p>
              </div>
              <div className="samvaad-feature-card group rounded-3xl border border-white/10 bg-white/5 p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-black/20">
                <span className="material-symbols-outlined mb-6 block text-4xl text-secondary transition-transform duration-300 group-hover:scale-110">
                  handshake
                </span>
                <h4 className="mb-4 font-bold text-2xl">Virtual Handshake</h4>
                <p className="text-sm text-stone-400">Lock in the trust with our one-click &apos;Respect&apos; agreement.</p>
              </div>
              <div className="samvaad-feature-card group rounded-3xl border border-white/10 bg-white/5 p-8 text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl hover:shadow-black/20">
                <span className="material-symbols-outlined mb-6 block text-4xl text-tertiary transition-transform duration-300 group-hover:scale-110">
                  favorite
                </span>
                <h4 className="mb-4 font-bold text-2xl">Borrow with Love</h4>
                <p className="text-sm text-stone-400">The final step. Pick up your item and make your own memories.</p>
              </div>
            </div>
          </div>

          <div ref={samvaadCtaRef} className="reveal-scroll">
            <button
              type="button"
              onClick={goStepIntoNeighbourhood}
              className="mx-auto flex w-fit items-center gap-4 rounded-full bg-[#f17350] px-10 py-4 text-lg font-black text-white shadow-[0_12px_40px_rgba(241,115,80,0.5)] ring-2 ring-white/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#e06542] hover:shadow-[0_16px_48px_rgba(241,115,80,0.6)] active:scale-[0.98] md:px-12 md:py-5 md:text-xl"
            >
              Borrow with Love
              <span className="material-symbols-outlined text-2xl">heart_plus</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Trust ── */}
      <section id="community" className="scroll-mt-28 py-24 px-8">
        <div className="max-w-screen-2xl mx-auto">
          <div ref={trustRef} className="reveal-scroll">
            <div className="bg-surface-container-high rounded-[48px] p-12 md:p-20 relative overflow-hidden">
              <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none" aria-hidden="true">
                <span className="material-symbols-outlined text-[300px]">eco</span>
              </div>
              <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                <div className="min-w-0">
                  <h2 className="font-headline text-5xl text-on-background mb-6">Modern Impact, Rooted Traditions.</h2>
                  <p className="text-on-surface-variant text-lg mb-6 leading-relaxed">
                    When neighbours share, we save money, cut waste, and strengthen mohallas and apartment blocks. Loql is still
                    in development — the numbers below describe the kind of impact we aim to unlock, not live product metrics.
                  </p>
                  <p className="mb-10 text-sm italic text-on-surface-variant/90">
                    *Illustrative projections for an India-first launch; not real-time or audited data.
                  </p>
                  <div className="grid grid-cols-2 gap-6 sm:gap-8">
                    <div>
                      <div className="mb-1 text-4xl font-black text-primary sm:text-5xl">10L+</div>
                      <p className="text-xs font-bold uppercase leading-snug tracking-wider text-on-surface sm:text-sm sm:tracking-widest">
                        Urban households we can help reach
                      </p>
                    </div>
                    <div>
                      <div className="mb-1 text-4xl font-black text-secondary sm:text-5xl">50+</div>
                      <p className="text-xs font-bold uppercase leading-snug tracking-wider text-on-surface sm:text-sm sm:tracking-widest">
                        Item categories neighbours can share
                      </p>
                    </div>
                    <div>
                      <div className="mb-1 text-4xl font-black text-tertiary sm:text-5xl">₹2–5K</div>
                      <p className="text-xs font-bold uppercase leading-snug tracking-wider text-on-surface sm:text-sm sm:tracking-widest">
                        Est. monthly savings per active home*
                      </p>
                    </div>
                    <div>
                      <div className="mb-1 text-4xl font-black text-on-background sm:text-5xl">4t+</div>
                      <p className="text-xs font-bold uppercase leading-snug tracking-wider text-on-surface sm:text-sm sm:tracking-widest">
                        CO₂ avoided per 1k shares (est.)*
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4">
                  <div className="relative h-56 w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-stone-200/50 sm:h-64 sm:rounded-3xl">
                    <Image
                      src={impactImgLeft}
                      alt="Apartment blocks and neighbourhood — community life"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 45vw, 22vw"
                    />
                  </div>
                  <div className="relative mt-6 h-56 w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-stone-200/50 sm:mt-8 sm:h-64 sm:rounded-3xl">
                    <Image
                      src={impactImgRight}
                      alt="Balconies and everyday life in an Indian society"
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 45vw, 22vw"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#FDFBF7] relative overflow-hidden w-full rounded-t-[48px] mt-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-12 py-20 max-w-screen-2xl mx-auto">
          <div className="col-span-1 md:col-span-1">
            <a href="#hero" className="block text-3xl font-black text-[#2D3142] mb-6">
              Loql
            </a>
            <p className="text-[#2D3142]/70 font-body text-sm mb-8 leading-relaxed">
              Connecting modern hearts through ancient values. Discover the bazaar next door.
            </p>
            <div className="flex gap-4">
              <a
                className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-on-background hover:bg-primary hover:text-white transition-all"
                href="#hero"
                aria-label="Back to top"
              >
                <span className="material-symbols-outlined text-xl">share</span>
              </a>
              <a
                className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-on-background hover:bg-primary hover:text-white transition-all"
                href="https://loql.in"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Website"
              >
                <span className="material-symbols-outlined text-xl">public</span>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-on-background mb-6 uppercase tracking-widest text-xs">Community</h4>
            <ul className="flex flex-col gap-4 font-body text-sm">
              <li>
                <a className="text-[#2D3142]/70 hover:translate-x-1 hover:text-[#f17350] transition-all block" href="#bazaar">
                  The Bazaar
                </a>
              </li>
              <li>
                <a className="text-[#2D3142]/70 hover:translate-x-1 hover:text-[#f17350] transition-all block" href="/terms">
                  Community Guidelines
                </a>
              </li>
              <li>
                <a className="text-[#2D3142]/70 hover:translate-x-1 hover:text-[#f17350] transition-all block" href="#community">
                  Neighborhood Trust
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-on-background mb-6 uppercase tracking-widest text-xs">Partners</h4>
            <ul className="flex flex-col gap-4 font-body text-sm">
              <li>
                <a className="text-[#2D3142]/70 hover:translate-x-1 hover:text-[#f17350] transition-all block" href="/register">
                  Merchant Portal
                </a>
              </li>
              <li>
                <a className="text-[#2D3142]/70 hover:translate-x-1 hover:text-[#f17350] transition-all block" href="#community">
                  Local Heroes
                </a>
              </li>
              <li>
                <a className="text-[#2D3142]/70 hover:translate-x-1 hover:text-[#f17350] transition-all block" href="/privacy">
                  Support
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-on-background mb-6 uppercase tracking-widest text-xs">Stay Rooted</h4>
            <div className="relative">
              <input
                className="w-full bg-white border border-stone-200 rounded-full py-4 px-6 focus:ring-primary focus:border-primary font-body"
                placeholder="Join the newsletter"
                type="email"
              />
              <button
                type="button"
                className="absolute right-2 top-2 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center soft-pop"
                aria-label="Subscribe"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
            <p className="mt-8 text-xs text-[#2D3142]/50 font-body">
              &copy; {new Date().getFullYear()} Loql Modern. Rooted in Aas-Paas.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
