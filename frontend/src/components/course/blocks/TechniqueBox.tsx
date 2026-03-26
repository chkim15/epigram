"use client";

import { MathContent } from "@/lib/utils/katex";

interface TechniqueBoxProps {
  title: string;
  content: string;
}

export default function TechniqueBox({ title, content }: TechniqueBoxProps) {
  return (
    <div
      className="rounded-lg my-4 overflow-hidden"
      style={{
        backgroundColor: "#EAF3DE",
        borderLeft: "4px solid #375623",
      }}
    >
      {title && (
        <div
          className="px-4 pt-3 pb-1 text-sm font-bold"
          style={{ color: "#375623" }}
        >
          Technique: <MathContent content={title} />
        </div>
      )}
      <div className="px-4 pb-3 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
        <MathContent content={content} />
      </div>
    </div>
  );
}
