/**
 * JSON-LD schema builders for AEO/SEO. Each builder returns a plain object
 * that should be rendered into a `<script type="application/ld+json">` tag
 * via the JsonLd component (see frontend/src/components/seo/JsonLd.tsx).
 *
 * Schema types implemented:
 *   - Organization (root layout, every page)
 *   - WebSite (root layout, every page)
 *   - FAQPage (landing FAQ, future guide FAQs)
 *   - BreadcrumbList (public mirror routes, future articles)
 *   - QAPage (single problem pages — /practice/[slug])
 *   - Course (single curriculum topic pages — /learn/[topicSlug])
 *   - ItemList (index/listing pages — /practice, /learn)
 */
import { SITE } from "./site";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    logo: `${SITE.url}/epigram_logo.svg`,
    description: SITE.description,
    sameAs: [SITE.socials.linkedin],
    founder: [
      {
        "@type": "Person",
        name: SITE.founders.jeremy.name,
        jobTitle: SITE.founders.jeremy.role,
        description: SITE.founders.jeremy.credentials,
        sameAs: [SITE.founders.jeremy.linkedin],
      },
      {
        "@type": "Person",
        name: SITE.founders.chulhee.name,
        jobTitle: SITE.founders.chulhee.role,
        description: SITE.founders.chulhee.credentials,
        sameAs: [SITE.founders.chulhee.linkedin],
      },
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
  };
}

export function faqPageSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * QAPage schema for a single practice problem.
 *
 * NOTE: `problem_id` is the human-readable text identifier (e.g.
 * "quant_interview_fundamental_qdsi_p40"), NOT the UUID `id` column.
 * URLs use `problem_id` because it's stable and human-readable.
 */
export function qaPageSchema(problem: {
  problem_id: string;
  problem_text: string | null;
  correct_answer?: string | null;
  hint?: string | null;
  solution_text?: string | null;
  updated_at?: string | null;
}) {
  const url = `${SITE.url}/practice/${problem.problem_id}`;
  const author = {
    "@type": "Person" as const,
    name: SITE.founders.jeremy.name,
    url: SITE.founders.jeremy.linkedin,
    jobTitle: SITE.founders.jeremy.role,
    description: SITE.founders.jeremy.credentials,
  };
  const accepted = problem.solution_text
    ? {
        "@type": "Answer" as const,
        text: problem.solution_text,
        url,
        author,
      }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "QAPage",
    ...(problem.updated_at ? { dateModified: problem.updated_at } : {}),
    mainEntity: {
      "@type": "Question",
      name: problem.problem_text ?? "Quant interview practice problem",
      text: problem.problem_text ?? "",
      author,
      ...(accepted ? { acceptedAnswer: accepted } : {}),
    },
  };
}

/**
 * Course schema for a single curriculum topic page.
 * Topics come from the static course-structure.ts — no DB query.
 */
export function courseSchema(topic: {
  title: string;
  weekTitle: string;
  weekNum: number;
  topicNum: number;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: topic.title,
    description: `Week ${topic.weekNum} (${topic.weekTitle}) — Topic ${topic.topicNum}: ${topic.title}. Part of the Epigram 4-week quant interview prep curriculum.`,
    provider: {
      "@type": "Organization",
      name: SITE.name,
      sameAs: SITE.url,
    },
    author: {
      "@type": "Person",
      name: SITE.founders.jeremy.name,
      url: SITE.founders.jeremy.linkedin,
      jobTitle: SITE.founders.jeremy.role,
      description: SITE.founders.jeremy.credentials,
    },
    ...(topic.dateModified ? { dateModified: topic.dateModified } : {}),
  };
}

/**
 * ItemList schema for index pages (e.g. /practice, /learn).
 * Each item is { name, url } — emits a positional ItemListElement.
 */
export function itemListSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
