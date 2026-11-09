"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2 } from "lucide-react";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import SubscribeModal from "@/components/subscription/SubscribeModal";

interface InterviewLandingProps {
  onStart: () => void;
  onViewHistory: () => void;
}

export default function InterviewLanding({ onStart, onViewHistory }: InterviewLandingProps) {
  // Until the plan has loaded, isPro is false even for Premium users: wait rather than show Subscribe.
  const { isPro, isLoading: isPlanLoading } = useSubscriptionStore();
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  return (
    <>
    <SubscribeModal
      isOpen={showSubscribeModal}
      onClose={() => setShowSubscribeModal(false)}
      message="Mock interviews are a premium feature. Subscribe to simulate real quant interviews."
    />
    <div
      className="flex-1 flex flex-col items-center justify-center p-8"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="max-w-lg w-full flex flex-col items-center text-center gap-6">
        <div>
          <h1
            className="text-3xl font-bold mb-3"
            style={{ color: "var(--foreground)" }}
          >
            Mock Interview
          </h1>
          <div
            className="flex flex-col gap-3 text-sm leading-relaxed"
            style={{ color: "var(--foreground)", opacity: 0.7 }}
          >
            <p>
              Solving a problem at your desk is not the same as solving it with the clock running and someone
              waiting for your answer. Real quant interviews give you a few hard problems and little time, and the
              pressure is where most candidates slip: they freeze, rush the algebra or run out of time.
            </p>
            <p>
              A mock interview recreates those conditions: 3 problems, 30 minutes, no pausing. When you finish you
              see the full solutions, check your answers, and keep every session in your interview history, so you
              can see where you lose time and how you improve.
            </p>
          </div>
        </div>

        <div
          className="w-full rounded-xl border p-5 text-left"
          style={{
            backgroundColor: "var(--secondary)",
            borderColor: "var(--border)",
          }}
        >
          <ul className="flex flex-col gap-2.5 text-sm list-disc pl-5">
            <li style={{ color: "var(--foreground)" }}>
              Each session will include up to 3 questions.
            </li>
            <li style={{ color: "var(--foreground)" }}>
              You will have 30 minutes to complete all questions.
            </li>
            <li style={{ color: "var(--foreground)" }}>
              Once a mock interview session begins, you <strong>cannot</strong> pause the timer.
            </li>
          </ul>
        </div>

        <Button
          onClick={() => isPro ? onStart() : setShowSubscribeModal(true)}
          disabled={isPlanLoading}
          aria-busy={isPlanLoading}
          className="w-full py-6 text-base font-semibold rounded-xl cursor-pointer disabled:cursor-wait disabled:opacity-60"
          style={{ backgroundColor: "#141310", color: "#ffffff" }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {isPlanLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Checking your plan…
            </>
          ) : (
            <>
              Start Interview
              <ChevronRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
        <button
          onClick={onViewHistory}
          className="text-sm cursor-pointer"
          style={{ color: "var(--foreground)", opacity: 0.5 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
        >
          View Interview History
        </button>
      </div>
    </div>
    </>
  );
}
