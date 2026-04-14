"use client";

import { useRouter } from "next/navigation";
import { COURSE_WEEKS } from "@/data/course/course-structure";
import { useCourseProgress } from "@/hooks/useCourseProgress";

export default function SyllabusView() {
  const router = useRouter();
  const { getTopicStatus, getWeekProgress } = useCourseProgress();

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "var(--foreground)" }}
        >
          4-Week Intensive Quant Interview Prep
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: "var(--muted-foreground)" }}
        >
          Probability, Stochastic Processes, Statistics, and Brain Teasers
        </p>

        <div className="space-y-6">
          {/* Introduction card */}
          <div
            className="rounded-xl border p-5 cursor-pointer"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--background)",
            }}
            onClick={() => router.push("/curriculum/intro")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--sidebar-background)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--background)")
            }
          >
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: "var(--foreground)",
                  color: "var(--background)",
                }}
              >
                Intro
              </span>
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                The Four-Week Intensive
              </h2>
            </div>
            <p
              className="text-sm mt-2"
              style={{ color: "var(--muted-foreground)" }}
            >
              Course overview, what to expect, and how to study
            </p>
          </div>

          {/* Week cards */}
          {COURSE_WEEKS.map((week) => {
            const progress = getWeekProgress(week.weekNum);

            return (
              <div
                key={week.slug}
                className="rounded-xl border p-5"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--background)",
                }}
              >
                {/* Week header */}
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: "#a16207",
                      color: "white",
                    }}
                  >
                    Week {week.weekNum}
                  </span>
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: "var(--foreground)" }}
                  >
                    {week.title}
                  </h2>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
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
                    {progress.completed} of {progress.total} topics completed
                  </p>
                </div>

                {/* Topics list */}
                <div className="space-y-1">
                  {week.topics.map((topic, idx) => {
                    const status = getTopicStatus(week.weekNum, topic.topicNum);

                    return (
                      <button
                        key={topic.slug}
                        onClick={() =>
                          router.push(
                            `/curriculum/${week.slug}/${topic.slug}`
                          )
                        }
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left cursor-pointer transition-colors"
                        style={{ color: "var(--foreground)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "var(--sidebar-background)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "transparent")
                        }
                      >
                        {/* Status icon */}
                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                          {status === "completed" ? (
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 18 18"
                              fill="none"
                            >
                              <circle cx="9" cy="9" r="9" fill="#10b981" />
                              <path
                                d="M5 9.5L7.5 12L13 6.5"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : status === "in_progress" ? (
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 18 18"
                              fill="none"
                            >
                              <circle
                                cx="9"
                                cy="9"
                                r="8"
                                stroke="#f59e0b"
                                strokeWidth="2"
                              />
                              <circle cx="9" cy="9" r="4" fill="#f59e0b" />
                            </svg>
                          ) : (
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 18 18"
                              fill="none"
                            >
                              <circle
                                cx="9"
                                cy="9"
                                r="8"
                                stroke="var(--border)"
                                strokeWidth="2"
                              />
                            </svg>
                          )}
                        </span>

                        {/* Topic info */}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">
                            {idx + 1}. {topic.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Final Remarks card */}
          <div
            className="rounded-xl border p-5 cursor-pointer"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--background)",
            }}
            onClick={() => router.push("/curriculum/departing")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--sidebar-background)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--background)")
            }
          >
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: "var(--foreground)",
                  color: "var(--background)",
                }}
              >
                Final
              </span>
              <h2
                className="text-lg font-semibold"
                style={{ color: "var(--foreground)" }}
              >
                Interview Day
              </h2>
            </div>
            <p
              className="text-sm mt-2"
              style={{ color: "var(--muted-foreground)" }}
            >
              Final remarks on mindset, communication, and performance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
