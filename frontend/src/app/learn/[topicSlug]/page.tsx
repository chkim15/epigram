import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { courseSchema, breadcrumbSchema } from "@/lib/schema";
import { SITE } from "@/lib/site";
import { COURSE_WEEKS } from "@/data/course/course-structure";
import { slugify } from "@/lib/utils/slugify";

/** Topic numbers exposed via /learn/[topicSlug]. Matches W1 T1–T3 free problems. */
const FREE_TOPIC_NUMS = [1, 2, 3] as const;

/** Bump this when TOPIC_INTROS or page structure is edited. ISO date. */
const TOPIC_PAGE_LAST_UPDATED = "2026-05-04";

type TopicIntro = {
  /** 1-2 sentences. Must open with "X is Y." (definition lead for AEO Answer Readiness). */
  definition: string;
  /** 2-3 sentences listing concepts and scope. */
  whatItCovers: string;
  /** 2-3 sentences on interview relevance and firm calibration. */
  whyItMatters: string;
};

type ResolvedTopic = {
  topicNum: number;
  title: string;
  weekNum: number;
  weekTitle: string;
  intro: TopicIntro;
};

/**
 * Topic intros for the free preview pages. Hand-written to give AI engines
 * and search crawlers structured, citable content. Each topic opens with a
 * definition (AEO Answer Readiness) and is split into three H2 sections
 * (AEO Quotability / Content Structure).
 */
const TOPIC_INTROS: Record<number, TopicIntro> = {
  1: {
    definition:
      "Foundations of probability modeling is the discipline of translating verbal interview prompts into clean mathematical probability models. It is the prerequisite skill that every other quant interview topic — distributions, stochastic processes, statistics, even brainteasers — silently assumes.",
    whatItCovers:
      "This topic covers sample spaces, events, axioms of probability, equally-likely outcomes, basic combinatorial counting (permutations, combinations, multinomial coefficients), and the inclusion-exclusion principle. The emphasis is on setting up the model correctly before computing — an interviewer can usually tell within 30 seconds whether a candidate has internalized the modeling step.",
    whyItMatters:
      "The level is calibrated to interview problems firms like Citadel, Jane Street, and Optiver actually ask in first-round screens. The trap is rarely a hard formula and almost always a sloppy model — wrong sample space, double-counted outcomes, or mis-applied independence. Mastering this topic prevents the most common failure mode in early-round quant probability rounds.",
  },
  2: {
    definition:
      "Conditional probability is the probability of an event given that another event has occurred, written P(A | B). Bayes' theorem is the formal rule for inverting that conditional — computing P(A | B) from P(B | A), the prior P(A), and the marginal P(B).",
    whatItCovers:
      "This topic covers the definition of conditional probability, the multiplication rule, the law of total probability, Bayes' theorem in both its 2-event and partition forms, and the standard set of trap problems: the Monty Hall family, false-positive medical-test problems, the two-children problem, and prosecutor's fallacy. Each trap exposes a different intuitive error that interviewers deliberately probe.",
    whyItMatters:
      "Conditional probability and Bayes' theorem are tested in nearly every quant interview at every top firm, and they are the single most common source of wrong answers from otherwise strong candidates. Mastery of this topic unlocks roughly a third of all probability interview questions and is foundational for the statistics and stochastic-processes weeks that follow.",
  },
  3: {
    definition:
      "Distributions are functions that assign probabilities to outcomes of a random variable. The discrete and continuous distributions covered in this topic — Bernoulli, Binomial, Geometric, Negative Binomial, Poisson, Uniform, Exponential, and Normal — are the building blocks for every probability model used in quant interviews.",
    whatItCovers:
      "This topic covers the standard discrete and continuous distributions and the relationships between them: Poisson as a Binomial limit, Exponential as the memoryless continuous analog of Geometric, Normal as the limiting distribution via the Central Limit Theorem. It also introduces moment-generating functions at the level needed to derive sums of independent random variables.",
    whyItMatters:
      "Interviewers expect not just memorized formulas but the ability to recognize which distribution applies from a verbal description and to compute expectations and probabilities from first principles. This setup is used heavily in Week 1 Topics 4–6 and throughout Weeks 2 and 3 — getting it cold here pays back across the whole curriculum.",
  },
};

function findFreeTopicBySlug(slug: string): ResolvedTopic | null {
  for (const week of COURSE_WEEKS) {
    for (const topic of week.topics) {
      if (
        FREE_TOPIC_NUMS.includes(topic.topicNum as 1 | 2 | 3) &&
        slugify(topic.title) === slug
      ) {
        const intro = TOPIC_INTROS[topic.topicNum];
        if (!intro) return null;
        return {
          topicNum: topic.topicNum,
          title: topic.title,
          weekNum: week.weekNum,
          weekTitle: week.title,
          intro,
        };
      }
    }
  }
  return null;
}

/** Other free topics (excluding the current one) for cross-topic nav. */
function getOtherFreeTopics(currentTopicNum: number) {
  const all: { topicNum: number; title: string; weekNum: number }[] = [];
  for (const week of COURSE_WEEKS) {
    for (const topic of week.topics) {
      if (
        FREE_TOPIC_NUMS.includes(topic.topicNum as 1 | 2 | 3) &&
        topic.topicNum !== currentTopicNum
      ) {
        all.push({
          topicNum: topic.topicNum,
          title: topic.title,
          weekNum: week.weekNum,
        });
      }
    }
  }
  return all.sort((a, b) => a.topicNum - b.topicNum);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topicSlug: string }>;
}): Promise<Metadata> {
  const { topicSlug } = await params;
  const topic = findFreeTopicBySlug(topicSlug);
  if (!topic) return { title: "Topic not found" };

  const title = `${topic.title} — Quant Interview Prep`;
  const description =
    topic.intro.definition.slice(0, 160) ||
    `${topic.title} — free preview from the Epigram 4-week quant interview curriculum.`;

  return {
    title,
    description,
    alternates: { canonical: `/learn/${topicSlug}` },
    openGraph: {
      title,
      description,
      url: `${SITE.url}/learn/${topicSlug}`,
      type: "article",
    },
  };
}

export default async function LearnTopicPage({
  params,
}: {
  params: Promise<{ topicSlug: string }>;
}) {
  const { topicSlug } = await params;
  const topic = findFreeTopicBySlug(topicSlug);
  if (!topic) notFound();

  const otherFreeTopics = getOtherFreeTopics(topic.topicNum);
  const lastUpdatedDisplay = new Date(TOPIC_PAGE_LAST_UPDATED).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <main
      className="min-h-screen overflow-y-auto"
      style={{ background: "#faf9f5", height: "100vh" }}
    >
      <JsonLd
        data={courseSchema({ ...topic, dateModified: TOPIC_PAGE_LAST_UPDATED })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: SITE.url },
          { name: "Free Topics", url: `${SITE.url}/learn` },
          { name: topic.title, url: `${SITE.url}/learn/${topicSlug}` },
        ])}
      />

      <div className="mx-auto max-w-3xl px-6 py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm" style={{ color: "#4a4a42" }}>
          <Link href="/" style={{ color: "#a16207" }}>
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/learn" style={{ color: "#a16207" }}>
            Free Topics
          </Link>
          <span className="mx-2">/</span>
          <span>{topic.title}</span>
        </nav>

        <div
          className="text-xs font-medium uppercase mb-2"
          style={{ color: "#a16207", letterSpacing: "1.5px" }}
        >
          Week {topic.weekNum} · {topic.weekTitle} · Topic {topic.topicNum}
        </div>

        <h1
          className="text-4xl font-semibold mb-3"
          style={{
            fontFamily: "var(--font-playfair, serif)",
            color: "#141310",
            letterSpacing: "-1px",
            lineHeight: 1.15,
          }}
        >
          {topic.title}
        </h1>

        <p
          className="mb-8 text-sm"
          style={{ color: "#6b6b62" }}
        >
          Last updated:{" "}
          <time dateTime={TOPIC_PAGE_LAST_UPDATED}>{lastUpdatedDisplay}</time>
        </p>

        <article
          className="prose max-w-none"
          style={{ fontSize: "17px", lineHeight: 1.7, color: "#141310" }}
        >
          <p style={{ marginBottom: "1.5em", fontWeight: 500 }}>
            {topic.intro.definition}
          </p>

          <h2
            className="text-2xl font-semibold mt-10 mb-4"
            style={{
              color: "#141310",
              fontFamily: "var(--font-playfair, serif)",
            }}
          >
            What this topic covers
          </h2>
          <p style={{ marginBottom: "1.25em" }}>{topic.intro.whatItCovers}</p>

          <h2
            className="text-2xl font-semibold mt-10 mb-4"
            style={{
              color: "#141310",
              fontFamily: "var(--font-playfair, serif)",
            }}
          >
            Why it matters for quant interviews
          </h2>
          <p style={{ marginBottom: "1.25em" }}>{topic.intro.whyItMatters}</p>
        </article>

        {otherFreeTopics.length > 0 ? (
          <nav
            aria-label="Other free topics"
            className="mt-12 border-t pt-8"
            style={{ borderColor: "rgb(220,218,210)" }}
          >
            <h2
              className="text-xl font-semibold mb-4"
              style={{ color: "#141310" }}
            >
              Other free topic previews
            </h2>
            <ul style={{ display: "grid", gap: "10px", listStyle: "none", padding: 0 }}>
              {otherFreeTopics.map((t) => (
                <li key={t.topicNum}>
                  <Link
                    href={`/learn/${slugify(t.title)}`}
                    style={{
                      color: "#a16207",
                      fontSize: "16px",
                      textDecoration: "none",
                    }}
                  >
                    Topic {t.topicNum}: {t.title} →
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/learn"
                  style={{
                    color: "#a16207",
                    fontSize: "16px",
                    textDecoration: "none",
                  }}
                >
                  Browse all topics →
                </Link>
              </li>
              <li>
                <Link
                  href="/practice"
                  style={{
                    color: "#a16207",
                    fontSize: "16px",
                    textDecoration: "none",
                  }}
                >
                  Browse free practice problems →
                </Link>
              </li>
            </ul>
          </nav>
        ) : null}

        <div
          className="mt-12 border-t pt-8"
          style={{ borderColor: "rgb(220,218,210)" }}
        >
          <h2 className="text-xl font-semibold mb-3" style={{ color: "#141310" }}>
            Read the full topic
          </h2>
          <p style={{ color: "#4a4a42", fontSize: "15px", lineHeight: 1.65 }}>
            The full topic content includes worked examples, technique
            summaries, and free practice problems with human-verified solutions.
            Sign up free to access the complete Topic {topic.topicNum} and the
            rest of Week {topic.weekNum}.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block mt-4 px-6 py-3 rounded font-medium"
            style={{ background: "#141310", color: "#ffffff", fontSize: "14px" }}
          >
            Get the full curriculum — sign up free →
          </Link>
        </div>
      </div>
    </main>
  );
}
