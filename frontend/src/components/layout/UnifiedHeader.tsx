"use client";

import { Button } from "@/components/ui/button";
import { Menu, FileText, Book, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface UnifiedHeaderProps {
  className?: string;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onLogoClick?: () => void;
  showModeToggle?: boolean;
  contentMode?: 'problems' | 'handouts';
  onContentModeChange?: (mode: 'problems' | 'handouts') => void;
  topicDisplay?: string;
  showNewQuestionButton?: boolean;
  onNewQuestion?: () => void;
  centerTitle?: string;
}

export default function UnifiedHeader({
  className,
  isSidebarOpen = true,
  onToggleSidebar,
  onLogoClick,
  showModeToggle = false,
  contentMode = 'problems',
  onContentModeChange,
  topicDisplay,
  showNewQuestionButton = false,
  onNewQuestion,
  centerTitle
}: UnifiedHeaderProps) {
  return (
    <div className={cn(
      "h-[46px] flex flex-shrink-0 px-4 items-center w-full",
      className
    )} style={{ backgroundColor: '#faf9f5' }}>
      {/* Hamburger button and logo when sidebar is collapsed */}
      {!isSidebarOpen && onToggleSidebar && (
        <>
          <button
            onClick={onToggleSidebar}
            className="mr-3 mt-1 h-8 w-8 flex items-center justify-center rounded-md transition-colors cursor-pointer"
            style={{ '--hover-bg': '#e9e6dc' } as React.CSSProperties}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9e6dc'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Menu className="h-5 w-5" style={{ color: '#3d3929' }} />
          </button>
          <div 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            onClick={onLogoClick}
          >
            <Image src="/epigram_logo.svg" alt="Epigram Logo" width={32} height={32} className="dark:invert" />
            <h1 className="font-bold text-xl" style={{ color: '#3d3929' }}>Epigram</h1>
          </div>
        </>
      )}
      
      {/* New Question Button and Topic Display - Left side */}
      <div className={cn("flex-1 flex items-center gap-4", !isSidebarOpen && "ml-8")}>
        {showNewQuestionButton && onNewQuestion && (
          <Button
            onClick={onNewQuestion}
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-xl cursor-pointer border"
            style={{
              backgroundColor: '#faf9f5',
              color: '#3d3929',
              borderColor: 'rgb(240,238,230)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f4ee'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#faf9f5'}
          >
            <Plus className="h-4 w-4 mr-1" />
            New Question
          </Button>
        )}
        {topicDisplay && (
          <div className="text-sm font-medium" style={{ color: '#666' }}>
            {topicDisplay}
          </div>
        )}
      </div>
      
      {/* Center Title - Displayed when provided */}
      {centerTitle && !showModeToggle && (
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-xl font-bold" style={{ color: '#3d3929' }}>
            {centerTitle}
          </h1>
        </div>
      )}

      {/* Mode Toggle - Fixed center position */}
      {showModeToggle && onContentModeChange && (
        <div className="flex items-center rounded-xl p-1" style={{ backgroundColor: '#e9e6dc' }}>
          <button
            onClick={() => onContentModeChange('handouts')}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all cursor-pointer"
            style={{
              backgroundColor: contentMode === 'handouts' ? '#faf9f5' : 'transparent',
              color: contentMode === 'handouts' ? '#141310' : '#666',
              boxShadow: contentMode === 'handouts' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none'
            }}
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Handouts</span>
          </button>
          <button
            onClick={() => onContentModeChange('problems')}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all cursor-pointer"
            style={{
              backgroundColor: contentMode === 'problems' ? '#faf9f5' : 'transparent',
              color: contentMode === 'problems' ? '#141310' : '#666',
              boxShadow: contentMode === 'problems' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 'none'
            }}
          >
            <Book className="h-4 w-4" />
            <span className="text-sm font-medium">Problems</span>
          </button>
        </div>
      )}
      
      {/* Flexible spacer to push right-side actions */}
      <div className="flex-1" />

      {/* Get Help Button */}
      <Button
        size="sm"
        onClick={() => window.open('/contact', '_blank')}
        className="h-8 px-3 rounded-xl cursor-pointer border shadow-none"
        style={{
          backgroundColor: '#faf9f5',
          color: '#141310',
          borderColor: 'rgb(240,238,230)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f4ee'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#faf9f5'}
      >
        Get Help
      </Button>

      {/* Right-aligned Sign in button */}
      {/**
       * Temporarily disabling the top-right Sign in button.
       * Keep this block to easily re-enable later.
       */}
      {false && (
        <div className="flex items-center ml-2">
          <Button size="sm" className="h-8 px-3 rounded-lg bg-black text-white hover:bg-black/90">
            Sign in
          </Button>
        </div>
      )}
    </div>
  );
}