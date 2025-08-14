"use client";

import { useState, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

// Set up PDF.js worker only on client side - EXACT working configuration
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
  const [selectedPageWidth, setSelectedPageWidth] = useState<string>('page-width');
  const [containerWidth, setContainerWidth] = useState<number>(300);

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

  // Ensure component is mounted before rendering PDF
  useEffect(() => {
    setIsMounted(true);
    if (pdfUrl) {
      console.log('PDF URL being loaded:', pdfUrl);
    }
  }, [pdfUrl]);

  // Calculate container width on mount and resize
  useEffect(() => {
    const updateContainerWidth = () => {
      const container = document.querySelector('.pdf-content-container');
      if (container) {
        const containerRect = container.getBoundingClientRect();
        setContainerWidth(containerRect.width - 32); // Account for padding
      }
    };

    updateContainerWidth();
    window.addEventListener('resize', updateContainerWidth);
    return () => window.removeEventListener('resize', updateContainerWidth);
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

  // Set up intersection observer to track visible pages
  useEffect(() => {
    if (!numPages || numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const newVisiblePages = new Set<number>();
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '1');
            newVisiblePages.add(pageNum);
          }
        });
        
        // Update current page number to the lowest visible page
        if (newVisiblePages.size > 0) {
          const lowestVisible = Math.min(...Array.from(newVisiblePages));
          setPageNumber(lowestVisible);
        }
      },
      {
        root: document.querySelector('.pdf-content-container'),
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0.1
      }
    );

    // Observe all page elements after they're rendered
    const timeoutId = setTimeout(() => {
      const pageElements = document.querySelectorAll('.pdf-page');
      pageElements.forEach(el => observer.observe(el));
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [numPages, setPageNumber]);

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
      <div className="flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-900 flex-shrink-0">
        {/* Page counter and Page Width Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {loading ? '...' : `${pageNumber} / ${numPages}`}
          </span>
          
          <Select value={selectedPageWidth} onValueChange={handlePageWidthChange}>
            <SelectTrigger className="w-32 h-8 text-sm">
              <SelectValue placeholder="Page fit" />
            </SelectTrigger>
            <SelectContent>
              {pageWidthOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto relative pdf-content-container">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading PDF...</span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col items-center p-4 space-y-4">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading=""
            error=""
            className={loading ? 'opacity-0' : 'opacity-100 transition-opacity duration-300'}
          >
            {/* Render all pages */}
            {Array.from(new Array(numPages), (_, index) => (
              <div
                key={`page-container-${index + 1}`}
                data-page-number={index + 1}
                className="pdf-page"
              >
                <Page
                  pageNumber={index + 1}
                  scale={selectedPageWidth === 'page-width' ? undefined : scale}
                  width={getPageWidth()}
                  className="shadow-lg max-w-full border border-gray-200 dark:border-gray-700 rounded-lg mb-4"
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </div>
            ))}
          </Document>
        </div>
      </div>
    </div>
  );
}