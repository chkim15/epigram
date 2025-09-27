"use client";

import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { X, Loader2, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface GeoGebraAPI {
  newConstruction(): void;
  setWidth(width: number): void;
  setHeight(height: number): void;
}

interface GGBAppletConstructor {
  new (params: Record<string, unknown>, inject?: boolean): {
    inject(id: string): void;
  };
}

declare global {
  interface Window {
    GGBApplet: GGBAppletConstructor;
  }
}

interface GeoGebraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GeoGebraDialog({
  open,
  onOpenChange,
}: GeoGebraDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const appletRef = useRef<GeoGebraAPI | null>(null);

  // Reset position when dialog opens
  useEffect(() => {
    if (open) {
      setPosition({ x: 0, y: 0 });
      setIsLoading(true);
      
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Load script if not loaded
      if (!scriptLoadedRef.current) {
        const script = document.createElement("script");
        script.src = "https://www.geogebra.org/apps/deployggb.js";
        script.async = true;
        script.onload = () => {
          scriptLoadedRef.current = true;
          // Add delay to ensure DOM is ready
          timeoutRef.current = setTimeout(() => {
            initGeoGebra();
          }, 100);
        };
        script.onerror = () => {
          console.error("Failed to load GeoGebra script");
          setIsLoading(false);
        };
        document.head.appendChild(script);
      } else {
        // Script already loaded, init with delay
        timeoutRef.current = setTimeout(() => {
          initGeoGebra();
        }, 100);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
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

  const initGeoGebra = () => {
    if (!containerRef.current || !window.GGBApplet) {
      console.error("Container or GGBApplet not available");
      setIsLoading(false);
      return;
    }

    try {
      // Clear previous content
      containerRef.current.innerHTML = '';
      
      // Create a div for the applet
      const appletDiv = document.createElement('div');
      appletDiv.id = 'ggb-element-' + Date.now();
      containerRef.current.appendChild(appletDiv);

      const params = {
        appName: "graphing",
        width: 700,  // More square-like dimensions
        height: 460, // Original height restored
        showToolBar: true,
        showAlgebraInput: true,  // Keep this true to show input field and toggle
        showInputBar: false,     // Hide the input bar initially but keep toggle button
        showMenuBar: false,
        showToolBarHelp: true,
        showResetIcon: true,
        enableRightClick: true,
        errorDialogsActive: false,
        useBrowserForJS: true,
        allowStyleBar: true,
        preventFocus: false,
        showZoomButtons: true,
        showFullscreenButton: true,
        scale: 1,
        disableAutoScale: false,
        allowUpscale: false,
        clickToLoad: false,
        appletOnLoad: (api: GeoGebraAPI) => {
          console.log("GeoGebra loaded successfully");
          appletRef.current = api;
          setIsLoading(false);
        },
        showSuggestionButtons: true,
        buttonRounding: 0.7,
        buttonShadows: false,
        language: "en",
        enableShiftDragZoom: true,
      };

      const applet = new window.GGBApplet(params, true);
      applet.inject(appletDiv.id);
    } catch (error) {
      console.error("Error initializing GeoGebra:", error);
      setIsLoading(false);
    }
  };

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
        {/* No overlay - background stays visible */}
        <DialogPrimitive.Content 
          ref={dialogRef}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 w-[720px]",
            "rounded-xl border bg-background shadow-2xl duration-200",
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
            <DialogPrimitive.Title>GeoGebra Graphing Calculator</DialogPrimitive.Title>
          </VisuallyHidden.Root>

          {/* Drag handle */}
          <div 
            className="absolute left-0 right-0 top-0 h-10 flex items-center justify-center cursor-move rounded-t-xl"
            onMouseDown={handleMouseDown}
          >
            <GripHorizontal className="h-5 w-5 text-gray-400" />
          </div>

          {/* Close button */}
          <DialogPrimitive.Close 
            className="absolute right-3 top-3 z-10 rounded-xl opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none cursor-pointer"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>

          {/* Content container */}
          <div className="relative w-full h-[480px] mt-8 p-3">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Loading GeoGebra...
                  </p>
                </div>
              </div>
            )}
            <div
              ref={containerRef}
              className="w-full h-full"
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}