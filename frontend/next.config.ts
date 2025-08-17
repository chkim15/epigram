import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Optimize for production
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
