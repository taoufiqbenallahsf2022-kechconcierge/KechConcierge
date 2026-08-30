import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.100.7"],
  async redirects() {
    return [
      { source: "/activities/:path*", destination: "/experiences/:path*", permanent: true },
      { source: "/:locale/activities/:path*", destination: "/:locale/experiences/:path*", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "imagedelivery.net",
        pathname: "/qcrNy2QA3vt3EbTLsOQBpA/**"
      },
      {
        protocol: "https",
        hostname: "images.pexels.com"
      }
    ]
  }
};

export default nextConfig;
