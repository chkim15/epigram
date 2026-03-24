"use client";

import { Suspense, use } from "react";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import ProblemViewer from "@/components/problems/ProblemViewer";
import ChatSidebar from "@/components/ai/ChatSidebar";
import ResizablePanels from "@/components/ui/resizable-panels";
import { ChevronLeft, Loader2 } from "lucide-react";

function ProblemDetailContent({ id }: { id: string }) {
  const { isAuthenticated, isLoading, showCheckoutSuccess, setShowCheckoutSuccess } = useAuthGuard();

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
        {/* Back link */}
        <div className="px-4 py-2 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <Link
            href="/problems"
            className="inline-flex items-center gap-1 text-sm cursor-pointer transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Problems
          </Link>
        </div>

        <ResizablePanels
          leftPanel={
            <ProblemViewer
              specificProblemId={id}
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

export default function ProblemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);

  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#a16207' }} />
      </div>
    }>
      <ProblemDetailContent id={resolvedParams.id} />
    </Suspense>
  );
}
