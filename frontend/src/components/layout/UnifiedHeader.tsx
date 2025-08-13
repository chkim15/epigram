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
      "bg-white dark:bg-gray-900 h-[58px] flex items-center flex-shrink-0 px-4",
      className
    )}>
      {/* Hamburger button when sidebar is collapsed */}
      {!isSidebarOpen && onToggleSidebar && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="mr-4"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}
      
      {/* Empty header content as requested - can be populated later */}
    </div>
  );
}