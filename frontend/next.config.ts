import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  // pdf.js breaks when bundled into server code; load it from node_modules instead
  // (used by /api/jobs/profile to read uploaded CVs). Browser bundles are unaffected.
  serverExternalPackages: ["pdfjs-dist"],
};

export default nextConfig;
