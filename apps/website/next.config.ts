import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      }
    ]
  }
};

export default nextConfig;
