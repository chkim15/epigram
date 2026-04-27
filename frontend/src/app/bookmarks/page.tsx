"use client";

import { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import ProblemViewer from "@/components/problems/ProblemViewer";
import ChatSidebar from "@/components/ai/ChatSidebar";
import ResizablePanels from "@/components/ui/resizable-panels";
import { Loader2 } from "lucide-react";

function BookmarksPageContent() {
  const { isAuthenticated, isLoading, showCheckoutSuccess, setShowCheckoutSuccess } = useAuthGuard();

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: '#faf9f5' }}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: '#a16207' }} />
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
      <ResizablePanels
        leftPanel={
          <ProblemViewer
            selectedTopicId={null}
            selectedTopicIds={[]}
            selectedDifficulties={[]}
            viewMode="bookmarks"
            problemCount={10}
          />
        }
        rightPanel={<ChatSidebar mode="problems" currentTopicId={null} />}
        defaultLeftWidth={50}
        minLeftWidth={25}
        maxLeftWidth={75}
        className="flex-1"
        storageKey="bookmarks-panels-width"
      />
    </AppShell>
  );
}

export default function BookmarksPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: '#3d3929', borderTopColor: 'transparent' }} />
        </div>
      </div>
    }>
      <BookmarksPageContent />
    </Suspense>
  );
}
