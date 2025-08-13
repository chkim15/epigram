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
      
      {/* Dragging indicator - removed since we keep the same gray color */}
    </div>
  );
}