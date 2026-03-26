"use client";

import { MathContent } from "@/lib/utils/katex";

interface LearningObjectivesProps {
  objectives: string[];
}

export default function LearningObjectives({
  objectives,
}: LearningObjectivesProps) {
  if (objectives.length === 0) return null;

  return (
    <div
      className="rounded-lg my-6 border overflow-hidden shadow-sm"
      style={{
        backgroundColor: "#eff6ff",
        borderColor: "#1e3a5f",
      }}
    >
      <div
        className="px-4 py-2.5 text-sm font-semibold tracking-wide"
        style={{ backgroundColor: "#1e3a5f", color: "white" }}
      >
        By the end of this topic, you will be able to&hellip;
      </div>
      <ol
        className="px-4 py-3 pl-8 space-y-1.5 list-decimal"
        style={{ color: "var(--foreground)" }}
      >
        {objectives.map((obj, i) => (
          <li key={i} className="text-sm leading-relaxed">
            <MathContent content={obj} />
          </li>
        ))}
      </ol>
    </div>
  );
}
