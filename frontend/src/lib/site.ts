/**
 * Single source of truth for site-wide metadata, branding, and entity-consistency
 * strings used across <head> metadata, OpenGraph tags, JSON-LD, llms.txt, and email.
 *
 * Always import from here. Do not hardcode names, URLs, or taglines elsewhere.
 */
export const SITE = {
  name: "Epigram",
  url: "https://epi-gram.app",
  tagline: "Quant Interview Prep, Restructured",
  description:
    "Structured quant interview practice with human-verified problems from top firms, expert-curated solutions, and a 4-week intensive curriculum.",
  ogImage: "/og/default",
  founders: {
    jeremy: {
      name: "Jeremy Wu",
      role: "Co-founder",
      credentials:
        "Math PhD, University of Pennsylvania; former lecturer at The Wharton School",
      linkedin: "https://www.linkedin.com/in/jeremydwu",
    },
    chulhee: {
      name: "Chulhee Kim",
      role: "Co-founder",
      credentials: "MBAxMS in AI/ML, Columbia University",
      linkedin: "https://www.linkedin.com/in/chulheekim/",
    },
  },
  socials: {
    linkedin: "https://www.linkedin.com/company/epigramm",
  },
  newsletter: {
    name: "The Quant Signal",
    url: "https://epigrams-the-quant-signal.beehiiv.com/",
  },
} as const;
