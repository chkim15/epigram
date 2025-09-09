"use client";

import { Button } from "@/components/ui/button";
import { Menu, FileText, Book } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnifiedHeaderProps {
  className?: string;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onLogoClick?: () => void;
  showModeToggle?: boolean;
  contentMode?: 'problems' | 'handouts';
  onContentModeChange?: (mode: 'problems' | 'handouts') => void;
  topicDisplay?: string;
}

export default function UnifiedHeader({ 
  className, 
  isSidebarOpen = true, 
  onToggleSidebar,
  onLogoClick,
  showModeToggle = false,
  contentMode = 'problems',
  onContentModeChange,
  topicDisplay
}: UnifiedHeaderProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-gray-900 h-[46px] flex flex-shrink-0 px-4 items-center w-full",
      className
    )}>
      {/* Hamburger button and logo when sidebar is collapsed */}
      {!isSidebarOpen && onToggleSidebar && (
        <>
          <button
            onClick={onToggleSidebar}
            className="mr-3 mt-1 h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            onClick={onLogoClick}
          >
            <img src="/epigram_logo.svg" alt="Epigram Logo" className="w-8 h-8 dark:invert" />
            <h1 className="font-bold text-xl text-gray-900 dark:text-white">Epigram</h1>
          </div>
        </>
      )}
      
      {/* Topic Display - Left side */}
      <div className="flex-1 flex items-center">
        {topicDisplay && (
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {topicDisplay}
          </div>
        )}
      </div>
      
      {/* Mode Toggle - Fixed center position */}
      {showModeToggle && onContentModeChange && (
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => onContentModeChange('handouts')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition-all cursor-pointer ${
              contentMode === 'handouts'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Handouts</span>
          </button>
          <button
            onClick={() => onContentModeChange('problems')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md transition-all cursor-pointer ${
              contentMode === 'problems'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Book className="h-4 w-4" />
            <span className="text-sm font-medium">Problems</span>
          </button>
        </div>
      )}
      
      {/* Flexible spacer to push right-side actions */}
      <div className="flex-1" />

      {/* Contact Us Button */}
      <Button
        size="sm"
        onClick={() => window.open('/contact', '_blank')}
        className="h-8 px-3 rounded-lg cursor-pointer bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        Contact Us
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