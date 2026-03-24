"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import ProblemViewer from "@/components/problems/ProblemViewer";
import ChatSidebar from "@/components/ai/ChatSidebar";
import CreatePractice from "@/components/practice/CreatePractice";
import RecommendedPractice from "@/components/practice/RecommendedPractice";
import ResizablePanels from "@/components/ui/resizable-panels";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Loader2 } from "lucide-react";

type PracticePhase = 'create' | 'recommended' | 'active' | 'recommended-problems';

function PracticePageContent() {
  const { user, isAuthenticated, isLoading, showCheckoutSuccess, setShowCheckoutSuccess } = useAuthGuard();
  const searchParams = useSearchParams();
  const [practicePhase, setPracticePhase] = useState<PracticePhase>('create');
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [problemCount, setProblemCount] = useState<number>(10);
  const [savedProblemIds, setSavedProblemIds] = useState<string[]>([]);
  const [recommendedProblemIds, setRecommendedProblemIds] = useState<string[]>([]);
  const [recommendationData, setRecommendationData] = useState<{
    recommendations: Array<{
      id: string;
      problem_text: string;
      difficulty: string;
      similarity: number;
      document_id: string;
      has_subproblems: boolean;
      subproblems?: Array<{
        id: string;
        key: string;
        problem_text: string;
        solution_text: string | null;
      }>;
    }>;
    identifiedTopics: Array<{
      id: number;
      main_topics: string;
      subtopics: string;
      course: string;
    }>;
    file: File | null;
    uploadStatus: 'idle' | 'complete';
  }>({
    recommendations: [],
    identifiedTopics: [],
    file: null,
    uploadStatus: 'idle',
  });

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

  const handleRecommendedStartPractice = (problemIds: string[]) => {
    setRecommendedProblemIds(problemIds);
    setSelectedTopicIds([]);
    setSelectedDifficulties([]);
    setSavedProblemIds([]);
    setPracticePhase('recommended-problems');
  };

  const handleBackToSetup = () => {
    setPracticePhase('create');
  };

  const handleBackToRecommended = () => {
    setPracticePhase('recommended');
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
          {/* Sub-navigation for Create vs Recommended */}
          <div className="flex items-center gap-2 px-6 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => setPracticePhase('create')}
              className="px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}
            >
              Create Practice
            </button>
            <button
              onClick={() => setPracticePhase('recommended')}
              className="px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Recommended Practice
            </button>
          </div>
          <CreatePractice onStartPractice={handleStartPractice} />
        </div>
      )}

      {practicePhase === 'recommended' && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Sub-navigation for Create vs Recommended */}
          <div className="flex items-center gap-2 px-6 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => setPracticePhase('create')}
              className="px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-colors"
              style={{ color: 'var(--muted-foreground)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Create Practice
            </button>
            <button
              onClick={() => setPracticePhase('recommended')}
              className="px-3 py-1.5 text-sm font-medium rounded-lg cursor-pointer transition-colors"
              style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}
            >
              Recommended Practice
            </button>
          </div>
          <RecommendedPractice
            onStartPractice={handleRecommendedStartPractice}
            userId={user?.id}
            initialRecommendations={recommendationData.recommendations}
            initialTopics={recommendationData.identifiedTopics}
            initialFile={recommendationData.file}
            initialStatus={recommendationData.uploadStatus}
            onRecommendationsChange={setRecommendationData}
          />
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

      {practicePhase === 'recommended-problems' && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <Button
              onClick={handleBackToRecommended}
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
                selectedTopicIds={[]}
                selectedDifficulties={[]}
                viewMode="recommended-problems"
                problemCount={10}
                savedProblemIds={[]}
                recommendedProblemIds={recommendedProblemIds}
              />
            }
            rightPanel={<ChatSidebar mode="problems" currentTopicId={null} />}
            defaultLeftWidth={50}
            minLeftWidth={25}
            maxLeftWidth={75}
            className="flex-1"
            storageKey="recommended-panels-width"
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
