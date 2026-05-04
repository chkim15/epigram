import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/**
 * robots.txt — emitted at /robots.txt
 *
 * Strategy:
 *   1. Default `User-agent: *` allows the public surface, disallows the
 *      authenticated app routes (matched against the positive matcher in
 *      `frontend/src/middleware.ts` as of 2026-05-04).
 *   2. Explicit allow-rules for the 9 AI crawlers we care about. These are
 *      defensive — `*` already allows them, but listing them explicitly
 *      makes intent clear and protects against future regressions.
 *
 * AEO note: blocking AI crawlers is the #1 AEO blocker. See aeo-audit.sh.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/auth/",
          "/home",
          "/bookmarks",
          "/problems",
          "/curriculum",
          "/mock-interview",
        ],
      },
      // Explicit AI bot allowlist (defensive).
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "Bytespider", allow: "/" },
      { userAgent: "CCBot", allow: "/" },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
