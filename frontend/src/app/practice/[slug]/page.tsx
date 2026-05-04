import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { qaPageSchema, breadcrumbSchema } from "@/lib/schema";
import { SITE } from "@/lib/site";
import { supabase } from "@/lib/supabase/client";
import { PublicProblemView } from "@/components/public/PublicProblemView";

export const revalidate = 3600;

type FreeProblem = {
  problem_id: string;
  problem_text: string | null;
  correct_answer: string | null;
  hint: string | null;
  solution_text: string | null;
  difficulty: string | null;
  updated_at: string | null;
};

async function getFreeProblem(slug: string): Promise<FreeProblem | null> {
  const { data, error } = await supabase
    .from("problems")
    .select(
      "problem_id, problem_text, correct_answer, hint, solution_text, difficulty, updated_at"
    )
    .eq("problem_id", slug)
    .eq("is_free", true)
    .eq("included", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as FreeProblem;
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
  const title = `Quant interview practice problem: ${problem.problem_id}`;
  const description = (problem.problem_text ?? "")
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

  return (
    <main
      className="min-h-screen overflow-y-auto"
      style={{ background: "#faf9f5", height: "100vh" }}
    >
      <JsonLd data={qaPageSchema(problem)} />
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
          <span>{problem.problem_id}</span>
        </nav>

        <h1
          className="text-3xl font-semibold mb-8"
          style={{
            fontFamily: "var(--font-playfair, serif)",
            color: "#141310",
            letterSpacing: "-0.5px",
          }}
        >
          Practice problem
        </h1>

        <PublicProblemView problem={problem} />
      </div>
    </main>
  );
}
