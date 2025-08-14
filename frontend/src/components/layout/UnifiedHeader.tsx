"use client";

import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface UnifiedHeaderProps {
  className?: string;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export default function UnifiedHeader({ 
  className, 
  isSidebarOpen = true, 
  onToggleSidebar 
}: UnifiedHeaderProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-gray-900 h-[46px] flex flex-shrink-0 px-4 items-center w-full",
      className
    )}>
      {/* Hamburger button when sidebar is collapsed */}
      {!isSidebarOpen && onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          className="mr-4 mt-1 h-8 w-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </button>
      )}
      {/* Flexible spacer to push right-side actions */}
      <div className="flex-1" />

      {/* Right-aligned Sign in button */}
      {/**
       * Temporarily disabling the top-right Sign in button.
       * Keep this block to easily re-enable later.
       */}
      {false && (
        <div className="flex items-center">
          <Button size="sm" className="h-8 px-3 rounded-lg bg-black text-white hover:bg-black/90">
            Sign in
          </Button>
        </div>
      )}
    </div>
  );
}