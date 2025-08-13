"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
}

export default function ResizeHandle({ onMouseDown, className }: ResizeHandleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    onMouseDown(e);
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center group cursor-col-resize",
        "w-1 hover:w-2 transition-all duration-150 ease-in-out",
        "bg-transparent hover:bg-gray-300 dark:hover:bg-gray-600",
        isDragging && "bg-gray-300 dark:bg-gray-600 w-2",
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Visual divider line - always visible */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
      
      {/* Hover indicator */}
      <div
        className={cn(
          "absolute left-0 top-1/2 transform -translate-y-1/2",
          "w-1 h-8 bg-gray-400 dark:bg-gray-500 rounded-full opacity-0",
          "transition-opacity duration-150 ease-in-out",
          (isHovered || isDragging) && "opacity-100"
        )}
      />
      
      {/* Dragging indicator - removed since we keep the same gray color */}
    </div>
  );
}