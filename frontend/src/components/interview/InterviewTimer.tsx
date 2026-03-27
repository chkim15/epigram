"use client";

import { Clock } from "lucide-react";

interface InterviewTimerProps {
  formattedTime: string;
  isOvertime: boolean;
}

export default function InterviewTimer({ formattedTime, isOvertime }: InterviewTimerProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold"
      style={{
        backgroundColor: isOvertime ? "rgba(161, 98, 7, 0.1)" : "var(--secondary)",
        color: isOvertime ? "#a16207" : "var(--foreground)",
      }}
    >
      <Clock className="h-4 w-4" />
      <span>{formattedTime}</span>
    </div>
  );
}
