"use client";

import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { X, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScientificCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ScientificCalculatorDialogIframe({
  open,
  onOpenChange,
}: ScientificCalculatorDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset position when dialog opens
  useEffect(() => {
    if (open) {
      setPosition({ x: 0, y: 0 });
    }
  }, [open]);

  // Handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        setPosition({ x: deltaX, y: deltaY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content 
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-[420px]",
            "rounded-lg border-0 bg-transparent shadow-none duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            isDragging && "transition-none"
          )}
          style={{
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
          }}
        >
          {/* Hidden title for accessibility */}
          <VisuallyHidden.Root>
            <DialogPrimitive.Title>GeoGebra Scientific Calculator</DialogPrimitive.Title>
          </VisuallyHidden.Root>

          {/* Drag handle */}
          <div 
            className="absolute left-0 right-0 top-0 h-10 flex items-center justify-center cursor-move rounded-t-lg hover:bg-black/10 dark:hover:bg-white/10"
            onMouseDown={handleMouseDown}
          >
            <GripHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>

          {/* Close button */}
          <DialogPrimitive.Close 
            className="absolute right-3 top-3 z-10 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none cursor-pointer bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 p-1"
          >
            <X className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Content container with iframe */}
          <div className="relative w-full h-[600px] mt-8">
            <iframe
              src="https://www.geogebra.org/scientific?lang=en&perspective=T"
              width="420"
              height="600"
              style={{
                border: 'none',
                borderRadius: '8px',
                backgroundColor: 'transparent'
              }}
              title="GeoGebra Scientific Calculator"
              className="w-full h-full bg-transparent"
              allow="fullscreen"
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}