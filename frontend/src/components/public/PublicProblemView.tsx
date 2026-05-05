"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MathContent } from "@/lib/utils/katex";

export type PublicProblem = {
  problem_id: string;
  problem_name?: string | null;
  problem_text: string | null;
  hint?: string | null;
  solution_text?: string | null;
  correct_answer?: string | null;
  difficulty?: string | null;
};

/**
 * Public, unauthenticated problem renderer for /practice/[slug].
 *
 * Intentionally lightweight — no auth store, no bookmarks, no AI tutor,
 * no progress tracking. Renders LaTeX via the shared MathContent helper
 * (same as the authenticated app, so math looks identical).
 */
export function PublicProblemView({ problem }: { problem: PublicProblem }) {
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

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

      {problem.hint ? (
        <section>
          <h2 className="sr-only">Hint</h2>
          <details
            open={showHint}
            onToggle={(e) => setShowHint((e.target as HTMLDetailsElement).open)}
            style={{
              border: "1px solid rgb(220,218,210)",
              borderRadius: "12px",
              padding: "16px 20px",
              background: "#faf9f5",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 600,
                color: "#a16207",
                fontSize: "14px",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Hint
            </summary>
            <div
              className="mt-3 prose max-w-none"
              style={{ fontSize: "15px", lineHeight: 1.7 }}
            >
              <MathContent content={problem.hint} />
            </div>
          </details>
        </section>
      ) : null}

      {problem.solution_text ? (
        <section>
          <h2 className="sr-only">Solution</h2>
          <details
            open={showSolution}
            onToggle={(e) =>
              setShowSolution((e.target as HTMLDetailsElement).open)
            }
            style={{
              border: "1px solid rgb(220,218,210)",
              borderRadius: "12px",
              padding: "16px 20px",
              background: "#ffffff",
            }}
          >
            <summary
              style={{
                cursor: "pointer",
                fontWeight: 600,
                color: "#141310",
                fontSize: "14px",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Solution
            </summary>
            <div
              className="mt-3 prose max-w-none"
              style={{ fontSize: "15px", lineHeight: 1.7 }}
            >
              <MathContent content={problem.solution_text} />
            </div>
          </details>
        </section>
      ) : null}

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
