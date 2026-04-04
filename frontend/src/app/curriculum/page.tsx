"use client";

import { Suspense } from "react";
import UnifiedHeader from "@/components/layout/UnifiedHeader";
import SyllabusView from "@/components/course/SyllabusView";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Loader2 } from "lucide-react";

function CurriculumContent() {
  const { isLoading } = useAuthGuard();

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#a16207" }} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "var(--background)" }}>
      <UnifiedHeader />
      <SyllabusView />
    </div>
  );
}

export default function CoursePage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: "var(--background)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "#a16207" }} />
      </div>
    }>
      <CurriculumContent />
    </Suspense>
  );
}
