"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { COURSE_WEEKS, getWeekBySlug } from "@/data/course/course-structure";
import { useCourseProgress } from "@/hooks/useCourseProgress";

interface CourseSidebarProps {
  currentWeekSlug: string;
  currentTopicSlug: string;
  standaloneSlug?: "intro" | "departing";
}

export default function CourseSidebar({
  currentWeekSlug,
  currentTopicSlug,
  standaloneSlug,
}: CourseSidebarProps) {
  const router = useRouter();
  const currentWeek = getWeekBySlug(currentWeekSlug);
  const { getTopicStatus, getWeekProgress } = useCourseProgress();

  const [viewingWeekIdx, setViewingWeekIdx] = useState(() => {
    const idx = COURSE_WEEKS.findIndex((w) => w.slug === currentWeekSlug);
    return idx >= 0 ? idx : 0;
  });
  const viewingWeek = COURSE_WEEKS[viewingWeekIdx];

  if (!viewingWeek) return null;

  const progress = getWeekProgress(viewingWeek.weekNum);

  const introActive = standaloneSlug === "intro";
  const departingActive = standaloneSlug === "departing";

  return (
    <div
      className="w-[280px] flex-shrink-0 border-r overflow-y-auto custom-scrollbar flex flex-col"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--sidebar-background)",
      }}
    >
      {/* Back to syllabus */}
      <button
        onClick={() => router.push("/curriculum")}
        className="flex items-center gap-1 px-4 py-4 text-xs cursor-pointer transition-opacity"
        style={{ color: "var(--muted-foreground)" }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        <ChevronLeft className="h-3 w-3" />
        Back to syllabus
      </button>

      {/* Introduction link */}
      <div className="px-2 pb-1">
        <button
          onClick={() => router.push("/curriculum/intro")}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-left cursor-pointer transition-colors text-[13px]"
          style={{
            backgroundColor: introActive ? "var(--sidebar-accent)" : "transparent",
            color: introActive ? "var(--foreground)" : "var(--muted-foreground)",
            fontWeight: introActive ? 500 : 400,
          }}
          onMouseEnter={(e) => {
            if (!introActive)
              e.currentTarget.style.backgroundColor = "var(--sidebar-accent)";
          }}
          onMouseLeave={(e) => {
            if (!introActive)
              e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-[10px]">
            ◆
          </span>
          <span className="truncate">Introduction</span>
        </button>
      </div>

      {/* Week selector */}
      <div className="px-4 pb-5 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setViewingWeekIdx((i) => Math.max(0, i - 1))}
            disabled={viewingWeekIdx === 0}
            className="p-0.5 rounded cursor-pointer transition-opacity disabled:opacity-20 disabled:cursor-default"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <h3
            className="text-sm font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            Week {viewingWeek.weekNum} — {viewingWeek.title}
          </h3>
          <button
            onClick={() =>
              setViewingWeekIdx((i) =>
                Math.min(COURSE_WEEKS.length - 1, i + 1)
              )
            }
            disabled={viewingWeekIdx === COURSE_WEEKS.length - 1}
            className="p-0.5 rounded cursor-pointer transition-opacity disabled:opacity-20 disabled:cursor-default"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--border)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress.percent}%`,
              backgroundColor: "#10b981",
            }}
          />
        </div>
        <p
          className="text-xs mt-1"
          style={{ color: "var(--muted-foreground)" }}
        >
          {progress.completed}/{progress.total} completed
        </p>
      </div>

      {/* Topics for the viewed week */}
      <div className="flex-1 px-2 pb-2">
        {viewingWeek.topics.map((topic, idx) => {
          const isActive =
            !standaloneSlug &&
            viewingWeek.slug === currentWeekSlug &&
            topic.slug === currentTopicSlug;
          const status = getTopicStatus(viewingWeek.weekNum, topic.topicNum);

          return (
            <button
              key={topic.slug}
              onClick={() =>
                router.push(`/curriculum/${viewingWeek.slug}/${topic.slug}`)
              }
              className="w-full flex items-center gap-2 px-2 py-2.5 rounded-md text-left cursor-pointer transition-colors text-[13px]"
              style={{
                backgroundColor: isActive
                  ? "var(--sidebar-accent)"
                  : "transparent",
                color: isActive
                  ? "var(--foreground)"
                  : "var(--muted-foreground)",
                fontWeight: isActive ? 500 : 400,
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  e.currentTarget.style.backgroundColor =
                    "var(--sidebar-accent)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {/* Status indicator */}
              <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                {status === "completed" ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <circle cx="7" cy="7" r="7" fill="#10b981" />
                    <path
                      d="M4 7.5L6 9.5L10 5"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : status === "in_progress" ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <circle
                      cx="7"
                      cy="7"
                      r="6"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                    />
                    <circle cx="7" cy="7" r="3" fill="#f59e0b" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <circle
                      cx="7"
                      cy="7"
                      r="6"
                      stroke="var(--border)"
                      strokeWidth="1.5"
                    />
                  </svg>
                )}
              </span>

              <span className="truncate">
                {idx + 1}. {topic.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Final Remarks link */}
      <div className="px-2 pt-1 pb-4 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => router.push("/curriculum/departing")}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-left cursor-pointer transition-colors text-[13px]"
          style={{
            backgroundColor: departingActive ? "var(--sidebar-accent)" : "transparent",
            color: departingActive ? "var(--foreground)" : "var(--muted-foreground)",
            fontWeight: departingActive ? 500 : 400,
          }}
          onMouseEnter={(e) => {
            if (!departingActive)
              e.currentTarget.style.backgroundColor = "var(--sidebar-accent)";
          }}
          onMouseLeave={(e) => {
            if (!departingActive)
              e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center text-[10px]">
            ◆
          </span>
          <span className="truncate">Final Remarks</span>
        </button>
      </div>
    </div>
  );
}
