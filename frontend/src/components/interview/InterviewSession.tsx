"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Problem, Subproblem } from "@/types/database";
import { useInterviewTimer } from "@/hooks/useInterviewTimer";
import { useAuthStore } from "@/stores/authStore";
import InterviewTimer from "./InterviewTimer";
import InterviewProblemDisplay from "./InterviewProblemDisplay";

interface InterviewSessionProps {
  onComplete: (
    problems: Problem[],
    answers: string[],
    elapsedSeconds: number,
    overtimeSeconds: number
  ) => void;
  onAbandon: () => void;
}

export default function InterviewSession({
  onComplete,
  onAbandon,
}: InterviewSessionProps) {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [subproblemsByProblem, setSubproblemsByProblem] = useState<Record<string, Subproblem[]>>({});
  // Track answers per problem: { problemId: { "main": "...", "sub_a": "...", ... } }
  const allAnswersRef = useRef<Record<string, { [key: string]: string }>>({});
  const { user } = useAuthStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showOvertimeWarning, setShowOvertimeWarning] = useState(false);

  const timer = useInterviewTimer(1800);

  // Show overtime warning once
  useEffect(() => {
    if (timer.isOvertime && !showOvertimeWarning) {
      setShowOvertimeWarning(true);
    }
  }, [timer.isOvertime, showOvertimeWarning]);

  const fetchProblems = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all problem IDs linked to quant topics
      const { data: quantLinks, error: quantError } = await supabase
        .from("problem_quant_topics")
        .select("problem_id");

      if (quantError) throw quantError;

      const eligibleIds = [
        ...new Set(quantLinks?.map((l) => l.problem_id) || []),
      ];

      if (eligibleIds.length === 0) {
        throw new Error("No problems available");
      }

      const fetchRandom = async (difficulties: string[]): Promise<Problem> => {
        const { data, error: fetchError } = await supabase
          .from("problems")
          .select("*")
          .in("id", eligibleIds)
          .in("difficulty", difficulties)
          .eq("included", true);

        if (fetchError) throw fetchError;
        if (!data || data.length === 0) {
          throw new Error(
            `No ${difficulties.join("/")} problems available`
          );
        }

        return data[Math.floor(Math.random() * data.length)];
      };

      const [easy, medium, hard] = await Promise.all([
        fetchRandom(["easy"]),
        fetchRandom(["medium"]),
        fetchRandom(["hard", "very_hard"]),
      ]);

      const selectedProblems = [easy, medium, hard];
      setProblems(selectedProblems);

      // Fetch subproblems for all selected problems
      const { data: subData } = await supabase
        .from("subproblems")
        .select("*")
        .in("problem_id", selectedProblems.map((p) => p.id))
        .order("key");

      if (subData) {
        const grouped: Record<string, Subproblem[]> = {};
        for (const sp of subData) {
          if (!grouped[sp.problem_id]) grouped[sp.problem_id] = [];
          grouped[sp.problem_id].push(sp as Subproblem);
        }
        setSubproblemsByProblem(grouped);
      }

      timer.start();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load problems"
      );
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const handleAnswersChange = (problemId: string, answers: { [key: string]: string }) => {
    allAnswersRef.current[problemId] = answers;
  };

  const handleEndInterview = async () => {
    timer.pause();
    onComplete(problems, [], timer.elapsedSeconds, timer.overtimeSeconds);
  };

  if (isLoading) {
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
            Selecting problems...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="text-center max-w-md">
          <p className="text-sm mb-4" style={{ color: "#dc2626" }}>
            {error}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={fetchProblems}
              className="rounded-xl cursor-pointer"
              style={{ backgroundColor: "#141310", color: "#ffffff" }}
            >
              Try Again
            </Button>
            <Button
              onClick={onAbandon}
              variant="outline"
              className="rounded-xl cursor-pointer"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex flex-col min-h-0"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Overtime warning banner */}
      {showOvertimeWarning && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: "rgba(161, 98, 7, 0.1)", color: "#a16207" }}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Time is up! You may continue, but overtime is being tracked.</span>
          <button
            onClick={() => setShowOvertimeWarning(false)}
            className="ml-2 underline cursor-pointer text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-4">
          <InterviewTimer
            formattedTime={timer.formattedTime}
            isOvertime={timer.isOvertime}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--foreground)", opacity: 0.7 }}
          >
            Problem {currentIndex + 1} of 3
          </span>
        </div>

        <Button
          onClick={() => setShowEndConfirm(true)}
          className="rounded-xl cursor-pointer text-sm"
          style={{ backgroundColor: "#141310", color: "#ffffff" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          End Interview
        </Button>
      </div>

      {/* Problem content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {problems[currentIndex] && (
          <InterviewProblemDisplay
            key={problems[currentIndex].id}
            problem={problems[currentIndex]}
            subproblems={subproblemsByProblem[problems[currentIndex].id] || []}
            problemIndex={currentIndex}
            isLastProblem={currentIndex === 2}
            onAnswersChange={(answers) => handleAnswersChange(problems[currentIndex].id, answers)}
            onNext={() => setCurrentIndex((prev) => Math.min(prev + 1, 2))}
            onSubmit={() => setShowEndConfirm(true)}
          />
        )}
      </div>

      {/* End confirm dialog */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="rounded-xl border p-6 max-w-sm w-full mx-4"
            style={{ backgroundColor: "var(--background)", borderColor: "var(--border)" }}
          >
            <h3
              className="text-lg font-semibold mb-2"
              style={{ color: "var(--foreground)" }}
            >
              End Interview?
            </h3>
            <p className="text-sm mb-4" style={{ color: "var(--foreground)", opacity: 0.7 }}>
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowEndConfirm(false)}
                variant="outline"
                className="rounded-xl cursor-pointer"
                style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                Continue
              </Button>
              <Button
                onClick={handleEndInterview}
                className="rounded-xl cursor-pointer"
                style={{ backgroundColor: "#141310", color: "#ffffff" }}
              >
                End Interview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
