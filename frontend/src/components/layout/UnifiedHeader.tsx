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
      "bg-white dark:bg-gray-900 h-[46px] flex flex-shrink-0 px-4",
      className
    )}>
      {/* Hamburger button when sidebar is collapsed */}
      {!isSidebarOpen && onToggleSidebar && (
        <div className="flex items-center h-full">
          <button
            onClick={onToggleSidebar}
            className="mr-4 h-9 w-9 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      )}
      
      {/* Empty header content as requested - can be populated later */}
    </div>
  );
}