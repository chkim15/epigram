"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MathContent } from "@/lib/utils/katex";

export type PublicSolution = {
  solution_text: string;
  solution_order: number;
};

export type PublicSubproblem = {
  id: string;
  key: string;
  problem_text: string | null;
  correct_answer: string | null;
  hint: string | null;
  solutions: PublicSolution[];
};

export type PublicProblem = {
  problem_id: string;
  problem_name?: string | null;
  problem_text: string | null;
  hint?: string | null;
  correct_answer?: string | null;
  difficulty?: string | null;
  topLevelSolutions: PublicSolution[];
  subproblems: PublicSubproblem[];
};

/**
 * Public, unauthenticated problem renderer for /practice/[slug].
 *
 * Two rendering modes:
 *  - **Top-level solution:** when the problem has its own solution row(s)
 *    in `solutions` (subproblem_id IS NULL). Renders question, hint, solution.
 *  - **Subproblem-structured:** when the problem has `subproblems` rows,
 *    each with its own solution. Renders each Part {key} with its own
 *    statement, hint, and solution. (No top-level solution in this case.)
 *
 * Renders LaTeX via the shared MathContent helper (same as the authenticated
 * app, so math looks identical).
 */
export function PublicProblemView({ problem }: { problem: PublicProblem }) {
  const hasSubproblems = problem.subproblems.length > 0;
  const topLevelSolution = problem.topLevelSolutions[0]?.solution_text ?? null;

  return (
    <div className="space-y-6">
      {problem.difficulty ? (
        <div
          className="inline-block text-xs font-medium uppercase tracking-wider"
          style={{ color: "#a16207", letterSpacing: "1.5px" }}
        >
          Difficulty: {problem.difficulty}
        </div>
      ) : null}

      <section>
        <div
          role="heading"
          aria-level={2}
          className="text-xl font-semibold mb-3"
          style={{
            color: "#141310",
            fontFamily: "var(--font-playfair, serif)",
          }}
        >
          {problem.problem_name ? (
            <MathContent content={problem.problem_name} />
          ) : (
            "Problem"
          )}
        </div>
        <div
          className="prose max-w-none"
          style={{ fontSize: "16px", lineHeight: 1.7, color: "#141310" }}
        >
          {problem.problem_text ? (
            <MathContent content={problem.problem_text} />
          ) : (
            <p>(This problem has no main statement; subproblems only.)</p>
          )}
        </div>
      </section>

      {/* Top-level hint (only when there's no subproblem structure) */}
      {!hasSubproblems && problem.hint ? (
        <CollapsibleBlock label="Hint" labelColor="#a16207" background="#faf9f5">
          <MathContent content={problem.hint} />
        </CollapsibleBlock>
      ) : null}

      {/* Top-level solution */}
      {!hasSubproblems && topLevelSolution ? (
        <CollapsibleBlock label="Solution" labelColor="#141310" background="#ffffff">
          <MathContent content={topLevelSolution} />
        </CollapsibleBlock>
      ) : null}

      {/* Subproblem rendering */}
      {hasSubproblems
        ? problem.subproblems.map((sp) => (
            <SubproblemSection key={sp.id} subproblem={sp} />
          ))
        : null}

      <div
        className="mt-12 border-t pt-8"
        style={{ borderColor: "rgb(220,218,210)" }}
      >
        <h2 className="text-xl font-semibold mb-3" style={{ color: "#141310" }}>
          More practice
        </h2>
        <p style={{ color: "#4a4a42", fontSize: "15px", lineHeight: 1.6 }}>
          This is a free preview from the Epigram practice bank. Sign up free for
          the full 4-week curriculum and 200+ verified problems from real recent
          interviews.
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
  );
}

function SubproblemSection({ subproblem }: { subproblem: PublicSubproblem }) {
  const subSolution = subproblem.solutions[0]?.solution_text ?? null;
  return (
    <section
      style={{
        borderTop: "1px solid rgb(220,218,210)",
        paddingTop: "24px",
      }}
    >
      <h3
        className="text-lg font-semibold mb-3"
        style={{
          color: "#141310",
          fontFamily: "var(--font-playfair, serif)",
        }}
      >
        Part {subproblem.key}
      </h3>
      {subproblem.problem_text ? (
        <div
          className="prose max-w-none mb-4"
          style={{ fontSize: "16px", lineHeight: 1.7, color: "#141310" }}
        >
          <MathContent content={subproblem.problem_text} />
        </div>
      ) : null}

      {subproblem.hint ? (
        <div className="mb-3">
          <CollapsibleBlock label="Hint" labelColor="#a16207" background="#faf9f5">
            <MathContent content={subproblem.hint} />
          </CollapsibleBlock>
        </div>
      ) : null}

      {subSolution ? (
        <CollapsibleBlock label="Solution" labelColor="#141310" background="#ffffff">
          <MathContent content={subSolution} />
        </CollapsibleBlock>
      ) : null}
    </section>
  );
}

/**
 * Reusable collapsible details block. Preserves the original Phase 1 styling
 * for hint/solution sections — keeps UX consistent across top-level and
 * subproblem rendering.
 */
function CollapsibleBlock({
  label,
  labelColor,
  background,
  children,
}: {
  label: string;
  labelColor: string;
  background: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* sr-only H2 for AI/AEO heading hierarchy without visual clutter */}
      <h2 className="sr-only">{label}</h2>
      <details
        open={open}
        onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
        style={{
          border: "1px solid rgb(220,218,210)",
          borderRadius: "12px",
          padding: "16px 20px",
          background,
        }}
      >
        <summary
          style={{
            cursor: "pointer",
            fontWeight: 600,
            color: labelColor,
            fontSize: "14px",
            letterSpacing: "1px",
            textTransform: "uppercase",
          }}
        >
          {label}
        </summary>
        <div
          className="mt-3 prose max-w-none"
          style={{ fontSize: "15px", lineHeight: 1.7 }}
        >
          {children}
        </div>
      </details>
    </>
  );
}
