import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'loql — Your Neighborhood Rental Engine',
  description: 'Rent anything from your neighbors in your society. Tools, gear, party supplies, and more.',
  themeColor: '#FAFAFA',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'loql',
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="apple-touch-icon" href="/logo.png" />
      {children}
    </>
  );
}
