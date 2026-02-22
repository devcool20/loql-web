import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://loql.in"),
  title: "loql - Rent things from your neighbors",
  description: "The easiest way to rent items from your community. Download the app today.",
  openGraph: {
    title: "loql - Rent things from your neighbors",
    description: "The easiest way to rent items from your community. Download the app today.",
    url: "https://loql.in",
    siteName: "loql",
    images: [
      {
        url: "/logo.png",
        alt: "loql - Community Sharing",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "loql - Rent things from your neighbors",
    description: "The easiest way to rent items from your community. Download the app today.",
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAFAFA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="loql" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className={montserrat.variable}>{children}</body>
    </html>
  );
}
