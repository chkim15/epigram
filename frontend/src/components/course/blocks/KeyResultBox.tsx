"use client";

import { MathContent } from "@/lib/utils/katex";

interface KeyResultBoxProps {
  title: string;
  content: string;
}

export default function KeyResultBox({ title, content }: KeyResultBoxProps) {
  return (
    <div
      className="rounded-lg my-4 border overflow-hidden"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--background)",
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
