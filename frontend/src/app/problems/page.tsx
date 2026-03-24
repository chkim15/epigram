"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import ProblemViewer from "@/components/problems/ProblemViewer";
import ChatSidebar from "@/components/ai/ChatSidebar";
import HandoutsViewer from "@/components/handouts/HandoutsViewer";
import ResizablePanels from "@/components/ui/resizable-panels";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

const DEFAULT_QUANT_TOPIC_ID = 54;

function ProblemsPageContent() {
  const { user, isAuthenticated, isLoading, showCheckoutSuccess, setShowCheckoutSuccess } = useAuthGuard();
  const searchParams = useSearchParams();
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(DEFAULT_QUANT_TOPIC_ID);
  const [contentMode, setContentMode] = useState<'problems' | 'handouts'>('problems');

  // Parse URL parameters for topic filtering
  useEffect(() => {
    const topics = searchParams.get('topics');
    if (topics) {
      const topicIds = topics.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      if (topicIds.length === 1) {
        setSelectedTopicId(topicIds[0]);
      }
    }
  }, [searchParams]);

  // Check if selected topic is a Quick References topic
  useEffect(() => {
    if (!selectedTopicId) return;

    const checkTopicType = async () => {
      try {
        const { data: topic } = await supabase
          .from('topics')
          .select('main_topics')
          .eq('id', selectedTopicId)
          .single();

        if (topic?.main_topics === 'Quick References') {
          setContentMode('handouts');
        } else {
          setContentMode('problems');
        }
      } catch (err) {
        console.error('Error checking topic type:', err);
      }
    };

    checkTopicType();
  }, [selectedTopicId]);

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
      {selectedTopicId ? (
        <ResizablePanels
          leftPanel={
            contentMode === 'handouts' ? (
              <HandoutsViewer selectedTopicId={selectedTopicId} />
            ) : (
              <ProblemViewer
                selectedTopicId={selectedTopicId}
                selectedTopicIds={[]}
                selectedDifficulties={[]}
                viewMode="problems"
                problemCount={10}
                savedProblemIds={[]}
              />
            )
          }
          rightPanel={
            <ChatSidebar
              mode={contentMode}
              currentTopicId={contentMode === 'handouts' ? selectedTopicId : null}
            />
          }
          defaultLeftWidth={contentMode === 'handouts' ? 60 : 50}
          minLeftWidth={25}
          maxLeftWidth={75}
          className="flex-1"
          storageKey={contentMode === 'handouts' ? 'handouts-panels-width' : 'main-panels-width'}
        />
      ) : (
        <ProblemViewer
          selectedTopicId={null}
          selectedTopicIds={[]}
          selectedDifficulties={[]}
          viewMode="problems"
          problemCount={10}
          savedProblemIds={[]}
        />
      )}
    </AppShell>
  );
}

export default function ProblemsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: '#3d3929', borderTopColor: 'transparent' }} />
        </div>
      </div>
    }>
      <ProblemsPageContent />
    </Suspense>
  );
}
