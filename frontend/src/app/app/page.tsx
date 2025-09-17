"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopicsSidebar from "@/components/navigation/TopicsSidebar";
import ProblemViewer from "@/components/problems/ProblemViewer";
import ChatSidebar from "@/components/ai/ChatSidebar";
import CreatePractice from "@/components/practice/CreatePractice";
import HandoutsViewer from "@/components/handouts/HandoutsViewer";
import ResizablePanels from "@/components/ui/resizable-panels";
import UnifiedHeader from "@/components/layout/UnifiedHeader";
import AITutorPage, { AITutorPageRef } from "@/components/ai/AITutorPage";
import UserProfileDropdown from "@/components/auth/UserProfileDropdown";
import HistoryView from "@/components/history/HistoryView";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Book, FileText } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function AppPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'problems' | 'create-practice' | 'bookmarks' | 'ai-tutor' | 'history'>('ai-tutor');
  const [contentMode, setContentMode] = useState<'problems' | 'handouts'>('problems');
  const [selectedTopicInfo, setSelectedTopicInfo] = useState<{main_topic: string; subtopic: string} | null>(null);
  const [sidebarMode, setSidebarMode] = useState<'tutor' | 'practice'>('tutor');
  const [practiceViewMode, setPracticeViewMode] = useState<'problems' | 'create-practice' | 'bookmarks'>('problems');
  const aiTutorRef = useRef<AITutorPageRef>(null);
  const [hasAITutorMessages, setHasAITutorMessages] = useState(false);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Check AI tutor message status periodically
  useEffect(() => {
    const checkMessageStatus = () => {
      if (viewMode === 'ai-tutor' && aiTutorRef.current) {
        const hasMessages = aiTutorRef.current.getHasMessages();
        setHasAITutorMessages(hasMessages);
      }
    };

    // Check immediately and then every 500ms
    checkMessageStatus();
    const interval = setInterval(checkMessageStatus, 500);

    return () => clearInterval(interval);
  }, [viewMode]);

  // Check if authenticated user has completed onboarding
  useEffect(() => {
    async function checkOnboarding() {
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('onboarding_completed')
          .eq('user_id', user.id)
          .single();

        if (!profile || !profile.onboarding_completed) {
          // Redirect to onboarding if not completed
          router.push('/auth/onboarding');
        }
      }
    }
    
    checkOnboarding();
  }, [user, router]);

  useEffect(() => {
    // Check for AI tutor session parameter
    const sessionId = searchParams.get('session');
    const mode = searchParams.get('mode');

    if (sessionId && mode === 'ai-tutor') {
      setViewMode('ai-tutor');
      setSidebarMode('tutor');
      // Delay to ensure component is mounted
      setTimeout(() => {
        aiTutorRef.current?.restoreSession(sessionId);
      }, 100);
    }

    // Parse URL parameters for practice mode
    const topics = searchParams.get('topics');
    const difficulties = searchParams.get('difficulties');

    if (topics) {
      const topicIds = topics.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      setSelectedTopicIds(topicIds);
      setSelectedTopicId(null); // Clear single topic selection in practice mode
      setViewMode('problems'); // Ensure we're in problems view when filters are applied
    }
    
    if (difficulties) {
      const difficultyList = difficulties.split(',');
      setSelectedDifficulties(difficultyList);
    }
  }, [searchParams]);

  // Fetch topic information when selectedTopicId changes
  useEffect(() => {
    if (!selectedTopicId) {
      setSelectedTopicInfo(null);
      return;
    }

    const fetchTopicInfo = async () => {
      try {
        const { data: topic, error } = await supabase
          .from('topics')
          .select('main_topics, subtopics')
          .eq('id', selectedTopicId)
          .single();

        if (error) throw error;

        if (topic) {
          setSelectedTopicInfo({
            main_topic: topic.main_topics || '',
            subtopic: topic.subtopics || ''
          });
        }
      } catch (err) {
        console.error('Error fetching topic info:', err);
        setSelectedTopicInfo(null);
      }
    };

    fetchTopicInfo();
  }, [selectedTopicId]);

  const handleCreatePractice = () => {
    setPracticeViewMode('create-practice');
    setViewMode('create-practice');
    setSidebarMode('practice');
  };

  const handleBookmarks = () => {
    setPracticeViewMode('bookmarks');
    setViewMode('bookmarks');
    setSelectedTopicId(null);
    setSelectedTopicIds([]);
    setSelectedDifficulties([]);
    setSidebarMode('practice');
  };

  const [problemCount, setProblemCount] = useState<number>(10);
  const [savedProblemIds, setSavedProblemIds] = useState<string[]>([]);

  const handleStartPractice = (topicIds: number[], difficulties: string[], _source?: string, count?: number, problemIds?: string[]) => {
    setSelectedTopicIds(topicIds);
    setSelectedDifficulties(difficulties);
    setSelectedTopicId(null);
    setViewMode('problems');
    setSidebarMode('practice');
    if (count) {
      setProblemCount(count);
    }
    if (problemIds) {
      setSavedProblemIds(problemIds);
    } else {
      setSavedProblemIds([]);
    }
  };


  const handleLogoClick = () => {
    if (sidebarMode === 'tutor') {
      setViewMode('ai-tutor');
    } else {
      // Practice mode - show the welcome screen
      setViewMode('problems');
      setSelectedTopicId(null);
      setSelectedTopicIds([]);
      setSelectedDifficulties([]);
      setSavedProblemIds([]);
    }
  };

  const handleAITutor = () => {
    setViewMode('ai-tutor');
    setSidebarMode('tutor');
    setSelectedTopicId(null);
    setSelectedTopicIds([]);
    setSelectedDifficulties([]);
    // Reset AI Tutor to initial view
    aiTutorRef.current?.resetToInitialView();
  };

  const handleStudyMaterials = () => {
    // Do nothing - just show dropdown without changing view
  };

  const handleSidebarModeChange = (mode: 'tutor' | 'practice') => {
    setSidebarMode(mode);
    if (mode === 'tutor') {
      setViewMode('ai-tutor');
    } else {
      // Practice mode - restore the saved practice view mode
      setViewMode(practiceViewMode);
      // Keep the existing selectedTopicId, selectedTopicIds, selectedDifficulties, and savedProblemIds
      // so the user returns to where they left off
    }
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Mobile Header */}
      <div className="flex flex-col border-b bg-white dark:bg-gray-900 lg:hidden">
        <div className="flex items-center justify-between h-14 px-4">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <button className="cursor-pointer h-10 w-10 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
              </SheetHeader>
              <TopicsSidebar 
                selectedTopicId={selectedTopicId}
                onSelectTopic={async (id) => {
                  setSelectedTopicId(id);
                  setViewMode('problems');
                  setPracticeViewMode('problems');
                  setIsMobileMenuOpen(false);

                  // Clear practice session data when switching to a subtopic
                  setSelectedTopicIds([]);
                  setSelectedDifficulties([]);
                  setSavedProblemIds([]);

                  // Check if this is a Quick References topic and switch to handouts mode
                  try {
                    const { data: topic } = await supabase
                      .from('topics')
                      .select('main_topics')
                      .eq('id', id)
                      .single();

                    if (topic?.main_topics === 'Quick References') {
                      setContentMode('handouts');
                    } else {
                      setContentMode('problems');
                    }
                  } catch (err) {
                    console.error('Error checking topic type:', err);
                  }
                }}
                onToggleSidebar={() => setIsMobileMenuOpen(false)}
                onCreatePractice={() => {
                  handleCreatePractice();
                  setIsMobileMenuOpen(false);
                }}
                onBookmarks={() => {
                  handleBookmarks();
                  setIsMobileMenuOpen(false);
                }}
                onLogoClick={handleLogoClick}
                onAITutor={() => {
                  handleAITutor();
                  setIsMobileMenuOpen(false);
                }}
                onHistory={() => {
                  setViewMode('history');
                  setIsMobileMenuOpen(false);
                }}
                onStudyCalculus={() => {
                  handleStudyMaterials();
                  setIsMobileMenuOpen(false);
                }}
                mode={sidebarMode}
                activeMenu={viewMode}
              />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <img src="/epigram_logo.svg" alt="Epigram Logo" className="w-8 h-8 dark:invert" />
            <h1 className="font-bold text-xl">Epigram</h1>
          </div>

          <div className="w-6 h-6" />
        </div>
        
        {/* Mobile Mode Toggle */}
        {selectedTopicId && viewMode !== 'bookmarks' && viewMode !== 'create-practice' && (
          <div className="flex items-center justify-center px-4 py-2">
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setContentMode('problems')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  contentMode === 'problems'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Book className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Problems</span>
              </button>
              <button
                onClick={() => setContentMode('handouts')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  contentMode === 'handouts'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Handouts</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="flex flex-1 w-full relative min-h-0">
        {/* Left Sidebar - Topics */}
        <div className={`hidden ${isSidebarOpen ? 'w-60' : 'w-0'} transition-all duration-300 flex-shrink-0 bg-gray-50 border-r border-gray-100 dark:bg-gray-900 dark:border-gray-800 lg:flex flex-col relative h-full`}>
          {isSidebarOpen && (
            <TopicsSidebar 
              selectedTopicId={selectedTopicId}
              onSelectTopic={async (id) => {
                setSelectedTopicId(id);
                setViewMode('problems');
                setPracticeViewMode('problems');

                // Clear practice session data when switching to a subtopic
                setSelectedTopicIds([]);
                setSelectedDifficulties([]);
                setSavedProblemIds([]);

                // Check if this is a Quick References topic and switch to handouts mode
                try {
                  const { data: topic } = await supabase
                    .from('topics')
                    .select('main_topics')
                    .eq('id', id)
                    .single();

                  if (topic?.main_topics === 'Quick References') {
                    setContentMode('handouts');
                  } else {
                    setContentMode('problems');
                  }
                } catch (err) {
                  console.error('Error checking topic type:', err);
                }
              }}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              onCreatePractice={handleCreatePractice}
              onBookmarks={handleBookmarks}
              onLogoClick={handleLogoClick}
              onAITutor={handleAITutor}
              onHistory={() => setViewMode('history')}
              onStudyCalculus={handleStudyMaterials}
              mode={sidebarMode}
              activeMenu={viewMode}
            />
          )}
          {/* Mode Toggle */}
          {isSidebarOpen && (
            <div className="absolute bottom-16 left-0 right-0 p-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                <button
                  onClick={() => handleSidebarModeChange('tutor')}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer",
                    sidebarMode === 'tutor'
                      ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  Tutor
                </button>
                <button
                  onClick={() => handleSidebarModeChange('practice')}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer",
                    sidebarMode === 'practice'
                      ? "bg-black dark:bg-white text-white dark:text-black shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  Practice
                </button>
              </div>
            </div>
          )}
          {/* Bottom Auth Section */}
          {isSidebarOpen && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 dark:bg-gray-900">
              {isAuthenticated && user ? (
                <UserProfileDropdown user={user} />
              ) : (
                <Button
                  className="w-full cursor-pointer rounded-xl"
                  onClick={() => router.push('/auth/signin')}
                >
                  Sign in
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Main Content Area with Unified Header */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Unified Header - positioned to the right of sidebar */}
          <UnifiedHeader
            className="hidden lg:flex"
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onLogoClick={handleLogoClick}
            showModeToggle={selectedTopicId !== null && viewMode !== 'bookmarks' && viewMode !== 'create-practice' && viewMode !== 'ai-tutor' && selectedTopicInfo?.main_topic !== 'Quick References'}
            contentMode={contentMode}
            onContentModeChange={setContentMode}
            topicDisplay={selectedTopicInfo && viewMode !== 'create-practice' && viewMode !== 'ai-tutor' ? `${selectedTopicInfo.main_topic} - ${selectedTopicInfo.subtopic}` : undefined}
            showNewQuestionButton={viewMode === 'ai-tutor' && hasAITutorMessages}
            onNewQuestion={() => aiTutorRef.current?.resetToInitialView()}
          />

          {/* Content area below header */}
          {viewMode === 'ai-tutor' ? (
            <AITutorPage ref={aiTutorRef} initialSessionId={pendingSessionId || undefined} />
          ) : viewMode === 'history' ? (
            <HistoryView
              onOpenSession={(sessionId) => {
                setPendingSessionId(sessionId);
                setViewMode('ai-tutor');
                setSidebarMode('tutor');
                // Clear pending session after a short delay
                setTimeout(() => {
                  setPendingSessionId(null);
                }, 500);
              }}
            />
          ) : viewMode === 'create-practice' ? (
            <CreatePractice
              onStartPractice={handleStartPractice}
            />
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Content Panel */}
              {selectedTopicId || selectedTopicIds.length > 0 || viewMode === 'bookmarks' ? (
                <ResizablePanels
                  leftPanel={
                    contentMode === 'handouts' && selectedTopicId ? (
                      <HandoutsViewer selectedTopicId={selectedTopicId} />
                    ) : (
                      <ProblemViewer
                        selectedTopicId={selectedTopicId}
                        selectedTopicIds={selectedTopicIds}
                        selectedDifficulties={selectedDifficulties}
                        viewMode={(viewMode as string) === 'bookmarks' ? 'bookmarks' : 'problems'}
                        problemCount={problemCount}
                        savedProblemIds={savedProblemIds}
                      />
                    )
                  }
                  rightPanel={<ChatSidebar mode={contentMode} currentTopicId={contentMode === 'handouts' ? selectedTopicId : null} />}
                  defaultLeftWidth={contentMode === 'handouts' ? 60 : 50}
                  minLeftWidth={25}
                  maxLeftWidth={75}
                  className="flex-1"
                  storageKey={contentMode === 'handouts' ? 'handouts-panels-width' : 'main-panels-width'}
                />
              ) : (
                // Full width welcome screen when no topic is selected
                <ProblemViewer
                  selectedTopicId={selectedTopicId}
                  selectedTopicIds={selectedTopicIds}
                  selectedDifficulties={selectedDifficulties}
                  viewMode={(viewMode as string) === 'bookmarks' ? 'bookmarks' : 'problems'}
                  problemCount={problemCount}
                  savedProblemIds={savedProblemIds}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AppPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      </div>
    }>
      <AppPageContent />
    </Suspense>
  );
}