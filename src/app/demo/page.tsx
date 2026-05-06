'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  ChevronLeft,
  ChevronRight,
  Handshake,
  MapPin,
  MessageCircle,
  PackageOpen,
  Pause,
  Play,
  Plus,
  Search,
  SendHorizontal,
  ShoppingBag,
  Sparkles,
  UserRound,
  Wallet,
} from 'lucide-react';
import { iosEase, pageTransition } from '@/components/motion/motionPrimitives';
import styles from './page.module.css';

type Track = 'borrow' | 'lend';
type DemoMode = 'chooser' | 'reel' | 'complete';
type DemoTab = 'Home' | 'Rentals' | 'Chat' | 'Profile';
type DemoScreen = 'home' | 'itemDetail' | 'requestFlow' | 'chat' | 'rentals' | 'addItem' | 'profile';

type Scene = {
  id: string;
  title: string;
  narrative: string;
  youDo: string;
  appDoes: string;
  ctaHint: string;
  durationMs: number;
  screen: DemoScreen;
  tab: DemoTab;
};

const BORROW_SCENES: Scene[] = [
  {
    id: 'need',
    title: 'A Need Appears',
    narrative: 'You need a projector this weekend, so you open Loql to borrow nearby.',
    youDo: 'Open home feed and start searching.',
    appDoes: 'Surfaces local cards with clear pricing and categories.',
    ctaHint: 'Start with home and discover.',
    durationMs: 2600,
    screen: 'home',
    tab: 'Home',
  },
  {
    id: 'discover',
    title: 'Discover Nearby Listings',
    narrative: 'You browse options and shortlist a listing in seconds.',
    youDo: 'Scan cards and tap the best fit.',
    appDoes: 'Keeps card hierarchy clean: image, price, title, distance.',
    ctaHint: 'Tap listing to open detail.',
    durationMs: 2800,
    screen: 'home',
    tab: 'Home',
  },
  {
    id: 'trust',
    title: 'Check Item Detail',
    narrative: 'You validate availability, katha, and owner trust before requesting.',
    youDo: 'Review details and owner profile.',
    appDoes: 'Shows availability + trust cues in one readable structure.',
    ctaHint: 'Proceed when you feel confident.',
    durationMs: 3000,
    screen: 'itemDetail',
    tab: 'Home',
  },
  {
    id: 'request',
    title: 'Send Request',
    narrative: 'You submit duration and a polite message in one simple flow.',
    youDo: 'Confirm rental duration and send.',
    appDoes: 'Captures request terms and transitions to chat.',
    ctaHint: 'Submit and wait for owner confirmation.',
    durationMs: 3000,
    screen: 'requestFlow',
    tab: 'Home',
  },
  {
    id: 'coordinate',
    title: 'Coordinate in Chat',
    narrative: 'You align pickup and handover details in Samvaad.',
    youDo: 'Confirm time and location in chat.',
    appDoes: 'Keeps logistics centralized in one thread.',
    ctaHint: 'Finalize handover safely.',
    durationMs: 2800,
    screen: 'chat',
    tab: 'Chat',
  },
  {
    id: 'success',
    title: 'Rental Active',
    narrative: 'Your rental becomes active, and status is visible in Rentals.',
    youDo: 'Track active rental and return timeline.',
    appDoes: 'Maintains status updates and history.',
    ctaHint: 'Borrow journey complete.',
    durationMs: 2500,
    screen: 'rentals',
    tab: 'Rentals',
  },
];

const LEND_SCENES: Scene[] = [
  {
    id: 'list',
    title: 'List an Item',
    narrative: 'You add your item with image, title, and category.',
    youDo: 'Start Add Item and upload a photo.',
    appDoes: 'Structures listing fields with guided inputs.',
    ctaHint: 'Publish with confidence.',
    durationMs: 2600,
    screen: 'addItem',
    tab: 'Rentals',
  },
  {
    id: 'configure',
    title: 'Set Price & Availability',
    narrative: 'You define daily rate and availability so requests stay relevant.',
    youDo: 'Set fair daily pricing and listing status.',
    appDoes: 'Keeps listing cards balanced and readable.',
    ctaHint: 'Ready to receive offers.',
    durationMs: 2800,
    screen: 'rentals',
    tab: 'Rentals',
  },
  {
    id: 'request',
    title: 'Receive Request',
    narrative: 'A neighbor sends an offer request for your listing.',
    youDo: 'Review request amount and duration.',
    appDoes: 'Shows request status and quick actions in Rentals.',
    ctaHint: 'Open request and evaluate.',
    durationMs: 2800,
    screen: 'rentals',
    tab: 'Rentals',
  },
  {
    id: 'review',
    title: 'Review and Chat',
    narrative: 'You verify borrower intent and coordinate through chat.',
    youDo: 'Check profile and confirm logistics.',
    appDoes: 'Presents chat context with borrower identity.',
    ctaHint: 'Approve when clear.',
    durationMs: 2800,
    screen: 'chat',
    tab: 'Chat',
  },
  {
    id: 'handover',
    title: 'Approve and Handover',
    narrative: 'You hand over item with verification and clean status updates.',
    youDo: 'Approve and share handover confirmation.',
    appDoes: 'Transitions request to active rental timeline.',
    ctaHint: 'Handover done.',
    durationMs: 2800,
    screen: 'requestFlow',
    tab: 'Rentals',
  },
  {
    id: 'payout',
    title: 'Track Earnings',
    narrative: 'Completed rentals roll into profile and wallet summary.',
    youDo: 'Open profile to check wallet and history.',
    appDoes: 'Shows counts, wallet balance, and trust history.',
    ctaHint: 'Lend journey complete.',
    durationMs: 2500,
    screen: 'profile',
    tab: 'Profile',
  },
];

const SCENE_FLOW: Record<Track, Scene[]> = {
  borrow: BORROW_SCENES,
  lend: LEND_SCENES,
};

const MODE_TRANSITION = { duration: 0.34, ease: iosEase };
const ASSETS = {
  hero: '/brand/loql-neighborhood-hero.png',
  tent: '/brand/tent-listing.jpg',
  left: '/left-image-1.png',
  right: '/right-image-1.png',
  signup: '/sign-up-image.jpeg',
} as const;

const MOCK_ITEMS = [
  { id: 'i1', title: 'Projector', price: 900, distance: '3 mins away', image: ASSETS.tent },
  { id: 'i2', title: 'Microwave', price: 500, distance: '2 mins away', image: ASSETS.left },
  { id: 'i3', title: 'Gaming Console', price: 830, distance: '5 mins away', image: ASSETS.right },
  { id: 'i4', title: 'Drill Kit', price: 300, distance: '4 mins away', image: ASSETS.hero },
];

const parseTrack = (value: string | null): Track | null => {
  if (value === 'borrow' || value === 'lend') return value;
  return null;
};

const resolveLegacyStep = (step: string | null): { track: Track; sceneId: string } | null => {
  if (!step) return null;
  if (step === 'need') return { track: 'borrow', sceneId: 'need' };
  return null;
};

const sceneIndexFor = (track: Track, sceneId: string | null) => {
  const scenes = SCENE_FLOW[track];
  if (!sceneId) return 0;
  const idx = scenes.findIndex((scene) => scene.id === sceneId);
  return idx >= 0 ? idx : 0;
};

function MockTopBar() {
  return (
    <div className={styles.mockTopBar}>
      <span className={styles.mockBrand}>Loql</span>
      <div className={styles.mockTopRight}>
        <button type="button" className={styles.mockIconButton} aria-label="Notifications">
          <Bell size={16} />
        </button>
        <div className={styles.mockAvatarFallback} aria-hidden="true">D</div>
      </div>
    </div>
  );
}

function MockTabBar({ active }: { active: DemoTab }) {
  const tabs: { key: DemoTab; icon: React.ElementType; label: string }[] = [
    { key: 'Home', icon: Search, label: 'Home' },
    { key: 'Rentals', icon: ShoppingBag, label: 'Rentals' },
    { key: 'Chat', icon: MessageCircle, label: 'Chat' },
    { key: 'Profile', icon: UserRound, label: 'Profile' },
  ];

  return (
    <div className={styles.mockTabBar}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === active;
        return (
          <div key={tab.key} className={`${styles.mockTabButton} ${isActive ? styles.mockTabActive : ''}`}>
            <Icon size={18} />
            {isActive && <span>{tab.label}</span>}
          </div>
        );
      })}
    </div>
  );
}

function MockHomeScreen({ emphasize }: { emphasize?: 'discover' | 'request' }) {
  return (
    <div className={styles.mockScreenBody}>
      <div className={styles.mockHeaderStack}>
        <p className={styles.mockGreeting}>Good Morning,</p>
        <h3 className={styles.mockName}>Dev</h3>
        <div className={styles.mockLocation}><MapPin size={11} /> Prestige Lakeside</div>
      </div>
      <div className={`${styles.mockSearch} ${emphasize ? styles.mockHighlight : ''}`}>
        <Search size={14} />
        Search for tools, gear...
      </div>
      <div className={styles.mockHeroCard}>
        <span>THE LOQL HERO</span>
        <strong>Borrow what you need from trusted neighbors.</strong>
        <p>Curated picks from your society, updated all day.</p>
      </div>
      <div className={styles.mockChipRow}>
        <span className={styles.mockChipActive}>All</span>
        <span className={styles.mockChip}>DIY Tools</span>
        <span className={styles.mockChip}>Gaming</span>
      </div>
      <div className={styles.mockGrid}>
        {MOCK_ITEMS.slice(0, 4).map((item, idx) => (
          <article key={item.id} className={`${styles.mockItemCard} ${emphasize === 'discover' && idx === 2 ? styles.mockHighlight : ''}`}>
            <div className={styles.mockItemImage}>
              <img src={item.image} alt={item.title} />
              <div className={styles.mockPriceTag}>{`\u20B9${item.price}/day`}</div>
            </div>
            <div className={styles.mockItemMeta}>
              <h4>{item.title}</h4>
              <p>{item.distance}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function MockItemDetailScreen() {
  return (
    <div className={styles.mockDetailScreen}>
      <div className={styles.mockDetailHero}>
        <img src={ASSETS.right} alt="Playstation 5" />
        <div className={styles.mockFloatingActions}>
          <button type="button"><ChevronLeft size={18} /></button>
          <button type="button"><SendHorizontal size={16} /></button>
        </div>
      </div>
      <div className={styles.mockDetailPanel}>
        <div className={styles.mockHandle} />
        <h3>Playstation 5 with fortnite</h3>
        <p className={styles.mockPriceLine}>{`\u20B9 830/day`}</p>
        <div className={styles.mockSection}>
          <span>Availability</span>
          <div className={styles.mockAvailabilityCard}>
            <div className={styles.mockPulseDot} />
            <div>
              <strong>Currently Available</strong>
              <p>Ready to rent instantly</p>
            </div>
            <em>Available</em>
          </div>
        </div>
        <div className={styles.mockQuote}>
          &ldquo;This item has helped many neighbors and is ready for its next story.&rdquo;
        </div>
        <div className={styles.mockOwnerRow}>
          <div className={styles.mockOwnerAvatar}>D</div>
          <div>
            <strong>Owned by Dev</strong>
            <p>4.8 trust score</p>
          </div>
          <button type="button">Chat</button>
        </div>
      </div>
    </div>
  );
}

function MockRequestScreen({ lend }: { lend?: boolean }) {
  return (
    <div className={styles.mockScreenBody}>
      <h3 className={styles.mockRequestTitle}>{lend ? 'Request Review' : 'Borrow Request'}</h3>
      <div className={styles.mockRequestCard}>
        <strong>Playstation 5 with fortnite</strong>
        <p>{`\u20B9 830/day`} • 1 day</p>
      </div>
      <div className={styles.mockInputCard}>
        <label>Duration</label>
        <div>1 day</div>
      </div>
      <div className={styles.mockInputCard}>
        <label>Message</label>
        <div>Need this for a movie night. Will return on time.</div>
      </div>
      <div className={styles.mockInputCard}>
        <label>Handover code</label>
        <div>AB73KQ</div>
      </div>
      <button type="button" className={styles.mockPrimaryButton}>
        {lend ? 'Approve & Share Item' : 'Send Request'}
      </button>
    </div>
  );
}

function MockChatScreen({ lend }: { lend?: boolean }) {
  return (
    <div className={styles.mockScreenBody}>
      <h3 className={styles.mockRequestTitle}>Neighborhood Conversations</h3>
      <div className={styles.mockSearch}>
        <Search size={14} />
        Search chats...
      </div>
      <div className={styles.mockChatList}>
        <article className={styles.mockChatCard}>
          <div className={styles.mockOwnerAvatar}>{lend ? 'R' : 'P'}</div>
          <div className={styles.mockChatContent}>
            <strong>{lend ? 'Riya' : 'Priya'}</strong>
            <p>{lend ? 'I can pick it up at 6 PM.' : 'Pickup works for 5 PM near gate 2.'}</p>
          </div>
          <time>{lend ? '2m' : '1m'}</time>
        </article>
        <article className={styles.mockBubbleSelf}>
          Perfect. Carrying case included.
        </article>
        <article className={styles.mockBubblePeer}>
          Great, see you there.
        </article>
      </div>
      <div className={styles.mockComposer}>Write a message...</div>
    </div>
  );
}

function MockRentalsScreen({ lend }: { lend?: boolean }) {
  return (
    <div className={styles.mockScreenBody}>
      <div className={styles.mockRentalsHead}>
        <h3>{lend ? 'My Listings' : 'My Rentals'}</h3>
        <button type="button" className={styles.mockAddButton} aria-label="Add item">
          <Plus size={18} />
        </button>
      </div>
      <div className={styles.mockSegmentRow}>
        <span className={styles.mockSegmentActive}>{lend ? 'All Items' : 'Rentals'}</span>
        <span className={styles.mockSegment}>{lend ? 'Offers' : 'History'}</span>
        <span className={styles.mockSegment}>{lend ? 'Borrowed' : 'Completed'}</span>
      </div>
      <div className={styles.mockList}>
        {[MOCK_ITEMS[2], MOCK_ITEMS[1], MOCK_ITEMS[0]].map((item, idx) => (
          <article key={item.id} className={styles.mockListingCard}>
            <div className={styles.mockListingImage}>
              <img src={item.image} alt={item.title} />
            </div>
            <div className={styles.mockListingMeta}>
              <strong>{item.title}</strong>
              <div className={styles.mockListingFooter}>
                <span>{idx === 0 ? 'ACCEPTED' : 'AVAILABLE'}</span>
                <em>{`\u20B9${item.price}/day`}</em>
              </div>
            </div>
            <ChevronRight size={16} />
          </article>
        ))}
      </div>
    </div>
  );
}

function MockAddItemScreen() {
  return (
    <div className={styles.mockScreenBody}>
      <h3 className={styles.mockRequestTitle}>Add Item</h3>
      <div className={styles.mockInputCard}>
        <label>Title</label>
        <div>Projector</div>
      </div>
      <div className={styles.mockInputCard}>
        <label>Category</label>
        <div>Electronics</div>
      </div>
      <div className={styles.mockInputCard}>
        <label>Daily rate</label>
        <div>{`\u20B9 900`}</div>
      </div>
      <div className={styles.mockUpload}>+ Add photos</div>
      <button type="button" className={styles.mockPrimaryButton}>Publish Listing</button>
    </div>
  );
}

function MockProfileScreen() {
  return (
    <div className={styles.mockScreenBody}>
      <div className={styles.mockProfileHeader}>
        <div className={styles.mockProfileAvatar}>
          <img src={ASSETS.signup} alt="Dev" />
        </div>
        <div>
          <h3>Dev</h3>
          <p>7017453595</p>
        </div>
      </div>
      <div className={styles.mockWallet}>
        <div className={styles.mockWalletIcon}><Wallet size={18} /></div>
        <div>
          <span>Wallet Balance</span>
          <strong>{`\u20B94500.00`}</strong>
        </div>
        <ChevronRight size={16} />
      </div>
      <h4 className={styles.mockPehchan}>Pehchan</h4>
      <div className={styles.mockHistoryGrid}>
        <div className={styles.mockHistoryCard}>
          <ShoppingBag size={16} />
          <span>Rented</span>
          <strong>5</strong>
        </div>
        <div className={styles.mockHistoryCard}>
          <PackageOpen size={16} />
          <span>For Rent</span>
          <strong>15</strong>
        </div>
      </div>
      <div className={styles.mockMenu}>
        <article><span>Account Settings</span><ChevronRight size={15} /></article>
        <article><span>Dark Mode</span><ChevronRight size={15} /></article>
        <article><span>Get Help</span><ChevronRight size={15} /></article>
      </div>
    </div>
  );
}

function renderScreen(scene: Scene, track: Track) {
  switch (scene.screen) {
    case 'itemDetail':
      return <MockItemDetailScreen />;
    case 'requestFlow':
      return <MockRequestScreen lend={track === 'lend'} />;
    case 'chat':
      return <MockChatScreen lend={track === 'lend'} />;
    case 'rentals':
      return <MockRentalsScreen lend={track === 'lend'} />;
    case 'addItem':
      return <MockAddItemScreen />;
    case 'profile':
      return <MockProfileScreen />;
    default:
      return <MockHomeScreen emphasize={scene.id === 'discover' ? 'discover' : scene.id === 'need' ? 'request' : undefined} />;
  }
}

function DemoExperience() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();

  const [mode, setMode] = useState<DemoMode>('chooser');
  const [track, setTrack] = useState<Track>('borrow');
  const [sceneIndex, setSceneIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const scenes = SCENE_FLOW[track];
  const currentScene = scenes[sceneIndex];
  const progressPct = ((sceneIndex + 1) / scenes.length) * 100;

  const queryAutoplay = searchParams.get('autoplay');
  const autoplayEnabledByQuery = queryAutoplay !== '0';
  const autoplayAllowed = autoplayEnabledByQuery && !shouldReduceMotion;

  const goPrev = useCallback(() => {
    setMode('reel');
    setSceneIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goNext = useCallback(() => {
    if (sceneIndex >= scenes.length - 1) {
      setMode('complete');
      return;
    }
    setSceneIndex((prev) => Math.min(scenes.length - 1, prev + 1));
  }, [sceneIndex, scenes.length]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const legacy = resolveLegacyStep(searchParams.get('step'));
      let nextMode: DemoMode = 'chooser';
      let nextTrack: Track = track;
      let nextSceneIndex = 0;

      if (legacy) {
        nextMode = 'reel';
        nextTrack = legacy.track;
        nextSceneIndex = sceneIndexFor(legacy.track, legacy.sceneId);
      } else {
        const queryTrack = parseTrack(searchParams.get('track'));
        const queryScene = searchParams.get('scene');
        if (queryTrack) {
          nextMode = 'reel';
          nextTrack = queryTrack;
          nextSceneIndex = sceneIndexFor(queryTrack, queryScene);
        }
      }

      setMode((prev) => (prev === nextMode ? prev : nextMode));
      setTrack((prev) => (prev === nextTrack ? prev : nextTrack));
      setSceneIndex((prev) => (prev === nextSceneIndex ? prev : nextSceneIndex));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [searchParams, track]);

  useEffect(() => {
    if (mode !== 'reel') return;
    if (typeof window === 'undefined') return;

    const currentSearch = window.location.search;
    const params = new URLSearchParams(currentSearch);
    params.delete('step');
    params.set('track', track);
    params.set('scene', currentScene.id);
    params.set('autoplay', isPaused || shouldReduceMotion ? '0' : '1');
    const nextSearch = `?${params.toString()}`;

    if (nextSearch !== currentSearch) {
      router.replace(`${pathname}${nextSearch}`, { scroll: false });
    }
  }, [mode, track, currentScene.id, isPaused, pathname, router, shouldReduceMotion]);

  useEffect(() => {
    if (mode !== 'reel') return;
    if (isPaused || !autoplayAllowed) return;
    const timer = window.setTimeout(() => {
      setSceneIndex((prev) => {
        if (prev >= scenes.length - 1) {
          setMode('complete');
          return prev;
        }
        return prev + 1;
      });
    }, currentScene.durationMs);
    return () => window.clearTimeout(timer);
  }, [mode, isPaused, autoplayAllowed, currentScene.durationMs, scenes.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (mode !== 'reel') return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrev();
      }
      if (event.key === ' ') {
        event.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mode, goNext, goPrev]);

  const enterTrack = (selected: Track) => {
    setTrack(selected);
    setSceneIndex(0);
    setIsPaused(false);
    setMode('reel');
  };

  const restartFlow = () => {
    const opposite = track === 'borrow' ? 'lend' : 'borrow';
    setTrack(opposite);
    setSceneIndex(0);
    setMode('reel');
    setIsPaused(false);
  };

  return (
    <main className={styles.page}>
      <div className="mitti-noise-layer" aria-hidden="true" />
      <div className={styles.shell}>
        <header className={styles.topBar}>
          <div>
            <span className={styles.brand}>Loql</span>
            <p className={styles.kicker}>How it works</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/" className={styles.ghostLink}>Back to home</Link>
            <Link href="/app" className={styles.primaryLink}>Use the app</Link>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {mode === 'chooser' && (
            <motion.section
              key="chooser"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={MODE_TRANSITION}
              className={styles.chooser}
              aria-label="Choose journey"
            >
              <h1 className={styles.title}>Choose your journey</h1>
              <p className={styles.subtitle}>Select Borrow or Lend and walk through the exact product behavior.</p>
              <div className={styles.chooserGrid}>
                <button type="button" className={`${styles.choiceCard} ${styles.choiceBorrow}`} onClick={() => enterTrack('borrow')}>
                  <Handshake size={24} />
                  <h2>Borrow an item</h2>
                  <p>See discovery, trust checks, request flow, and rental tracking.</p>
                  <span>Start Borrow Flow</span>
                </button>
                <button type="button" className={`${styles.choiceCard} ${styles.choiceLend}`} onClick={() => enterTrack('lend')}>
                  <PackageOpen size={24} />
                  <h2>Lend an item</h2>
                  <p>See listing setup, request handling, handover, and payout visibility.</p>
                  <span>Start Lend Flow</span>
                </button>
              </div>
            </motion.section>
          )}

          {mode === 'reel' && (
            <div className={styles.reelScale}>
              <motion.section
                key={`reel-${track}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={MODE_TRANSITION}
                className={styles.reelLayout}
                aria-label={`${track} journey reel`}
              >
              <section className={styles.reelPanel}>
                <div className={styles.phoneFrame}>
                  <div className={styles.notch} />
                  <motion.div
                    key={`${track}-${currentScene.id}`}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                    transition={pageTransition}
                    className={styles.mockApp}
                    role="region"
                    aria-label={`Scene ${sceneIndex + 1}`}
                    aria-live="polite"
                  >
                    <MockTopBar />
                    <div className={styles.mockViewport}>
                      {renderScreen(currentScene, track)}
                    </div>
                    <MockTabBar active={currentScene.tab} />
                  </motion.div>
                </div>
              </section>

              <aside className={styles.contextPanel}>
                <div className={styles.trackPill}>
                  <Sparkles size={13} />
                  {track === 'borrow' ? 'Borrow Journey' : 'Lend Journey'}
                </div>
                <h2 className={styles.panelTitle}>{currentScene.title}</h2>
                <p className={styles.panelCopy}>{currentScene.narrative}</p>
                <div className={styles.detailGrid}>
                  <article className={styles.detailCard}>
                    <strong>You do</strong>
                    <p>{currentScene.youDo}</p>
                  </article>
                  <article className={styles.detailCard}>
                    <strong>Loql does</strong>
                    <p>{currentScene.appDoes}</p>
                  </article>
                </div>
                <p className={styles.sceneHint}>{currentScene.ctaHint}</p>

                <div className={styles.controls} aria-label="Demo controls">
                  <div className={styles.progressWrap}>
                    <div className={styles.progressBar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressPct)}>
                      <span style={{ width: `${progressPct}%` }} />
                    </div>
                    <div className={styles.chips}>
                      {scenes.map((scene, idx) => (
                        <button
                          key={scene.id}
                          type="button"
                          className={`${styles.chip} ${idx === sceneIndex ? styles.activeChip : ''}`}
                          onClick={() => setSceneIndex(idx)}
                          aria-label={`Go to ${scene.title}`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className={styles.buttonRow}>
                    <button type="button" onClick={goPrev} className={styles.controlBtn} disabled={sceneIndex === 0}>
                      <ArrowLeft size={16} /> Previous
                    </button>
                    <button type="button" onClick={() => setIsPaused((prev) => !prev)} className={styles.controlBtn}>
                      {isPaused ? <Play size={16} /> : <Pause size={16} />}
                      {isPaused ? 'Play' : 'Pause'}
                    </button>
                    <button type="button" onClick={goNext} className={styles.controlBtn}>
                      Next <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </aside>
              </motion.section>
            </div>
          )}

          {mode === 'complete' && (
            <motion.section
              key={`complete-${track}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={MODE_TRANSITION}
              className={styles.complete}
              aria-label="Demo complete"
            >
              <h2>You&apos;ve finished the {track} journey</h2>
              <p>This is the same interaction language used in the real app, now try it live.</p>
              <div className={styles.completeActions}>
                <Link href="/app" className={styles.primaryLink}>Use the app</Link>
                <Link href="/" className={styles.ghostLink}>Back to home</Link>
              </div>
              <button type="button" onClick={restartFlow} className={styles.restartLink}>
                Try the other journey
              </button>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <main className={styles.page}>
          <div className={styles.shell}>
            <section className={styles.chooser}>
              <h1 className={styles.title}>Loading your guided journey...</h1>
              <p className={styles.subtitle}>Preparing the interactive walkthrough.</p>
            </section>
          </div>
        </main>
      }
    >
      <DemoExperience />
    </Suspense>
  );
}
