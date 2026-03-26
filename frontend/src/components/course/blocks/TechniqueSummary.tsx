"use client";

import { MathContent } from "@/lib/utils/katex";

interface TechniqueSummaryProps {
  content: string;
}

export default function TechniqueSummary({ content }: TechniqueSummaryProps) {
  return (
    <div
      className="rounded-lg my-4 overflow-hidden"
      style={{
        backgroundColor: "var(--sidebar-background)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        className="px-4 pt-3 pb-1 text-sm font-semibold"
        style={{ color: "var(--foreground)" }}
      >
        Technique Summary
      </div>
      <div className="px-4 pb-3 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
        <MathContent content={content} />
      </div>
    </div>
  );
}
