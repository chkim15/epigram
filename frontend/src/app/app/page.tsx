"use client";

import { useState } from "react";
import TopicsSidebar from "@/components/navigation/TopicsSidebar";
import ProblemViewer from "@/components/problems/ProblemViewer";
import ChatSidebar from "@/components/ai/ChatSidebar";
import ResizablePanels from "@/components/ui/resizable-panels";
import UnifiedHeader from "@/components/layout/UnifiedHeader";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function AppPage() {
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="w-full h-screen flex flex-col">
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
      <div className="flex flex-1 w-full relative min-h-0">
        {/* Left Sidebar - Topics */}
        <div className={`hidden ${isSidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 flex-shrink-0 border-r bg-white dark:bg-gray-900 lg:flex flex-col relative h-full`}>
          {isSidebarOpen && (
            <TopicsSidebar 
              selectedTopicId={selectedTopicId}
              onSelectTopic={setSelectedTopicId}
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          )}
          {/* Bottom Sign in button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900">
            <Button className="w-full">Sign in</Button>
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