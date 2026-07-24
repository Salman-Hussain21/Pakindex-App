import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable source maps in development for faster builds
  productionBrowserSourceMaps: false,
  logging: {
    fetches: { fullUrl: false },
  },
};

export default nextConfig;
