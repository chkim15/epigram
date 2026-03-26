"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { MathContent } from "@/lib/utils/katex";

interface CourseProblemProps {
  type: "freeproblem" | "premiumproblem";
  number: string;
  difficulty: string;
  problemId: string;
  content: string;
  solution: string;
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  veryhard: "Very Hard",
};

export default function CourseProblem({
  type,
  number,
  difficulty,
  problemId,
  content,
  solution,
}: CourseProblemProps) {
  const [showSolution, setShowSolution] = useState(false);
  const router = useRouter();
  const isPremium = type === "premiumproblem";

  const headerBg = isPremium ? "#534AB7" : "#375623";
  const bodyBg = isPremium ? "#f3f2fe" : "#f2f7f4";
  const borderColor = isPremium ? "#534AB7" : "#375623";

  return (
    <div
      className="rounded-lg my-4 border overflow-hidden"
      style={{ borderColor, backgroundColor: bodyBg }}
    >
      {/* Header */}
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ backgroundColor: headerBg }}
      >
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white" }}
        >
          {isPremium ? "Premium" : "Free"}
        </span>
        <span
          className="text-xs font-medium"
          style={{ color: "white" }}
        >
          Problem {number}
        </span>
        <span
          className="text-xs font-medium"
          style={{ color: "white" }}
        >
          {DIFFICULTY_LABELS[difficulty] || difficulty}
        </span>

        {/* Link to full problem view */}
        {problemId && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/problems/${problemId}`);
            }}
            className="ml-auto p-1 rounded cursor-pointer transition-colors"
            style={{ color: "rgba(255,255,255,0.7)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "white")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(255,255,255,0.7)")
            }
            title="Open in Problem Viewer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Content */}
      <div
        className="px-4 py-3 text-sm leading-relaxed"
        style={{ color: "var(--foreground)" }}
      >
        <MathContent content={content} />
      </div>

      {/* Solution toggle */}
      {solution && (
        <>
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="w-full px-4 py-2 flex items-center gap-1.5 text-xs font-medium border-t cursor-pointer transition-colors"
            style={{
              borderColor: "var(--border)",
              color: "var(--muted-foreground)",
              backgroundColor: showSolution
                ? "var(--sidebar-background)"
                : "transparent",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                "var(--sidebar-background)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = showSolution
                ? "var(--sidebar-background)"
                : "transparent")
            }
          >
            {showSolution ? (
              <>
                Hide Solution <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Show Solution <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
          {showSolution && (
            <div
              className="px-4 py-3 text-sm leading-relaxed border-t"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--sidebar-background)",
                color: "var(--foreground)",
              }}
            >
              <MathContent content={solution} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
