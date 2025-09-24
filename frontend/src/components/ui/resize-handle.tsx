"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  onMouseDown: (e: React.MouseEvent) => void;
  className?: string;
}

export default function ResizeHandle({ onMouseDown, className }: ResizeHandleProps) {
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
        "w-1 transition-all duration-150 ease-in-out",
        "bg-transparent",
        className
      )}
      style={{
        backgroundColor: isDragging ? 'rgb(240,238,230)' : '#f5f4ee'
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.backgroundColor = 'rgb(240,238,230)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.backgroundColor = '#f5f4ee';
        }
      }}
      onMouseDown={handleMouseDown}
    >
      
      {/* Dragging indicator - removed since we keep the same gray color */}
    </div>
  );
}