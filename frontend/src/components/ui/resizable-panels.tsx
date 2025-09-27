"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import ResizeHandle from "./resize-handle";
import { cn } from "@/lib/utils";

interface ResizablePanelsProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  defaultLeftWidth?: number; // percentage
  minLeftWidth?: number; // percentage
  maxLeftWidth?: number; // percentage
  className?: string;
  storageKey?: string; // for localStorage persistence
}

export default function ResizablePanels({
  leftPanel,
  rightPanel,
  defaultLeftWidth = 50,
  minLeftWidth = 20,
  maxLeftWidth = 80,
  className,
  storageKey = "resizable-panels-width"
}: ResizablePanelsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(defaultLeftWidth);
  const [isDragging, setIsDragging] = useState(false);

  // Load saved width from localStorage on mount and when storageKey changes
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const savedWidth = parseFloat(saved);
        if (savedWidth >= minLeftWidth && savedWidth <= maxLeftWidth) {
          setLeftWidth(savedWidth);
        }
      } else {
        // If no saved value exists, use the default
        setLeftWidth(defaultLeftWidth);
      }
    } else {
      setLeftWidth(defaultLeftWidth);
    }
  }, [storageKey, minLeftWidth, maxLeftWidth, defaultLeftWidth]);

  // Save width to localStorage only when drag ends (moved to handleMouseUp)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const x = moveEvent.clientX - containerRect.left;
      const newLeftWidth = (x / containerWidth) * 100;
      
      // Apply constraints
      const constrainedWidth = Math.min(
        Math.max(newLeftWidth, minLeftWidth),
        maxLeftWidth
      );
      
      setLeftWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      // Save to localStorage only when drag ends
      if (typeof window !== 'undefined' && storageKey) {
        localStorage.setItem(storageKey, leftWidth.toString());
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Prevent text selection during drag
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [minLeftWidth, maxLeftWidth]);

  const rightWidth = 100 - leftWidth;

  return (
    <div
      ref={containerRef}
      className={cn("flex h-full min-h-0 relative", className)}
      style={{ cursor: isDragging ? 'col-resize' : undefined }}
    >
      {/* Left Panel */}
      <div
        className={cn(
          "min-w-0 h-full flex flex-col",
          !isDragging && "transition-all duration-75 ease-out"
        )}
        style={{ width: `${leftWidth}%` }}
      >
        {leftPanel}
      </div>

      {/* Resize Handle */}
      <ResizeHandle
        onMouseDown={handleMouseDown}
        className="flex-shrink-0 z-10"
      />

      {/* Right Panel */}
      <div
        className={cn(
          "min-w-0 h-full flex flex-col",
          !isDragging && "transition-all duration-75 ease-out"
        )}
        style={{
          width: `${rightWidth}%`,
          backgroundColor: 'var(--background)'
        }}
      >
        {rightPanel}
      </div>
    </div>
  );
}