"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAllTopicsFlat } from "@/data/course/course-structure";
import type { CourseTopicJSON } from "@/types/course";


interface TopicNavBarProps {
  weekSlug: string;
  topicSlug: string;
  topicData: CourseTopicJSON;
}

export default function TopicNavBar({
  weekSlug,
  topicSlug,
  topicData,
}: TopicNavBarProps) {
  const router = useRouter();
  const allTopics = getAllTopicsFlat();
  const currentIdx = allTopics.findIndex(
    (t) => t.weekSlug === weekSlug && t.topicSlug === topicSlug
  );
  const prev = currentIdx > 0 ? allTopics[currentIdx - 1] : null;
  const next =
    currentIdx < allTopics.length - 1 ? allTopics[currentIdx + 1] : null;

  return (
    <div
      className="h-10 flex items-center justify-between px-4 border-b flex-shrink-0"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--sidebar-background)",
      }}
    >
      {/* Previous */}
      <button
        onClick={() =>
          prev && router.push(`/curriculum/${prev.weekSlug}/${prev.topicSlug}`)
        }
        disabled={!prev}
        className="flex items-center gap-1 text-xs cursor-pointer transition-opacity disabled:opacity-30 disabled:cursor-default"
        style={{ color: "var(--muted-foreground)" }}
        onMouseEnter={(e) => {
          if (prev) e.currentTarget.style.color = "var(--foreground)";
        }}
        onMouseLeave={(e) => {
          if (prev) e.currentTarget.style.color = "var(--muted-foreground)";
        }}
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {prev ? `${prev.title}` : ""}
      </button>

      {/* Next */}
      <button
        onClick={() =>
          next && router.push(`/curriculum/${next.weekSlug}/${next.topicSlug}`)
        }
        disabled={!next}
        className="flex items-center gap-1 text-xs cursor-pointer transition-opacity disabled:opacity-30 disabled:cursor-default"
        style={{ color: "var(--muted-foreground)" }}
        onMouseEnter={(e) => {
          if (next) e.currentTarget.style.color = "var(--foreground)";
        }}
        onMouseLeave={(e) => {
          if (next) e.currentTarget.style.color = "var(--muted-foreground)";
        }}
      >
        {next ? `${next.title}` : ""}
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
