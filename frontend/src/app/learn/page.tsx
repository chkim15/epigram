import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, itemListSchema } from "@/lib/schema";
import { SITE } from "@/lib/site";
import { COURSE_WEEKS } from "@/data/course/course-structure";
import { slugify } from "@/lib/utils/slugify";

/** Topic numbers exposed on /learn (matches W1 T1–T3 free problems). */
const FREE_TOPIC_NUMS = [1, 2, 3] as const;

export const metadata: Metadata = {
  title: "Free Quant Interview Curriculum Topics",
  description:
    "Free preview of the Epigram 4-week quant interview curriculum: probability foundations, conditional probability, distributions, and more. Each topic explains what it covers, why it matters for quant interviews, and how it sequences into the full curriculum.",
  alternates: { canonical: "/learn" },
  openGraph: {
    title: "Free Quant Interview Curriculum Topics",
    description:
      "Free preview of the Epigram 4-week quant interview curriculum.",
    url: `${SITE.url}/learn`,
    type: "website",
  },
};

export default function LearnIndexPage() {
  const allTopics = COURSE_WEEKS.flatMap((week) =>
    week.topics.map((topic) => ({ ...topic, week }))
  );
  const freeTopics = allTopics.filter((t) =>
    FREE_TOPIC_NUMS.includes(t.topicNum as 1 | 2 | 3)
  );
  const remainingTopics = allTopics.filter(
    (t) => !FREE_TOPIC_NUMS.includes(t.topicNum as 1 | 2 | 3)
  );

  const itemList = freeTopics.map((t) => ({
    name: t.title,
    url: `${SITE.url}/learn/${slugify(t.title)}`,
  }));

  return (
    <main
      className="min-h-screen overflow-y-auto"
      style={{ background: "#faf9f5", height: "100vh" }}
    >
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: SITE.url },
          { name: "Free Topics", url: `${SITE.url}/learn` },
        ])}
      />
      <JsonLd data={itemListSchema(itemList)} />

      <div className="mx-auto max-w-4xl px-6 py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm" style={{ color: "#4a4a42" }}>
          <Link href="/" style={{ color: "#a16207" }}>
            Home
          </Link>
          <span className="mx-2">/</span>
          <span>Free Topics</span>
        </nav>

        <h1
          className="text-4xl font-semibold mb-4"
          style={{
            fontFamily: "var(--font-playfair, serif)",
            color: "#141310",
            letterSpacing: "-1px",
            lineHeight: 1.15,
          }}
        >
          Free Quant Interview Curriculum Topics
        </h1>
        <p
          className="mb-12"
          style={{ color: "#4a4a42", fontSize: "17px", lineHeight: 1.65, maxWidth: "640px" }}
        >
          Preview the first {freeTopics.length} topics of the Epigram 4-week
          intensive curriculum. Each topic gives a free overview of what&apos;s
          covered and why it matters for quant interviews. Sign up free to read
          the full topic content with worked examples and solutions.
        </p>

        <h2
          className="text-2xl font-semibold mb-4"
          style={{ color: "#141310", fontFamily: "var(--font-playfair, serif)" }}
        >
          Free preview ({freeTopics.length} topics)
        </h2>
        <ul
          style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr", marginBottom: "48px" }}
        >
          {freeTopics.map((t) => (
            <li
              key={t.topicNum}
              style={{
                border: "1px solid rgb(220,218,210)",
                borderRadius: "12px",
                background: "#ffffff",
                padding: "20px 24px",
              }}
            >
              <Link
                href={`/learn/${slugify(t.title)}`}
                className="block"
                style={{ color: "#141310", textDecoration: "none" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "#a16207",
                    }}
                  >
                    Week {t.week.weekNum} · {t.week.title}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#141310",
                    margin: "4px 0 0 0",
                  }}
                >
                  Topic {t.topicNum}: {t.title}
                </h3>
              </Link>
            </li>
          ))}
        </ul>

        <h2
          className="text-2xl font-semibold mb-4"
          style={{ color: "#141310", fontFamily: "var(--font-playfair, serif)" }}
        >
          Full curriculum ({remainingTopics.length} more topics)
        </h2>
        <p style={{ color: "#4a4a42", fontSize: "15px", lineHeight: 1.65, marginBottom: "16px" }}>
          The remaining topics across Weeks 2–4 cover stochastic processes,
          statistics, game theory, options pricing, brainteasers, and quant
          coding. Available with Premium signup.
        </p>
        <ul
          style={{
            display: "grid",
            gap: "8px",
            gridTemplateColumns: "1fr",
            marginBottom: "32px",
          }}
        >
          {remainingTopics.map((t) => (
            <li
              key={t.topicNum}
              style={{
                fontSize: "14px",
                color: "#4a4a42",
                padding: "8px 12px",
                borderLeft: "2px solid rgb(220,218,210)",
              }}
            >
              <span style={{ color: "#9b9b93", fontWeight: 500 }}>
                W{t.week.weekNum} T{t.topicNum}:
              </span>{" "}
              {t.title}
            </li>
          ))}
        </ul>

        <div
          className="mt-12 border-t pt-8"
          style={{ borderColor: "rgb(220,218,210)" }}
        >
          <Link
            href="/auth/signup"
            className="inline-block px-6 py-3 rounded font-medium"
            style={{ background: "#141310", color: "#ffffff", fontSize: "14px" }}
          >
            Get the full curriculum — sign up free →
          </Link>
        </div>
      </div>
    </main>
  );
}
