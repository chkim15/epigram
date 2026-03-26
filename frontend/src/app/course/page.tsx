"use client";

import UnifiedHeader from "@/components/layout/UnifiedHeader";
import SyllabusView from "@/components/course/SyllabusView";

export default function CoursePage() {
  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: "var(--background)" }}>
      <UnifiedHeader />
      <SyllabusView />
    </div>
  );
}
