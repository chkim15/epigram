"use client";

import { useEffect, useRef, useState } from "react";
import { useCourseProgress } from "@/hooks/useCourseProgress";

interface TopicCompleteButtonProps {
  weekNum: number;
  topicNum: number;
}

export default function TopicCompleteButton({
  weekNum,
  topicNum,
}: TopicCompleteButtonProps) {
  const { loading, getTopicStatus, markTopicStarted, markTopicComplete } =
    useCourseProgress();
  const [pending, setPending] = useState(false);

  // Keep a stable ref so the effect doesn't re-fire every time the hook
  // recreates markTopicStarted (it depends on topicProgressMap internally)
  const markTopicStartedRef = useRef(markTopicStarted);
  markTopicStartedRef.current = markTopicStarted;

  // Mark in_progress on mount (once per topic)
  useEffect(() => {
    markTopicStartedRef.current(weekNum, topicNum);
  }, [weekNum, topicNum]);

  if (loading) return null;

  const status = getTopicStatus(weekNum, topicNum);
  const isCompleted = status === "completed";

  async function handleClick() {
    if (isCompleted || pending) return;
    setPending(true);
    await markTopicComplete(weekNum, topicNum);
    setPending(false);
  }

  return (
    <div className="mt-12 pb-8 flex justify-center">
      <button
        onClick={handleClick}
        disabled={isCompleted || pending}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        style={
          isCompleted
            ? {
                backgroundColor: "var(--sidebar-accent)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                cursor: "default",
              }
            : {
                backgroundColor: "transparent",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              }
        }
        onMouseEnter={(e) => {
          if (!isCompleted && !pending) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "var(--sidebar-accent)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isCompleted && !pending) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              "transparent";
          }
        }}
      >
        {isCompleted ? (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="8" cy="8" r="7" fill="#16a34a" />
              <path
                d="M5 8l2 2 4-4"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Completed
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="8"
                cy="8"
                r="7"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
            {pending ? "Saving..." : "Mark as Complete"}
          </>
        )}
      </button>
    </div>
  );
}
