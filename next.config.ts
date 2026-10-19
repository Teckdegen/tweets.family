import path from "node:path";
import type { NextConfig } from "next";

// AppKit's optional @wagmi/connectors v8 pulls unused Coinbase packages.
// Always resolve the package to the wagmi v2 connectors instead.
const wagmiConnectors = "./node_modules/@wagmi/connectors";

const nextConfig: NextConfig = {
  images: {
    // X profile pictures and banners
    remotePatterns: [{ protocol: "https", hostname: "pbs.twimg.com" }],
  },
  turbopack: {
    resolveAlias: {
      "@wagmi/connectors": wagmiConnectors,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@wagmi/connectors": path.join(process.cwd(), "node_modules/@wagmi/connectors"),
    };
    return config;
  },
};

export default nextConfig;
