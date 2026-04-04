import type { NextConfig } from "next";

const longCache = "public, max-age=31536000, immutable";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    /** Keep optimized derivatives warm at the CDN/edge between deploys */
    minimumCacheTTL: 60 * 60 * 24 * 7,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jusbswsbucsvmmdmxthn.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "img.freepik.com", pathname: "/**" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com", pathname: "/**" },
      { protocol: "https", hostname: "assets.myntassets.com", pathname: "/**" },
    ],
  },
  async headers() {
    return [
      { source: "/brand/:path*", headers: [{ key: "Cache-Control", value: longCache }] },
      { source: "/left-image-1.png", headers: [{ key: "Cache-Control", value: longCache }] },
      { source: "/right-image-1.png", headers: [{ key: "Cache-Control", value: longCache }] },
      { source: "/logo.png", headers: [{ key: "Cache-Control", value: longCache }] },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
