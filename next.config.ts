import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // X profile pictures and banners
    remotePatterns: [{ protocol: "https", hostname: "pbs.twimg.com" }],
  },
};

export default nextConfig;
