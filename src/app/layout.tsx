import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
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
        url: "/opengraph-image.png",
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
    images: ["/opengraph-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={outfit.variable}>{children}</body>
    </html>
  );
}
