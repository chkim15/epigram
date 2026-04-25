"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Clock, FileText, ChevronRight, Check, X, Minus } from "lucide-react";
import { MathContent } from "@/lib/utils/katex";
import { slugify } from "@/lib/utils/slugify";
import { Problem, MockInterviewSession } from "@/types/database";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";

interface InterviewResultsProps {
  problems?: Problem[];
  answers?: string[];
  elapsedSeconds?: number;
  overtimeSeconds?: number;
  onStartNew: () => void;
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m === 0) return `${s} seconds`;
  if (s === 0) return `${m} minute${m !== 1 ? "s" : ""}`;
  return `${m} minute${m !== 1 ? "s" : ""} ${s} seconds`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? "s" : ""} ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs !== 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

const difficultyColors: Record<string, { bg: string; text: string }> = {
  easy: { bg: "rgba(34, 197, 94, 0.15)", text: "#16a34a" },
  medium: { bg: "rgba(234, 179, 8, 0.15)", text: "#a16207" },
  hard: { bg: "rgba(239, 68, 68, 0.15)", text: "#dc2626" },
  very_hard: { bg: "rgba(239, 68, 68, 0.15)", text: "#dc2626" },
};

interface SessionDetail {
  session: MockInterviewSession;
  problems: Problem[];
}

export default function InterviewResults({
  problems: currentProblems,
  answers: currentAnswers,
  elapsedSeconds,
  overtimeSeconds,
  onStartNew,
}: InterviewResultsProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [sessions, setSessions] = useState<MockInterviewSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  type CorrectnessStatus = true | false | 'grading' | null;
  const [correctnessMap, setCorrectnessMap] = useState<Record<string, CorrectnessStatus>>({});
  const [answersMap, setAnswersMap] = useState<Record<string, string>>({});
  const [subAnswersMap, setSubAnswersMap] = useState<Record<string, Record<string, string>>>({}); // problem_id -> { key: answer_text }
  const [isGradingInProgress, setIsGradingInProgress] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Map of sessionId -> number of problems answered
  const [answeredCounts, setAnsweredCounts] = useState<Record<string, number>>({});
  const hasCurrentSession = !!(currentProblems && currentAnswers && elapsedSeconds !== undefined);
  const [isSaving, setIsSaving] = useState(hasCurrentSession);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const hasSaved = useRef(false);

  const fetchCorrectness = async (problemIds: string[], isCurrentSession = true) => {
    if (!user) return false;
    const { data } = await supabase
      .from("user_answers")
      .select("problem_id, subproblem_id, is_correct, answer_text")
      .eq("user_id", user.id)
      .in("problem_id", problemIds)
      .order("created_at", { ascending: false });

    const map: Record<string, true | false | 'grading' | null> = {};
    const aMap: Record<string, string> = {};
    const subMap: Record<string, Record<string, string>> = {};
    const hasAnswerPending = new Set<string>();

    for (const pid of problemIds) map[pid] = null;

    if (data) {
      // Collect subproblem UUIDs that have answers so we can look up their keys
      const subproblemIds = [...new Set(
        data.filter(r => r.subproblem_id && r.answer_text).map(r => r.subproblem_id as string)
      )];

      // Fetch subproblem keys (a, b, c...) for those UUIDs
      const subKeyMap: Record<string, string> = {};
      if (subproblemIds.length > 0) {
        const { data: subData } = await supabase
          .from("subproblems")
          .select("id, key")
          .in("id", subproblemIds);
        if (subData) {
          for (const s of subData) subKeyMap[s.id] = s.key;
        }
      }

      for (const row of data) {
        if (!row.subproblem_id && row.answer_text && aMap[row.problem_id] === undefined) {
          aMap[row.problem_id] = row.answer_text;
        }
        if (row.subproblem_id && row.answer_text) {
          const key = subKeyMap[row.subproblem_id] ?? row.subproblem_id;
          if (!subMap[row.problem_id]) subMap[row.problem_id] = {};
          if (subMap[row.problem_id][key] === undefined) {
            subMap[row.problem_id][key] = row.answer_text;
          }
        }
        if (row.is_correct === null) {
          hasAnswerPending.add(row.problem_id);
        } else if (row.is_correct === true) {
          map[row.problem_id] = true;
        } else if (row.is_correct === false && map[row.problem_id] !== true) {
          map[row.problem_id] = false;
        }
      }
      if (isCurrentSession) {
        for (const pid of hasAnswerPending) {
          if (map[pid] === null) map[pid] = 'grading';
        }
      }
    }

    setCorrectnessMap(map);
    setAnswersMap(aMap);
    setSubAnswersMap(subMap);
    const gradingInProgress = isCurrentSession && Object.values(map).some(v => v === 'grading');
    setIsGradingInProgress(gradingInProgress);
    return gradingInProgress;
  };

  // Auto-save the just-completed interview and load past sessions
  useEffect(() => {
    if (hasSaved.current) return;
    hasSaved.current = true;

    async function saveAndLoad() {
      if (!user) return;

      let savedId: string | null = null;

      // Only save if we have current session data
      if (hasCurrentSession && currentProblems && currentAnswers) {
        const completedAt = new Date();
        const startedAt = new Date(completedAt.getTime() - (elapsedSeconds ?? 0) * 1000);
        const { data: saved, error: saveError } = await supabase
          .from("mock_interview_sessions")
          .insert({
            user_id: user.id,
            status: "completed" as const,
            problem_ids: currentProblems.map((p) => p.id),
            user_answers: currentAnswers,
            time_limit_seconds: 1800,
            overtime_seconds: overtimeSeconds ?? 0,
            started_at: startedAt.toISOString(),
            completed_at: completedAt.toISOString(),
          })
          .select("id")
          .single();

        if (saveError) {
          console.error("Failed to save interview:", saveError);
        }

        savedId = saved?.id || null;
        setCurrentSessionId(savedId);
      }

      setIsSaving(false);

      // Load all past sessions
      const { data: allSessions } = await supabase
        .from("mock_interview_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(20);

      if (allSessions) {
        setSessions(allSessions as MockInterviewSession[]);

        // Compute answered counts per session from user_answers table
        const allProblemIds = [...new Set(allSessions.flatMap((s) => s.problem_ids))];
        if (allProblemIds.length > 0) {
          const { data: answerData } = await supabase
            .from("user_answers")
            .select("problem_id")
            .eq("user_id", user.id)
            .in("problem_id", allProblemIds);

          if (answerData) {
            const answeredProblemIds = new Set(answerData.map((a) => a.problem_id));
            const counts: Record<string, number> = {};
            for (const s of allSessions) {
              counts[s.id] = s.problem_ids.filter((pid: string) => answeredProblemIds.has(pid)).length;
            }
            setAnsweredCounts(counts);
          }
        }

        if (savedId) {
          // Auto-select the just-completed interview
          const current = allSessions.find((s) => s.id === savedId) as MockInterviewSession | undefined;
          if (current && currentProblems) {
            setSelectedSession({
              session: current,
              problems: currentProblems,
            });
            const stillGrading = await fetchCorrectness(current.problem_ids, true);
            if (stillGrading) {
              let polls = 0;
              pollingRef.current = setInterval(async () => {
                polls++;
                const still = await fetchCorrectness(current.problem_ids, true);
                if (!still || polls >= 10) {
                  if (polls >= 10) setIsGradingInProgress(false);
                  clearInterval(pollingRef.current!);
                  pollingRef.current = null;
                }
              }, 3000);
            }
          }
        } else if (allSessions.length > 0) {
          // Reports-only mode: auto-select the most recent session
          const mostRecent = allSessions[0] as MockInterviewSession;
          const { data: problemData } = await supabase
            .from("problems")
            .select("*")
            .in("id", mostRecent.problem_ids);

          if (problemData) {
            const ordered = mostRecent.problem_ids
              .map((id) => problemData.find((p) => p.id === id))
              .filter(Boolean) as Problem[];
            setSelectedSession({ session: mostRecent, problems: ordered });
            fetchCorrectness(mostRecent.problem_ids, false);
          }
        }
      }
    }

    saveAndLoad();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const handleSelectSession = async (session: MockInterviewSession) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    const isCurrentSession = session.id === currentSessionId;

    // If selecting the current session, use local problems
    if (isCurrentSession && currentProblems) {
      setSelectedSession({ session, problems: currentProblems });
      fetchCorrectness(session.problem_ids, true);
      return;
    }

    // Fetch problems for past session
    const { data: problemData } = await supabase
      .from("problems")
      .select("*")
      .in("id", session.problem_ids);

    if (problemData) {
      // Sort to match problem_ids order
      const ordered = session.problem_ids
        .map((id) => problemData.find((p) => p.id === id))
        .filter(Boolean) as Problem[];
      setSelectedSession({ session, problems: ordered });
      fetchCorrectness(session.problem_ids, false);
    }
  };

  if (isSaving) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent mx-auto mb-4"
            style={{ borderColor: "#a16207", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "var(--foreground)", opacity: 0.6 }}>
            Saving results...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col min-h-0"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "var(--foreground)" }}
        >
          Reports
        </h1>
        <div className="flex items-center gap-12">
          <p
            className="text-sm"
            style={{ color: "var(--foreground)", opacity: 0.6 }}
          >
            View detailed stats of your previous mock interviews
          </p>
          <Button
            onClick={onStartNew}
            className="rounded-xl cursor-pointer shrink-0"
            style={{ backgroundColor: "#141310", color: "#ffffff" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Start New Interview
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex-1 flex min-h-0 px-6 pb-6 gap-6">
        {/* Left panel - Past sessions list */}
        <div
          className="w-[340px] shrink-0 rounded-xl border flex flex-col"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="px-4 py-3 border-b"
            style={{ borderColor: "var(--border)" }}
          >
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--foreground)" }}
            >
              Past Mock Interviews
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {sessions.map((session, idx) => {
              const isSelected = selectedSession?.session.id === session.id;
              const isCurrent = session.id === currentSessionId;
              const sessionNumber = sessions.length - idx;
              return (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className="w-full px-4 py-3 text-left cursor-pointer border-b transition-colors"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: isSelected ? "var(--secondary)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "var(--secondary)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div
                        className="text-sm font-medium"
                        style={{ color: "var(--foreground)" }}
                      >
                        Mock Interview {sessionNumber}
                        {isCurrent && (
                          <span
                            className="ml-2 text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: "rgba(34, 197, 94, 0.15)", color: "#16a34a" }}
                          >
                            New
                          </span>
                        )}
                      </div>
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: "var(--foreground)", opacity: 0.5 }}
                      >
                        {answeredCounts[session.id] ?? 0} of 3 answered
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-xs"
                        style={{ color: "var(--foreground)", opacity: 0.5 }}
                      >
                        {timeAgo(session.created_at)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
            {sessions.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p
                  className="text-sm"
                  style={{ color: "var(--foreground)", opacity: 0.5 }}
                >
                  No past interviews yet
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Selected session detail */}
        <div className="flex-1 rounded-xl border overflow-y-auto custom-scrollbar" style={{ borderColor: "var(--border)" }}>
          {selectedSession ? (
            <div className="p-6 flex flex-col gap-5">
              {/* Session header */}
              <div>
                <h2
                  className="text-xl font-bold mb-1"
                  style={{ color: "var(--foreground)" }}
                >
                  Mock Interview {(() => {
                    const idx = sessions.findIndex((s) => s.id === selectedSession.session.id);
                    return idx >= 0 ? sessions.length - idx : "";
                  })()}
                </h2>
                <p
                  className="text-sm"
                  style={{ color: "var(--foreground)", opacity: 0.5 }}
                >
                  Completed &middot; {formatDate(selectedSession.session.created_at)}
                </p>
              </div>

              {/* Time info */}
              <div className="flex flex-col gap-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" style={{ color: "var(--foreground)", opacity: 0.5 }} />
                  <span style={{ color: "var(--foreground)" }}>
                    Time Spent:{" "}
                    {selectedSession.session.id === currentSessionId && elapsedSeconds !== undefined
                      ? formatDuration(elapsedSeconds)
                      : (() => {
                          const s = selectedSession.session;
                          if (s.started_at && s.completed_at) {
                            const diff = Math.max(0, Math.floor(
                              (new Date(s.completed_at).getTime() - new Date(s.started_at).getTime()) / 1000
                            ));
                            return formatDuration(diff);
                          }
                          return "Unknown";
                        })()}
                  </span>
                  {selectedSession.session.overtime_seconds > 0 && (
                    <span style={{ color: "#a16207" }}>
                      (+{formatDuration(selectedSession.session.overtime_seconds)} overtime)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" style={{ color: "var(--foreground)", opacity: 0.5 }} />
                  <span style={{ color: "var(--foreground)" }}>
                    Time Allotted: 30 minutes
                  </span>
                </div>
              </div>

              {/* Grading banner */}
              {isGradingInProgress && selectedSession?.session.id === currentSessionId && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                  style={{ backgroundColor: 'rgba(161,98,7,0.08)', color: '#a16207' }}>
                  <div className="h-3 w-3 rounded-full border-2 animate-spin shrink-0"
                    style={{ borderColor: '#a16207', borderTopColor: 'transparent' }} />
                  Grading in progress — results will appear shortly
                </div>
              )}

              {/* Problem cards */}
              <div className="flex flex-col gap-3 mt-2">
                {selectedSession.problems.map((problem, i) => {
                  const difficulty = problem.difficulty || "medium";
                  const colors = difficultyColors[difficulty] || difficultyColors.medium;
                  const problemSlug = problem.problem_name
                    ? slugify(problem.problem_name)
                    : problem.id;

                  return (
                    <button
                      key={problem.id}
                      onClick={() => router.push(`/problems/${problemSlug}?from=mock-interview`)}
                      className="flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left cursor-pointer transition-colors w-full"
                      style={{ borderColor: "var(--border)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--secondary)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <FileText
                        className="h-5 w-5 mt-0.5 shrink-0"
                        style={{ color: "var(--foreground)", opacity: 0.4 }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-sm font-medium"
                            style={{ color: "var(--foreground)" }}
                          >
                            {problem.problem_name ? (
                              <MathContent content={problem.problem_name} />
                            ) : (
                              `Problem ${i + 1}`
                            )}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded-md text-xs font-semibold uppercase shrink-0"
                            style={{ backgroundColor: colors.bg, color: colors.text }}
                          >
                            {difficulty.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm mt-0.5">
                          {correctnessMap[problem.id] === true ? (
                            <>
                              <Check className="h-4 w-4" style={{ color: "#16a34a" }} />
                              <span style={{ color: "#16a34a" }}>Correct</span>
                            </>
                          ) : correctnessMap[problem.id] === false ? (
                            <>
                              <X className="h-4 w-4" style={{ color: "#dc2626" }} />
                              <span style={{ color: "#dc2626" }}>Incorrect</span>
                            </>
                          ) : correctnessMap[problem.id] === 'grading' ? (
                            <>
                              <div className="h-3.5 w-3.5 rounded-full border-2 animate-spin shrink-0"
                                style={{ borderColor: '#a16207', borderTopColor: 'transparent' }} />
                              <span style={{ color: '#a16207' }}>Grading...</span>
                            </>
                          ) : (
                            <>
                              <Minus className="h-4 w-4" style={{ color: "var(--foreground)", opacity: 0.4 }} />
                              <span style={{ color: "var(--foreground)", opacity: 0.5 }}>Not answered</span>
                            </>
                          )}
                        </div>
                        {answersMap[problem.id] ? (
                          <div className="mt-2 text-xs" style={{ color: 'var(--foreground)' }}>
                            <span className="font-medium" style={{ opacity: 0.6 }}>Your answer: </span>
                            <MathContent content={answersMap[problem.id]} />
                          </div>
                        ) : subAnswersMap[problem.id] && Object.keys(subAnswersMap[problem.id]).length > 0 ? (
                          <div className="mt-2 text-xs flex flex-col gap-0.5" style={{ color: 'var(--foreground)' }}>
                            {Object.entries(subAnswersMap[problem.id])
                              .sort(([a], [b]) => a.localeCompare(b))
                              .map(([key, answer]) => (
                                <div key={key}>
                                  <span className="font-medium" style={{ opacity: 0.6 }}>({key}): </span>
                                  <MathContent content={answer} />
                                </div>
                              ))}
                          </div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>
          ) : (
            <div
              className="flex-1 flex items-center justify-center h-full min-h-[300px]"
            >
              <p
                className="text-sm"
                style={{ color: "var(--foreground)", opacity: 0.5 }}
              >
                Select an interview to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
