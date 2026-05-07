import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { qaPageSchema, breadcrumbSchema } from "@/lib/schema";
import { SITE } from "@/lib/site";
import { supabase } from "@/lib/supabase/client";
import {
  PublicProblemView,
  type PublicProblem,
  type PublicSubproblem,
} from "@/components/public/PublicProblemView";
import { stripLatexForPlainText } from "@/lib/utils/latex-text";

export const revalidate = 3600;

/**
 * Internal type — extends PublicProblem with the UUID `id` (needed for joins,
 * not for rendering) and the timestamp fields used in metadata + schema.
 */
type FreeProblemFull = PublicProblem & {
  id: string;
  created_at: string | null;
  updated_at: string | null;
};

async function getFreeProblem(slug: string): Promise<FreeProblemFull | null> {
  // 1. Main problem row
  const { data: problem, error } = await supabase
    .from("problems")
    .select(
      "id, problem_id, problem_name, problem_text, correct_answer, hint, difficulty, created_at, updated_at"
    )
    .eq("problem_id", slug)
    .eq("is_free", true)
    .eq("included", true)
    .maybeSingle();
  if (error || !problem) return null;

  // 2. Top-level solutions (subproblem_id IS NULL)
  const { data: topLevelSolutions } = await supabase
    .from("solutions")
    .select("solution_text, solution_order")
    .eq("problem_id", problem.id)
    .is("subproblem_id", null)
    .order("solution_order", { ascending: true });

  // 3. Subproblems + their solutions (parallelized within Promise.all)
  const { data: subRows } = await supabase
    .from("subproblems")
    .select("id, key, problem_text, correct_answer, hint")
    .eq("problem_id", problem.id)
    .order("key", { ascending: true });

  const subproblems: PublicSubproblem[] = await Promise.all(
    (subRows ?? []).map(async (sp) => {
      const { data: subSolutions } = await supabase
        .from("solutions")
        .select("solution_text, solution_order")
        .eq("subproblem_id", sp.id)
        .order("solution_order", { ascending: true });
      return {
        id: sp.id,
        key: sp.key,
        problem_text: sp.problem_text,
        correct_answer: sp.correct_answer,
        hint: sp.hint,
        solutions: subSolutions ?? [],
      };
    })
  );

  return {
    id: problem.id,
    problem_id: problem.problem_id,
    problem_name: problem.problem_name,
    problem_text: problem.problem_text,
    correct_answer: problem.correct_answer,
    hint: problem.hint,
    difficulty: problem.difficulty,
    created_at: problem.created_at,
    updated_at: problem.updated_at,
    topLevelSolutions: topLevelSolutions ?? [],
    subproblems,
  };
}

/**
 * Compute the canonical Q&A `acceptedAnswer.text` for a given problem.
 * Prefers a top-level solution; falls back to concatenated subproblem
 * solutions in `key` order.
 */
function buildAnswerText(problem: FreeProblemFull): string | null {
  const topLevel = problem.topLevelSolutions[0]?.solution_text;
  if (topLevel) return topLevel;

  const parts: string[] = [];
  for (const sp of problem.subproblems) {
    const solText = sp.solutions[0]?.solution_text;
    if (solText) parts.push(`(${sp.key}) ${solText}`);
  }
  return parts.length > 0 ? parts.join("\n\n") : null;
}

function countAllSolutions(problem: FreeProblemFull): number {
  let count = problem.topLevelSolutions.length;
  for (const sp of problem.subproblems) {
    count += sp.solutions.length;
  }
  return count;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const problem = await getFreeProblem(slug);
  if (!problem) {
    return { title: "Problem not found" };
  }
  const cleanName = stripLatexForPlainText(problem.problem_name);
  const title = cleanName
    ? `${cleanName} — Quant Interview Practice`
    : `Quant interview practice problem: ${problem.problem_id}`;
  const description =
    (problem.problem_text ?? "")
      .replace(/\$/g, "")
      .replace(/\\\w+/g, "")
      .slice(0, 160) || SITE.description;

  return {
    title,
    description,
    alternates: { canonical: `/practice/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE.url}/practice/${slug}`,
      type: "article",
    },
  };
}

export default async function PracticeProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const problem = await getFreeProblem(slug);
  if (!problem) notFound();

  const answerText = buildAnswerText(problem);
  const answerCount = countAllSolutions(problem);

  return (
    <main
      className="min-h-screen overflow-y-auto"
      style={{ background: "#faf9f5", height: "100vh" }}
    >
      <JsonLd
        data={qaPageSchema({
          problem_id: problem.problem_id,
          problem_name: problem.problem_name,
          problem_text: problem.problem_text,
          correct_answer: problem.correct_answer,
          hint: problem.hint,
          created_at: problem.created_at,
          updated_at: problem.updated_at,
          answerText,
          answerCount,
        })}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", url: SITE.url },
          { name: "Free Practice", url: `${SITE.url}/practice` },
          { name: problem.problem_id, url: `${SITE.url}/practice/${slug}` },
        ])}
      />

      <div className="mx-auto max-w-3xl px-6 py-12">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 text-sm"
          style={{ color: "#4a4a42" }}
        >
          <Link href="/" style={{ color: "#a16207" }}>
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/practice" style={{ color: "#a16207" }}>
            Free Practice
          </Link>
          <span className="mx-2">/</span>
          <span>Problem</span>
        </nav>

        <h1
          className="text-3xl font-semibold mb-2"
          style={{
            fontFamily: "var(--font-playfair, serif)",
            color: "#141310",
            letterSpacing: "-0.5px",
          }}
        >
          Quant Interview Practice Problem
        </h1>

        {problem.difficulty ? (
          <p
            className="mb-2 text-sm"
            style={{
              color: "#6b6b62",
              fontFamily: "var(--font-geist-mono, monospace)",
            }}
          >
            {problem.difficulty}
          </p>
        ) : null}

        {problem.updated_at ? (
          <p className="mb-8 text-sm" style={{ color: "#6b6b62" }}>
            Last updated:{" "}
            <time dateTime={problem.updated_at}>
              {new Date(problem.updated_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </p>
        ) : (
          <div className="mb-8" />
        )}

        <PublicProblemView problem={problem} />
      </div>
    </main>
  );
}
