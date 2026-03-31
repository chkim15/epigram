"use client";

import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import ProGate from "@/components/subscription/ProGate";

interface InterviewLandingProps {
  onStart: () => void;
  onViewHistory: () => void;
}

export default function InterviewLanding({ onStart, onViewHistory }: InterviewLandingProps) {
  return (
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
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--foreground)", opacity: 0.7 }}
          >
            Simulate a real quant interview: 3 problems, 30 minutes.
          </p>
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

        <ProGate feature="mock_exam">
          <Button
            onClick={onStart}
            className="w-full py-6 text-base font-semibold rounded-xl cursor-pointer"
            style={{ backgroundColor: "#141310", color: "#ffffff" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Start Interview
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </ProGate>
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
  );
}
