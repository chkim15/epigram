"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TopicsSidebar from "@/components/navigation/TopicsSidebar";
import ProblemViewer from "@/components/problems/ProblemViewer";
import ChatSidebar from "@/components/ai/ChatSidebar";
import CreatePractice from "@/components/practice/CreatePractice";
import ResizablePanels from "@/components/ui/resizable-panels";
import UnifiedHeader from "@/components/layout/UnifiedHeader";
import UserProfileDropdown from "@/components/auth/UserProfileDropdown";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/lib/supabase/client";

function AppPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'problems' | 'create-practice'>('problems');

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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

  const handleCreatePractice = () => {
    setViewMode('create-practice');
  };

  const handleStartPractice = (topicIds: number[], difficulties: string[]) => {
    setSelectedTopicIds(topicIds);
    setSelectedDifficulties(difficulties);
    setSelectedTopicId(null);
    setViewMode('problems');
  };


  const handleLogoClick = () => {
    setViewMode('problems');
  };

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Mobile Header */}
      <div className="flex items-center justify-between border-b bg-white h-14 px-4 dark:bg-gray-900 lg:hidden">
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
              onSelectTopic={(id) => {
                setSelectedTopicId(id);
                setViewMode('problems');
                setIsMobileMenuOpen(false);
              }}
              onToggleSidebar={() => setIsMobileMenuOpen(false)}
              onCreatePractice={() => {
                handleCreatePractice();
                setIsMobileMenuOpen(false);
              }}
              onLogoClick={handleLogoClick}
            />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <img src="/epigram_logo.svg" alt="Epigram Logo" className="w-8 h-8" />
          <h1 className="font-bold text-xl">Epigram</h1>
        </div>

        <div className="w-6 h-6" />
      </div>

      {/* Desktop Layout */}
      <div className="flex flex-1 w-full relative min-h-0">
        {/* Left Sidebar - Topics */}
        <div className={`hidden ${isSidebarOpen ? 'w-60' : 'w-0'} transition-all duration-300 flex-shrink-0 bg-gray-50 border-r border-gray-100 dark:bg-gray-900 dark:border-gray-800 lg:flex flex-col relative h-full`}>
          {isSidebarOpen && (
            <TopicsSidebar 
              selectedTopicId={selectedTopicId}
              onSelectTopic={(id) => {
                setSelectedTopicId(id);
                setViewMode('problems');
              }}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              onCreatePractice={handleCreatePractice}
              onLogoClick={handleLogoClick}
            />
          )}
          {/* Bottom Auth Section */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 dark:bg-gray-900">
            {isAuthenticated && user ? (
              <UserProfileDropdown user={user} />
            ) : (
              <Button 
                className="w-full cursor-pointer"
                onClick={() => router.push('/auth/signin')}
              >
                Sign in
              </Button>
            )}
          </div>
        </div>

        {/* Main Content Area with Unified Header */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Unified Header - positioned to the right of sidebar */}
          <UnifiedHeader 
            className="hidden lg:flex" 
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            onLogoClick={handleLogoClick}
          />

          {/* Content area below header */}
          {viewMode === 'create-practice' ? (
            <CreatePractice
              onStartPractice={handleStartPractice}
            />
          ) : (
            <ResizablePanels
              leftPanel={
                <ProblemViewer 
                  selectedTopicId={selectedTopicId}
                  selectedTopicIds={selectedTopicIds}
                  selectedDifficulties={selectedDifficulties}
                />
              }
              rightPanel={<ChatSidebar />}
              defaultLeftWidth={50}
              minLeftWidth={25}
              maxLeftWidth={75}
              className="flex-1"
              storageKey="main-panels-width"
            />
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