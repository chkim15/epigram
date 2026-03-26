"use client";

import { MathContent } from "@/lib/utils/katex";

interface ConceptBoxProps {
  title: string;
  content: string;
}

export default function ConceptBox({ title, content }: ConceptBoxProps) {
  return (
    <div
      className="rounded-lg my-4 overflow-hidden"
      style={{
        backgroundColor: "var(--sidebar-background)",
        borderLeft: "4px solid var(--foreground)",
      }}
    >
      {title && (
        <div
          className="px-4 pt-3 pb-1 text-sm font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          <MathContent content={title} />
        </div>
      )}
      <div className="px-4 pb-3 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
        <MathContent content={content} />
      </div>
    </div>
  );
}
