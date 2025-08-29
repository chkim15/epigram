"use client";

import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { X, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalculatorAPI {
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
    ggbApplet: CalculatorAPI;
  }
}

interface ScientificCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ScientificCalculatorDialog({
  open,
  onOpenChange,
}: ScientificCalculatorDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const appletRef = useRef<CalculatorAPI | null>(null);

  // Reset position when dialog opens
  useEffect(() => {
    if (open) {
      setPosition({ x: 0, y: 0 });
      setIsLoading(true);
      
      // Load GeoGebra script if not loaded
      if (!scriptLoadedRef.current) {
        const script = document.createElement("script");
        script.src = "https://www.geogebra.org/apps/deployggb.js";
        script.async = true;
        script.onload = () => {
          scriptLoadedRef.current = true;
          setTimeout(() => {
            initScientificCalculator();
          }, 100);
        };
        script.onerror = () => {
          console.error("Failed to load GeoGebra script");
          setIsLoading(false);
        };
        document.head.appendChild(script);
      } else {
        setTimeout(() => {
          initScientificCalculator();
        }, 100);
      }
    } else {
      // Clean up when closing
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
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
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart]);

  const initScientificCalculator = () => {
    if (!containerRef.current || !window.GGBApplet) {
      console.error("Container or GGBApplet not available");
      setIsLoading(false);
      return;
    }

    try {
      // Clear previous content
      containerRef.current.innerHTML = '';
      
      // Create a unique div for the applet
      const appletDiv = document.createElement('div');
      appletDiv.id = 'ggb-scientific-calc-' + Date.now();
      appletDiv.style.width = '100%';
      appletDiv.style.height = '100%';
      containerRef.current.appendChild(appletDiv);

      // Parameters for scientific calculator based on the working example
      const parameters = {
        appName: "scientific",
        id: "ggbScientificCalc",
        width: 430,
        height: 530,
        showToolBar: true,
        borderColor: null,
        showMenuBar: false,
        allowStyleBar: true,
        showAlgebraInput: true,
        enableLabelDrags: false,
        enableShiftDragZoom: true,
        capturingThreshold: null,
        showToolBarHelp: false,
        errorDialogsActive: true,
        showTutorialLink: false,
        showLogging: false,
        useBrowserForJS: true,
        disableAutoScale: false,
        allowUpscale: false,
        preventFocus: false,
        showZoomButtons: false,
        showFullscreenButton: false,
        showSuggestionButtons: false,
        showStartTooltip: false,
        language: "en",
        appletOnLoad: () => {
          console.log("GeoGebra Scientific Calculator loaded");
          appletRef.current = window.ggbApplet;
          setIsLoading(false);
        }
      };

      const applet = new window.GGBApplet(parameters, true);
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
        <DialogPrimitive.Content 
          className={cn(
            "fixed left-[50%] top-[50%] z-50",
            "duration-200",
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

          {/* Main container */}
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
            {/* Header section */}
            <div 
              className="h-10 bg-white flex items-center justify-center relative cursor-move"
              onMouseDown={handleMouseDown}
            >
              <GripHorizontal className="h-5 w-5 text-gray-400" />
              
              {/* Close button in header */}
              <DialogPrimitive.Close 
                className="absolute right-2 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none cursor-pointer p-1"
              >
                <X className="h-4 w-4 text-gray-600" />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            </div>

            {/* GeoGebra container */}
            <div className="relative w-[450px] h-[550px] bg-white p-2.5">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-600">
                      Loading Scientific Calculator...
                    </p>
                  </div>
                </div>
              )}
              <div
                ref={containerRef}
                className="w-full h-full"
                style={{
                  minWidth: '430px',
                  minHeight: '530px'
                }}
              />
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}