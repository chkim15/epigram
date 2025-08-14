"use client";

import { useState, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import PDF components to avoid SSR issues
const Document = dynamic(
  () => import('react-pdf').then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { ssr: false }
);

// Set up PDF.js worker only on client side
if (typeof window !== 'undefined') {
  const pdfjs = require('react-pdf').pdfjs;
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}


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
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Ensure component is mounted before rendering PDF
  useEffect(() => {
    setIsMounted(true);
    if (pdfUrl) {
      console.log('PDF URL being loaded:', pdfUrl);
    }
  }, [pdfUrl]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
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


  // Show loading until component is mounted
  if (!isMounted) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="flex items-center space-x-2 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Initializing PDF viewer...</span>
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

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full text-red-500 ${className}`}>
        <div className="text-center">
          <p className="text-sm">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => {
              setError(null);
              setLoading(true);
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* PDF Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[50px] text-center">
          {loading ? '...' : `${pageNumber}/${numPages}`}
        </span>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading PDF...</span>
            </div>
          </div>
        )}
        
        <div className="flex justify-center p-4 min-h-full">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
            error=""
            className={loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              className="shadow-lg max-w-full border border-gray-200 dark:border-gray-700 rounded-lg"
              renderTextLayer={false}
              renderAnnotationLayer={false}
              width={280}
            />
          </Document>
        </div>
      </div>
    </div>
  );
}