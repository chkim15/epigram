import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, itemListSchema } from "@/lib/schema";
import { SITE } from "@/lib/site";
import { supabase } from "@/lib/supabase/client";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Free Quant Interview Practice Problems",
  description:
    "Browse free quant interview practice problems from real recent interviews at top firms — Citadel, Jane Street, Two Sigma, D. E. Shaw, Optiver, HRT, Jump Trading, IMC. Human-verified solutions, no signup required.",
  alternates: { canonical: "/practice" },
  openGraph: {
    title: "Free Quant Interview Practice Problems",
    description:
      "Browse free quant interview practice problems from real recent interviews at top firms. Human-verified solutions, no signup required.",
    url: `${SITE.url}/practice`,
    type: "website",
  },
};

type FreeProblemListing = {
  problem_id: string;
  difficulty: string | null;
  problem_text: string | null;
};

async function getFreeProblems(): Promise<FreeProblemListing[]> {
  const { data, error } = await supabase
    .from("problems")
    .select("problem_id, difficulty, problem_text")
    .eq("is_free", true)
    .eq("included", true)
    .order("problem_id", { ascending: true });
  if (error || !data) return [];
  return data as FreeProblemListing[];
}

function shortPreview(text: string | null): string {
  if (!text) return "";
  const stripped = text.replace(/\$/g, "").replace(/\\\w+/g, " ").replace(/\s+/g, " ").trim();
  return stripped.length > 180 ? stripped.slice(0, 180) + "…" : stripped;
}

export default async function PracticeIndexPage() {
  const problems = await getFreeProblems();

  const itemList = problems.map((p) => ({
    name: p.problem_id,
    url: `${SITE.url}/practice/${p.problem_id}`,
  }));

  return (
    <main
      className="min-h-screen overflow-y-auto"
      style={{ background: "#faf9f5", height: "100vh" }}
    >
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: SITE.url },
          { name: "Free Practice", url: `${SITE.url}/practice` },
        ])}
      />
      <JsonLd data={itemListSchema(itemList)} />

      <div className="mx-auto max-w-4xl px-6 py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm" style={{ color: "#4a4a42" }}>
          <Link href="/" style={{ color: "#a16207" }}>
            Home
          </Link>
          <span className="mx-2">/</span>
          <span>Free Practice</span>
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
          Free Quant Interview Practice Problems
        </h1>
        <p
          className="mb-12"
          style={{ color: "#4a4a42", fontSize: "17px", lineHeight: 1.65, maxWidth: "640px" }}
        >
          {problems.length} free problems from the Epigram practice bank — drawn
          from real recent quant interviews at top firms (Citadel, Jane Street,
          Two Sigma, D. E. Shaw, Optiver, HRT, Jump Trading, IMC). Every solution
          is human-verified.
        </p>

        {problems.length === 0 ? (
          <p style={{ color: "#4a4a42" }}>
            No free problems are available right now. Check back soon, or{" "}
            <Link href="/auth/signup" style={{ color: "#a16207" }}>
              sign up free
            </Link>{" "}
            for the full curriculum.
          </p>
        ) : (
          <ul style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr" }}>
            {problems.map((p) => (
              <li
                key={p.problem_id}
                style={{
                  border: "1px solid rgb(220,218,210)",
                  borderRadius: "12px",
                  background: "#ffffff",
                  padding: "16px 20px",
                }}
              >
                <Link
                  href={`/practice/${p.problem_id}`}
                  className="block"
                  style={{ color: "#141310", textDecoration: "none" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      style={{
                        fontFamily: "var(--font-geist-mono, monospace)",
                        fontSize: "13px",
                        color: "#4a4a42",
                      }}
                    >
                      {p.problem_id}
                    </span>
                    {p.difficulty ? (
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          letterSpacing: "1.5px",
                          textTransform: "uppercase",
                          color: "#a16207",
                        }}
                      >
                        {p.difficulty}
                      </span>
                    ) : null}
                  </div>
                  <p style={{ color: "#141310", fontSize: "15px", lineHeight: 1.55, margin: 0 }}>
                    {shortPreview(p.problem_text) || "View problem →"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div
          className="mt-16 border-t pt-8"
          style={{ borderColor: "rgb(220,218,210)" }}
        >
          <h2 className="text-xl font-semibold mb-3" style={{ color: "#141310" }}>
            Want the full set?
          </h2>
          <p style={{ color: "#4a4a42", fontSize: "15px", lineHeight: 1.65 }}>
            The full Epigram practice bank covers 8+ top firms with continuously
            updated recent-year problems. The 4-week intensive curriculum sequences
            ~180 curated problems across 7 topic domains.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block mt-4 px-6 py-3 rounded font-medium"
            style={{ background: "#141310", color: "#ffffff", fontSize: "14px" }}
          >
            Sign up free →
          </Link>
        </div>
      </div>
    </main>
  );
}
