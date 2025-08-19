"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TopicsSidebar from "@/components/navigation/TopicsSidebar";
import ProblemViewer from "@/components/problems/ProblemViewer";
import ChatSidebar from "@/components/ai/ChatSidebar";
import ResizablePanels from "@/components/ui/resizable-panels";
import UnifiedHeader from "@/components/layout/UnifiedHeader";
import UserProfileDropdown from "@/components/auth/UserProfileDropdown";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export default function AppPage() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth, isLoading } = useAuthStore();
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

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
                setIsMobileMenuOpen(false);
              }}
              onToggleSidebar={() => setIsMobileMenuOpen(false)}
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
        <div className={`hidden ${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 flex-shrink-0 bg-gray-50 border-r border-gray-100 dark:bg-gray-900 dark:border-gray-800 lg:flex flex-col relative h-full`}>
          {isSidebarOpen && (
            <TopicsSidebar 
              selectedTopicId={selectedTopicId}
              onSelectTopic={setSelectedTopicId}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
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
          />

          {/* Resizable Panels below header */}
          <ResizablePanels
            leftPanel={<ProblemViewer />}
            rightPanel={<ChatSidebar />}
            defaultLeftWidth={50}
            minLeftWidth={25}
            maxLeftWidth={75}
            className="flex-1"
            storageKey="main-panels-width"
          />
        </div>
      </div>
    </div>
  );
}