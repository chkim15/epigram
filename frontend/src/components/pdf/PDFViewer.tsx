"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import dynamic from 'next/dynamic';
import { usePDFWorker } from './PDFWorkerContext';
import { VirtualPDFPages } from './VirtualPDFPages';

// Configure worker BEFORE any react-pdf imports
if (typeof window !== 'undefined') {
  import('react-pdf').then(({ pdfjs }) => {
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
    }
  });
}

// Dynamically import Document to prevent auto-worker initialization
const Document = dynamic(
  () => import('react-pdf').then((mod) => mod.Document),
  { ssr: false }
);


interface PDFViewerProps {
  pdfUrl?: string;
  className?: string;
}

interface PageWidthOption {
  id: string;
  label: string;
  scale: number;
}

export default function PDFViewer({ pdfUrl, className = '' }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPageWidth, setSelectedPageWidth] = useState<string>('page-width');
  const [containerWidth, setContainerWidth] = useState<number>(300);
  const [containerHeight, setContainerHeight] = useState<number>(600);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use the robust worker context
  const { isReady: workerReady, isInitializing: workerInitializing, error: workerError, resetWorker } = usePDFWorker();

  // Page width options
  const pageWidthOptions: PageWidthOption[] = [
    { id: 'page-width', label: 'Page width', scale: 1.0 },
    { id: '50', label: '50%', scale: 0.5 },
    { id: '75', label: '75%', scale: 0.75 },
    { id: '100', label: '100%', scale: 1.0 },
    { id: '125', label: '125%', scale: 1.25 },
    { id: '150', label: '150%', scale: 1.5 },
    { id: '200', label: '200%', scale: 2.0 },
    { id: '300', label: '300%', scale: 3.0 },
  ];

  // Robust container size calculation - no layout dependencies
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerWidth(rect.width - 32); // Account for padding
        setContainerHeight(rect.height);
      }
    };

    updateContainerSize();
    
    const resizeObserver = new ResizeObserver(updateContainerSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const handlePageWidthChange = useCallback((value: string) => {
    setSelectedPageWidth(value);
    const option = pageWidthOptions.find(opt => opt.id === value);
    if (option) {
      if (value === 'page-width') {
        // For page width, calculate scale to fit container
        setScale(1.0);
      } else {
        setScale(option.scale);
      }
    }
  }, [pageWidthOptions]);

  // Calculate the width to pass to Page component
  const getPageWidth = useCallback(() => {
    if (selectedPageWidth === 'page-width') {
      return containerWidth; // Use container width for page-width option
    }
    return 280; // Default width for percentage options
  }, [selectedPageWidth, containerWidth]);

  // Handle visible page changes from virtual scroller
  const handleVisiblePagesChange = useCallback((visiblePages: number[]) => {
    if (visiblePages.length > 0) {
      // Update current page to the first visible page
      setCurrentPage(Math.min(...visiblePages));
    }
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log(`PDF loaded successfully: ${numPages} pages`);
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    console.error('PDF URL that failed:', pdfUrl);
    setError(`Failed to load PDF document: ${error.message}`);
    setLoading(false);
  }, [pdfUrl]);

  // Handle retry with worker reset
  const handleRetry = useCallback(async () => {
    setError(null);
    setLoading(true);
    if (workerError) {
      await resetWorker();
    }
  }, [workerError, resetWorker]);


  // Show worker initialization state
  if (workerInitializing) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Initializing PDF worker...</span>
        </div>
      </div>
    );
  }

  // Show worker error
  if (workerError) {
    return (
      <div className={`flex items-center justify-center h-full text-red-500 ${className}`}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-2" />
          <p className="text-sm mb-2">PDF worker failed to initialize</p>
          <p className="text-xs text-gray-500 mb-4">{workerError}</p>
          <Button variant="outline" size="sm" onClick={resetWorker}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset Worker
          </Button>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className={`flex items-center justify-center h-full text-gray-500 dark:text-gray-400 ${className}`}>
        <div className="text-center">
          <p className="text-sm">No PDF selected</p>
        </div>
      </div>
    );
  }

  // Show PDF loading error
  if (error) {
    return (
      <div className={`flex items-center justify-center h-full text-red-500 ${className}`}>
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-2" />
          <p className="text-sm mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* PDF Toolbar - Layout independent */}
      <div className="flex items-center justify-center px-4 py-0 flex-shrink-0" style={{ backgroundColor: '#faf9f5' }}>
        {/* Page counter and Page Width Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm" style={{ color: '#666' }}>
            {loading ? '...' : `${currentPage} / ${numPages}`}
          </span>
          
          <Select value={selectedPageWidth} onValueChange={handlePageWidthChange}>
            <SelectTrigger
              className="w-32 h-8 text-sm"
              style={{
                backgroundColor: '#faf9f5',
                borderColor: 'rgb(240,238,230)',
                color: '#3d3929'
              }}
            >
              <SelectValue placeholder="Page fit" />
            </SelectTrigger>
            <SelectContent
              style={{
                backgroundColor: '#faf9f5',
                borderColor: 'rgb(240,238,230)'
              }}
            >
              {pageWidthOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* PDF Content - Layout independent with virtual scrolling */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative pdf-content-container"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: '#faf9f5' }}>
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading PDF...</span>
            </div>
          </div>
        )}
        
        {workerReady && pdfUrl && (
          <div className="h-full">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
              error=""
              className={loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}
            >
              <VirtualPDFPages
                numPages={numPages}
                scale={scale}
                width={getPageWidth()}
                selectedPageWidth={selectedPageWidth}
                containerHeight={containerHeight}
                onVisiblePagesChange={handleVisiblePagesChange}
                className="mb-4"
              />
            </Document>
          </div>
        )}
        
        {!workerReady && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin" />
              <p className="text-sm">Waiting for PDF worker...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}