"use client";

import { Suspense, use } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import ProblemViewer from "@/components/problems/ProblemViewer";
import ChatSidebar from "@/components/ai/ChatSidebar";
import ResizablePanels from "@/components/ui/resizable-panels";
import { Loader2, ArrowLeft } from "lucide-react";

function ProblemDetailContent({ slug }: { slug: string }) {
  const { isAuthenticated, isLoading, showCheckoutSuccess, setShowCheckoutSuccess } = useAuthGuard();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fromMockInterview = searchParams.get("from") === "mock-interview";

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#a16207' }} />
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
      <div className="flex-1 flex flex-col min-h-0">
        {fromMockInterview && (
          <div className="px-4 pt-3 pb-1">
            <button
              onClick={() => router.push("/mock-interview?phase=review")}
              className="flex items-center gap-1.5 text-sm cursor-pointer transition-opacity hover:opacity-70"
              style={{ color: "var(--muted-foreground)" }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Reports
            </button>
          </div>
        )}
        <ResizablePanels
          leftPanel={
            <ProblemViewer
              problemSlug={slug}
              selectedTopicId={null}
              selectedTopicIds={[]}
              selectedDifficulties={[]}
              viewMode="problems"
              problemCount={10}
              savedProblemIds={[]}
            />
          }
          rightPanel={<ChatSidebar mode="problems" currentTopicId={null} />}
          defaultLeftWidth={50}
          minLeftWidth={25}
          maxLeftWidth={75}
          className="flex-1"
          storageKey="problem-detail-panels-width"
        />
      </div>
    </AppShell>
  );
}

export default function ProblemDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);

  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#a16207' }} />
      </div>
    }>
      <ProblemDetailContent slug={resolvedParams.slug} />
    </Suspense>
  );
}
