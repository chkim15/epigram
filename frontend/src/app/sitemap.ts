import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { supabase } from "@/lib/supabase/client";
import { COURSE_WEEKS } from "@/data/course/course-structure";
import { slugify } from "@/lib/utils/slugify";

/**
 * Dynamic sitemap.xml generator.
 *
 * Includes:
 *   - Static public marketing/policy pages
 *   - Public mirror index pages (/practice, /learn)
 *   - One entry per free problem (problems.is_free = true) — uses problem_id (text)
 *   - One entry per free curriculum topic (topics 1–3) — uses slugified title
 *
 * Regenerates hourly via `revalidate`. Falls back to static-only if Supabase
 * env vars are absent or the query fails — never crashes the build.
 */
export const revalidate = 3600;

/** Topic numbers exposed via /learn/[topicSlug]. Matches the free problems set (W1 T1–T3). */
const FREE_TOPIC_NUMS = [1, 2, 3] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const today = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified: today, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE.url}/mission`, lastModified: today, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/contact`, lastModified: today, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE.url}/privacy`, lastModified: today, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/terms`, lastModified: today, changeFrequency: "yearly", priority: 0.3 },
  ];

  const indexRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/practice`, lastModified: today, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE.url}/learn`, lastModified: today, changeFrequency: "weekly", priority: 0.9 },
  ];

  // Free curriculum topics (static — backed by course-structure.ts, not DB).
  const allTopics = COURSE_WEEKS.flatMap((w) => w.topics);
  const freeTopics = allTopics.filter((t) => FREE_TOPIC_NUMS.includes(t.topicNum as 1 | 2 | 3));
  const learnRoutes: MetadataRoute.Sitemap = freeTopics.map((t) => ({
    url: `${SITE.url}/learn/${slugify(t.title)}`,
    lastModified: today,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Free practice problems (DB-backed).
  let practiceRoutes: MetadataRoute.Sitemap = [];
  try {
    const { data, error } = await supabase
      .from("problems")
      .select("problem_id, updated_at")
      .eq("is_free", true)
      .eq("included", true);

    if (!error && data) {
      practiceRoutes = data
        .filter((p): p is { problem_id: string; updated_at: string | null } =>
          Boolean(p.problem_id)
        )
        .map((p) => ({
          url: `${SITE.url}/practice/${p.problem_id}`,
          lastModified: p.updated_at ? new Date(p.updated_at) : today,
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }));
    }
  } catch {
    // Build-time falls back to static + index + learn routes only.
  }

  return [...staticRoutes, ...indexRoutes, ...learnRoutes, ...practiceRoutes];
}
