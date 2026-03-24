"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import ProblemViewer from "@/components/problems/ProblemViewer";
import ChatSidebar from "@/components/ai/ChatSidebar";
import CreatePractice from "@/components/practice/CreatePractice";
import ResizablePanels from "@/components/ui/resizable-panels";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Loader2 } from "lucide-react";

type PracticePhase = 'create' | 'active';

function PracticePageContent() {
  const { user, isAuthenticated, isLoading, showCheckoutSuccess, setShowCheckoutSuccess } = useAuthGuard();
  const searchParams = useSearchParams();
  const [practicePhase, setPracticePhase] = useState<PracticePhase>('create');
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [problemCount, setProblemCount] = useState<number>(10);
  const [savedProblemIds, setSavedProblemIds] = useState<string[]>([]);

  // Parse URL params
  useEffect(() => {
    const topics = searchParams.get('topics');
    const difficulties = searchParams.get('difficulties');

    if (topics) {
      const topicIds = topics.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      setSelectedTopicIds(topicIds);
      setPracticePhase('active');
    }

    if (difficulties) {
      setSelectedDifficulties(difficulties.split(','));
    }
  }, [searchParams]);

  const handleStartPractice = (topicIds: number[], difficulties: string[], _source?: string, count?: number, problemIds?: string[]) => {
    setSavedProblemIds(problemIds || []);
    setSelectedTopicIds(topicIds);
    setSelectedDifficulties(difficulties);
    if (count) setProblemCount(count);
    setPracticePhase('active');
  };

  const handleBackToSetup = () => {
    setPracticePhase('create');
  };

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
      {practicePhase === 'create' && (
        <div className="flex-1 flex flex-col min-h-0">
          <CreatePractice onStartPractice={handleStartPractice} />
        </div>
      )}

      {practicePhase === 'active' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <Button
              onClick={handleBackToSetup}
              size="sm"
              className="h-8 px-2 rounded-xl cursor-pointer flex items-center gap-1 border shadow-none"
              style={{
                backgroundColor: 'var(--background)',
                color: 'var(--foreground)',
                borderColor: 'var(--border)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--background)'}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </div>
          <ResizablePanels
            leftPanel={
              <ProblemViewer
                selectedTopicId={null}
                selectedTopicIds={selectedTopicIds}
                selectedDifficulties={selectedDifficulties}
                viewMode="problems"
                problemCount={problemCount}
                savedProblemIds={savedProblemIds}
              />
            }
            rightPanel={<ChatSidebar mode="problems" currentTopicId={null} />}
            defaultLeftWidth={50}
            minLeftWidth={25}
            maxLeftWidth={75}
            className="flex-1"
            storageKey="practice-panels-width"
          />
        </div>
      )}

    </AppShell>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: '#3d3929', borderTopColor: 'transparent' }} />
        </div>
      </div>
    }>
      <PracticePageContent />
    </Suspense>
  );
}
