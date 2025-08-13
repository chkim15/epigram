"use client";

import { useState } from "react";
import TopicsSidebar from "@/components/navigation/TopicsSidebar";
import ProblemViewer from "@/components/problems/ProblemViewer";
import ChatSidebar from "@/components/ai/ChatSidebar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function AppPage() {
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Mobile Header */}
      <div className="flex items-center justify-between border-b bg-white p-4 dark:bg-gray-900 lg:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
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

        <h1 className="font-semibold">Math Learning Platform</h1>

        <div className="w-6 h-6" />
      </div>

      {/* Desktop Layout */}
      <div className="flex flex-1 w-full relative">
        {/* Left Sidebar - Topics */}
        <div className={`hidden ${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 flex-shrink-0 border-r bg-white dark:bg-gray-900 lg:flex flex-col overflow-hidden relative`}>
          {isSidebarOpen && (
            <TopicsSidebar 
              selectedTopicId={selectedTopicId}
              onSelectTopic={setSelectedTopicId}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          )}
        </div>

        {/* Expand Sidebar Button (when collapsed) */}
        {!isSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-4 z-20 hidden lg:flex"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Main Content Area - Always split 50/50 between Problems and AI */}
        <div className="flex-1 flex overflow-hidden">
          {/* Problem Viewer - Always exactly half of remaining space */}
          <div className="flex-1 min-w-0 overflow-hidden relative transition-all duration-300 flex flex-col">
            <ProblemViewer />
          </div>

          {/* AI Assistant - Always exactly half of remaining space */}
          <div className="flex-1 min-w-0 border-l bg-white dark:bg-gray-900 relative overflow-hidden flex flex-col">
            <ChatSidebar currentProblem={null} />
          </div>
        </div>
      </div>
    </div>
  );
}