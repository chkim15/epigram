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

type ResolvedTopic = {
  topicNum: number;
  title: string;
  weekNum: number;
  weekTitle: string;
  intro: string;
};

/**
 * Topic intros for the free preview pages. Hand-written to give AI engines
 * and search crawlers something substantive to index — without giving away
 * the full curriculum content (which lives behind auth at /curriculum/...).
 */
const TOPIC_INTROS: Record<number, string> = {
  1: "Foundations of Probability Modeling sits at the very start of the Epigram 4-week curriculum because every other topic — distributions, stochastic processes, statistics, even brainteasers — assumes you can set up a clean probability model from a verbal interview prompt. This topic covers sample spaces, events, axioms of probability, equally-likely outcomes, basic combinatorial counting (permutations, combinations, multinomial coefficients), and the inclusion-exclusion principle. The level is calibrated to interview problems firms like Citadel, Jane Street, and Optiver actually ask in first-round screens, where the trap is rarely a hard formula and almost always a sloppy model.",
  2: "Conditional Probability and Bayes' theorem are tested in nearly every quant interview at every top firm, and they are the single most common source of wrong answers from otherwise strong candidates. This topic covers the definition of conditional probability, the multiplication rule, the law of total probability, Bayes' theorem in both its 2-event and partition forms, and the standard set of trap problems (the Monty Hall family, false-positive medical-test problems, the two-children problem, prosecutor's fallacy). Mastery of this topic unlocks roughly a third of all probability interview questions.",
  3: "Distributions covers the discrete and continuous distributions that appear repeatedly in quant interviews: Bernoulli, Binomial, Geometric, Negative Binomial, Poisson, Uniform, Exponential, Normal, and the relationships between them (Poisson as a Binomial limit, Exponential as the memoryless continuous analog of Geometric). Interviewers expect not just memorized formulas but the ability to recognize which distribution applies from a verbal description and to compute expectations and probabilities from first principles. This topic also introduces moment-generating functions at the level needed to derive sums of independent random variables — a setup used heavily in Week 1's Topics 4–6 and throughout Weeks 2 and 3.",
};

function findFreeTopicBySlug(slug: string): ResolvedTopic | null {
  for (const week of COURSE_WEEKS) {
    for (const topic of week.topics) {
      if (
        FREE_TOPIC_NUMS.includes(topic.topicNum as 1 | 2 | 3) &&
        slugify(topic.title) === slug
      ) {
        return {
          topicNum: topic.topicNum,
          title: topic.title,
          weekNum: week.weekNum,
          weekTitle: week.title,
          intro: TOPIC_INTROS[topic.topicNum] ?? "",
        };
      }
    }
  }
  return null;
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
  const description = topic.intro.slice(0, 160) || `${topic.title} — free preview from the Epigram 4-week quant interview curriculum.`;

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

  return (
    <main
      className="min-h-screen overflow-y-auto"
      style={{ background: "#faf9f5", height: "100vh" }}
    >
      <JsonLd data={courseSchema(topic)} />
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
          className="text-4xl font-semibold mb-6"
          style={{
            fontFamily: "var(--font-playfair, serif)",
            color: "#141310",
            letterSpacing: "-1px",
            lineHeight: 1.15,
          }}
        >
          {topic.title}
        </h1>

        <article
          className="prose max-w-none"
          style={{ fontSize: "17px", lineHeight: 1.7, color: "#141310" }}
        >
          <p style={{ marginBottom: "1.25em" }}>{topic.intro}</p>
        </article>

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
