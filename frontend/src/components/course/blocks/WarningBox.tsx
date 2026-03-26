"use client";

import { AlertTriangle } from "lucide-react";
import { MathContent } from "@/lib/utils/katex";

interface WarningBoxProps {
  title: string;
  content: string;
}

export default function WarningBox({ title, content }: WarningBoxProps) {
  return (
    <div
      className="rounded-lg my-4 overflow-hidden"
      style={{
        backgroundColor: "#fffbeb",
        borderLeft: "4px solid #a16207",
      }}
    >
      <div className="px-4 pt-3 pb-1 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color: "#a16207" }} />
        <span className="text-sm font-semibold" style={{ color: "#a16207" }}>
          {title || "Warning"}
        </span>
      </div>
      <div className="px-4 pb-3 text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
        <MathContent content={content} />
      </div>
    </div>
  );
}
