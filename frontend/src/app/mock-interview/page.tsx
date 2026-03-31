"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Loader2 } from "lucide-react";
import { Problem } from "@/types/database";
import InterviewLanding from "@/components/interview/InterviewLanding";
import InterviewSession from "@/components/interview/InterviewSession";
import InterviewResults from "@/components/interview/InterviewResults";

type InterviewPhase = "landing" | "interview" | "review";

interface ReviewData {
  problems: Problem[];
  answers: string[];
  elapsedSeconds: number;
  overtimeSeconds: number;
}

function MockInterviewPageContent() {
  const { user, isAuthenticated, isLoading, showCheckoutSuccess, setShowCheckoutSuccess } = useAuthGuard();
  const searchParams = useSearchParams();
  const initialPhase = searchParams.get("phase") === "review" ? "review" : "landing";
  const [phase, setPhase] = useState<InterviewPhase>(initialPhase);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);

  const handleStartInterview = () => {
    setPhase("interview");
  };

  const handleInterviewComplete = (
    problems: Problem[],
    answers: string[],
    elapsedSeconds: number,
    overtimeSeconds: number
  ) => {
    setReviewData({ problems, answers, elapsedSeconds, overtimeSeconds });
    setPhase("review");
  };

  const handleAbandon = () => {
    setPhase("landing");
  };

  const handleStartNew = () => {
    setReviewData(null);
    setPhase("landing");
  };

  const handleViewHistory = () => {
    setReviewData(null);
    setPhase("review");
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: "#faf9f5" }}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: "#a16207" }} />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell
      showCheckoutSuccess={showCheckoutSuccess}
      onDismissCheckout={() => setShowCheckoutSuccess(false)}
    >
      {phase === "landing" && (
        <InterviewLanding onStart={handleStartInterview} onViewHistory={handleViewHistory} />
      )}

      {phase === "interview" && (
        <InterviewSession
          onComplete={handleInterviewComplete}
          onAbandon={handleAbandon}
        />
      )}

      {phase === "review" && (
        <InterviewResults
          problems={reviewData?.problems}
          answers={reviewData?.answers}
          elapsedSeconds={reviewData?.elapsedSeconds}
          overtimeSeconds={reviewData?.overtimeSeconds}
          onStartNew={handleStartNew}
        />
      )}
    </AppShell>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "#3d3929", borderTopColor: "transparent" }} />
        </div>
      </div>
    }>
      <MockInterviewPageContent />
    </Suspense>
  );
}
