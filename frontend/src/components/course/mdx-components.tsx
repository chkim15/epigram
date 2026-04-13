"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, AlertTriangle, ExternalLink } from "lucide-react";
import { getLeetCodeUrl } from "@/data/course/lc-slugs";

function extractLcNumber(number?: string): number | null {
  if (!number) return null;
  const match = number.match(/LC\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

function LeetCodeLink({ number }: { number?: string }) {
  const lcNum = extractLcNumber(number);
  const url = lcNum ? getLeetCodeUrl(lcNum) : null;
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="p-1 rounded cursor-pointer transition-colors inline-flex"
      style={{ color: "rgba(255,255,255,0.7)" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
      title={`Open LC ${lcNum} on LeetCode`}
    >
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );
}

function InternalProblemLink({ problemId, number }: { problemId?: string; number?: string }) {
  if (!problemId || extractLcNumber(number) !== null) return null;
  return (
    <Link
      href={`/problems/${problemId}?from=curriculum`}
      className="p-1 rounded cursor-pointer transition-colors inline-flex"
      style={{ color: "rgba(255,255,255,0.7)" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
      title="Open in Problem Viewer"
      onClick={(e) => e.stopPropagation()}
    >
      <ExternalLink className="h-3.5 w-3.5" />
    </Link>
  );
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  veryhard: "Very Hard",
};

interface BoxProps {
  title?: string;
  children: ReactNode;
}

function MdxConceptBox({ title, children }: BoxProps) {
  return (
    <div
      className="rounded-lg my-6 border overflow-hidden shadow-sm"
      style={{
        borderColor: "#1e3a5f",
        backgroundColor: "#eff6ff",
      }}
    >
      {title && (
        <div
          className="px-4 py-2.5 text-sm font-bold"
          style={{ 
            backgroundColor: "#1e3a5f",
            color: "white" 
          }}
        >
          {title}
        </div>
      )}
      <div
        className="px-4 py-3 text-sm leading-relaxed"
        style={{ color: "var(--foreground)" }}
      >
        {children}
      </div>
    </div>
  );
}

function MdxTechniqueBox({ title, children }: BoxProps) {
  return (
    <div
      className="rounded-lg my-6 border overflow-hidden shadow-sm"
      style={{
        borderColor: "#375623",
        backgroundColor: "#EAF3DE",
      }}
    >
      {title && (
        <div
          className="px-4 py-2.5 text-sm font-bold"
          style={{
            backgroundColor: "#375623",
            color: "white"
          }}
        >
          Technique: {title}
        </div>
      )}
      <div
        className="px-4 py-3 text-sm leading-relaxed"
        style={{ color: "var(--foreground)" }}
      >
        {children}
      </div>
    </div>
  );
}

function MdxKeyResultBox({ title, children }: BoxProps) {
  return (
    <div
      className="rounded-lg my-6 border overflow-hidden shadow-sm"
      style={{
        borderColor: "#1e3a5f",
        backgroundColor: "#eff6ff",
      }}
    >
      {title && (
        <div
          className="px-4 py-2.5 text-sm font-semibold"
          style={{ 
            backgroundColor: "#1e3a5f",
            color: "white" 
          }}
        >
          {title}
        </div>
      )}
      <div
        className="px-4 py-3 text-sm leading-relaxed"
        style={{ color: "var(--foreground)" }}
      >
        {children}
      </div>
    </div>
  );
}

function MdxWarningBox({ title, children }: BoxProps) {
  return (
    <div
      className="rounded-lg my-6 border overflow-hidden shadow-sm"
      style={{
        borderColor: "#fca5a5",
        backgroundColor: "#fef2f2",
      }}
    >
      <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderColor: "#fecaca", backgroundColor: "#fee2e2" }}>
        <AlertTriangle
          className="h-4 w-4 flex-shrink-0"
          style={{ color: "#991b1b" }}
        />
        <span className="text-sm font-semibold" style={{ color: "#991b1b" }}>
          {title || "Warning"}
        </span>
      </div>
      <div
        className="px-4 py-3 text-sm leading-relaxed"
        style={{ color: "var(--foreground)" }}
      >
        {children}
      </div>
    </div>
  );
}

function MdxWorkedBox({ number, difficulty, problemid, problemId, children }: { number?: string; difficulty?: string; problemid?: string; problemId?: string; children: ReactNode }) {
  const diffLabel = difficulty ? DIFFICULTY_LABELS[difficulty] || difficulty : undefined;

  return (
    <div
      className="rounded-lg my-6 border overflow-hidden shadow-sm"
      style={{ borderColor: "#633806", backgroundColor: "#fdf8f0" }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-3"
        style={{ backgroundColor: "#633806" }}
      >
        <span
          className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
        >
          WORKED EXAMPLE
        </span>
        {number && (
          <span
            className="text-sm font-semibold"
            style={{ color: "white" }}
          >
            Problem {number}
          </span>
        )}
        {diffLabel && (
          <span
            className="text-[10px] uppercase tracking-wider font-bold ml-auto"
            style={{ color: "white" }}
          >
            {diffLabel}
          </span>
        )}
        <LeetCodeLink number={number} />
        <InternalProblemLink problemId={problemId || problemid} number={number} />
      </div>
      <div
        className="px-4 py-4 text-sm leading-relaxed"
        style={{ color: "var(--foreground)" }}
      >
        {children}
      </div>
    </div>
  );
}

function MdxSolutionBox({ children }: { children: ReactNode }) {
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div
      className="rounded-b-lg mb-6 -mt-6 border border-t-0 overflow-hidden shadow-sm"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--background)" }}
    >
      <button
        onClick={() => setShowSolution(!showSolution)}
        className="w-full px-4 py-2.5 flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-wider font-bold cursor-pointer transition-colors"
        style={{
          color: showSolution ? "var(--foreground)" : "var(--muted-foreground)",
          backgroundColor: showSolution
            ? "var(--sidebar-background)"
            : "var(--background)",
          borderTop: showSolution ? "1px solid var(--border)" : "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--sidebar-background)";
          e.currentTarget.style.color = "var(--foreground)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = showSolution
            ? "var(--sidebar-background)"
            : "var(--background)";
          e.currentTarget.style.color = showSolution
            ? "var(--foreground)"
            : "var(--muted-foreground)";
        }}
      >
        {showSolution ? (
          <>
            Hide Solution <ChevronUp className="h-3.5 w-3.5" />
          </>
        ) : (
          <>
            Show Solution <ChevronDown className="h-3.5 w-3.5" />
          </>
        )}
      </button>
      {showSolution && (
        <div
          className="px-4 py-4 text-sm leading-relaxed border-t"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--sidebar-background)",
            color: "var(--foreground)",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function MdxFreeProblem({
  number,
  problemId,
  difficulty,
  children,
}: {
  number?: string;
  problemId?: string;
  difficulty?: string;
  children: ReactNode;
}) {
  const diffLabel = difficulty ? DIFFICULTY_LABELS[difficulty] || difficulty : undefined;

  return (
    <div
      className="rounded-lg my-6 border overflow-hidden shadow-sm"
      style={{ borderColor: "#375623", backgroundColor: "#f2f7f4" }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-3"
        style={{ backgroundColor: "#375623" }}
      >
        <span
          className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
        >
          FREE
        </span>
        {number && (
          <span
            className="text-sm font-semibold"
            style={{ color: "white" }}
          >
            Problem {number}
          </span>
        )}
        {diffLabel && (
          <span
            className="text-[10px] uppercase tracking-wider font-bold ml-auto"
            style={{ color: "white" }}
          >
            {diffLabel}
          </span>
        )}
        <LeetCodeLink number={number} />
        <InternalProblemLink problemId={problemId} number={number} />
      </div>
      <div
        className="px-4 py-4 text-sm leading-relaxed"
        style={{ color: "var(--foreground)" }}
      >
        {children}
      </div>
    </div>
  );
}

function MdxPremiumProblem({
  number,
  problemId,
  difficulty,
  children,
}: {
  number?: string;
  problemId?: string;
  difficulty?: string;
  children: ReactNode;
}) {
  const diffLabel = difficulty ? DIFFICULTY_LABELS[difficulty] || difficulty : undefined;

  return (
    <div
      className="rounded-lg my-6 border overflow-hidden shadow-sm"
      style={{ borderColor: "#534AB7", backgroundColor: "#f3f2fe" }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-3"
        style={{ backgroundColor: "#534AB7" }}
      >
        <span
          className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded"
          style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
        >
          PREMIUM
        </span>
        {number && (
          <span
            className="text-sm font-semibold"
            style={{ color: "white" }}
          >
            Problem {number}
          </span>
        )}
        {diffLabel && (
          <span
            className="text-[10px] uppercase tracking-wider font-bold ml-auto"
            style={{ color: "white" }}
          >
            {diffLabel}
          </span>
        )}
        <LeetCodeLink number={number} />
        <InternalProblemLink problemId={problemId} number={number} />
      </div>
      <div
        className="px-4 py-4 text-sm leading-relaxed"
        style={{ color: "var(--foreground)" }}
      >
        {children}
      </div>
    </div>
  );
}

function MdxTechniqueSummary({ title, children }: { title?: string, children: ReactNode }) {
  return (
    <div
      className="rounded-lg my-6 border overflow-hidden shadow-sm"
      style={{
        borderColor: "rgba(30, 58, 95, 0.5)", // EpiNavy!50
        backgroundColor: "rgba(30, 58, 95, 0.06)", // EpiNavy!6
      }}
    >
      <div
        className="px-4 py-2.5 text-sm font-semibold border-b tracking-wide"
        style={{ 
          borderColor: "rgba(30, 58, 95, 0.2)",
          color: "#1e3a5f" // EpiNavy
        }}
      >
        {title || "Technique Summary"}
      </div>
      <div
        className="px-4 py-3 text-sm leading-relaxed technique-summary-body"
        style={{ color: "var(--foreground)" }}
      >
        {children}
      </div>
    </div>
  );
}

function MdxLearningObjectives({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div
      className="rounded-lg my-6 border overflow-hidden shadow-sm"
      style={{
        backgroundColor: "#f0f2f6",
        borderColor: "#31364d",
      }}
    >
      <div
        className="px-4 py-2.5 text-sm font-semibold tracking-wide"
        style={{ backgroundColor: "#31364d", color: "white" }}
      >
        {title || <>By the end of this topic, you will be able to&hellip;</>}
      </div>
      <div className="px-4 py-3" style={{ color: "var(--foreground)" }}>
        {children}
      </div>
    </div>
  );
}

function MdxGoldBox({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-lg my-6 border px-4 py-4 text-sm leading-relaxed"
      style={{
        backgroundColor: "#faf4e8",
        borderColor: "#b87333",
        color: "var(--foreground)",
      }}
    >
      {children}
    </div>
  );
}

function MdxGrayBox({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-lg my-6 border px-4 py-4 text-sm leading-relaxed mdx-graybox"
      style={{
        backgroundColor: "#f8f8f8",
        borderColor: "rgba(90,100,115,0.4)",
        color: "var(--foreground)",
      }}
    >
      {children}
    </div>
  );
}

// Export each component individually so they can be imported
// as client component references in server components
export {
  MdxConceptBox as ConceptBox,
  MdxTechniqueBox as TechniqueBox,
  MdxKeyResultBox as KeyResult,
  MdxWarningBox as WarningBox,
  MdxWorkedBox as WorkedBox,
  MdxSolutionBox as SolutionBox,
  MdxFreeProblem as FreeProblem,
  MdxPremiumProblem as PremiumProblem,
  MdxTechniqueSummary as TechniqueSummary,
  MdxLearningObjectives as LearningObjectives,
  MdxGoldBox as GoldBox,
  MdxGrayBox as GrayBox,
};
