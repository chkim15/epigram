"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { Loader2, Search, ChevronUp, ChevronDown, X, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import dynamic from 'next/dynamic';

// Dynamically import react-pdf components to avoid SSR issues
const Document = dynamic(
  () => import('react-pdf').then((mod) => mod.Document),
  { 
    ssr: false,
    loading: () => null
  }
);

const Page = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { 
    ssr: false,
    loading: () => null
  }
);

// Only set up worker on client side
if (typeof window !== 'undefined') {
  import('react-pdf').then(({ pdfjs }) => {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
  });
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

export default function PDFViewerSimple({ pdfUrl, className = '' }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPageWidth, setSelectedPageWidth] = useState<string>('page-width');
  const [containerWidth, setContainerWidth] = useState<number>(300);
  const [actualPageWidth, setActualPageWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [matchCount, setMatchCount] = useState<number>(0);
  const matchesRef = useRef<HTMLElement[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    { id: 'custom', label: 'Custom', scale: 1.0 },
  ];

  // Robust container size calculation
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerWidth(rect.width - 16); // Account for padding (p-2 = 8px each side)
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
    if (option && value !== 'custom') {
      if (value === 'page-width') {
        setScale(1.0);
      } else {
        setScale(option.scale);
      }
    }
    // For custom, keep current scale
  }, [pageWidthOptions]);

  // Find the closest preset to current scale
  const findClosestPreset = useCallback((currentScale: number) => {
    const percentageOptions = pageWidthOptions.filter(opt => opt.id !== 'page-width' && opt.id !== 'custom');
    const closest = percentageOptions.reduce((prev, curr) => 
      Math.abs(curr.scale - currentScale) < Math.abs(prev.scale - currentScale) ? curr : prev
    );
    return Math.abs(closest.scale - currentScale) < 0.01 ? closest.id : 'custom';
  }, [pageWidthOptions]);

  // Calculate the width to pass to Page component
  const getPageWidth = useCallback(() => {
    if (selectedPageWidth === 'page-width') {
      return containerWidth;
    }
    return 280;
  }, [selectedPageWidth, containerWidth]);

  // Calculate the actual display scale for percentage display
  const getDisplayScale = useCallback(() => {
    if (selectedPageWidth === 'page-width' && actualPageWidth > 0) {
      // For page width, calculate actual scale based on rendered page width
      // PDF.js renders at 96 DPI by default, so a typical page is ~612px wide
      // The actual scale is the ratio of rendered width to this base width
      return actualPageWidth / 612; // Standard PDF page width at 96 DPI
    }
    return scale;
  }, [selectedPageWidth, actualPageWidth, scale]);

  // Track visible pages during scroll
  useEffect(() => {
    if (!numPages || numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visiblePages = new Set<number>();
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '1');
            visiblePages.add(pageNum);
          }
        });
        
        if (visiblePages.size > 0) {
          const lowestVisible = Math.min(...Array.from(visiblePages));
          setCurrentPage(lowestVisible);
        }
      },
      {
        root: containerRef.current,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0.1
      }
    );

    // Wait a moment for pages to render
    const timeoutId = setTimeout(() => {
      const pageElements = document.querySelectorAll('.pdf-page');
      pageElements.forEach(el => observer.observe(el));
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [numPages]);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log(`PDF loaded successfully: ${numPages} pages`);
    setNumPages(numPages);
    setLoading(false);
    setError(null);
    
    // Calculate actual page width after a brief delay to let the page render
    setTimeout(() => {
      const pageElement = document.querySelector('.react-pdf__Page');
      if (pageElement) {
        const pageRect = pageElement.getBoundingClientRect();
        setActualPageWidth(pageRect.width);
      }
    }, 500);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setError(`Failed to load PDF document: ${error.message}`);
    setLoading(false);
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    // Force re-render
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }, []);

  // --- Search helpers ---
  const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const clearHighlights = useCallback(() => {
    if (!containerRef.current) return;
    const textSpans = containerRef.current.querySelectorAll('.react-pdf__Page__textContent span');
    textSpans.forEach((span) => {
      const originalText = (span as HTMLElement).textContent || '';
      (span as HTMLElement).innerHTML = '';
      (span as HTMLElement).append(document.createTextNode(originalText));
    });
    matchesRef.current = [];
    setCurrentMatchIndex(0);
    setMatchCount(0);
  }, []);

  const performSearch = useCallback(() => {
    if (!containerRef.current) return;
    clearHighlights();
    const query = searchQuery.trim();
    if (!query) return;
    
    // Wait for text layer to be available
    const textSpans = containerRef.current.querySelectorAll('.react-pdf__Page__textContent span');
    if (textSpans.length === 0) {
      // Text layer not ready, retry after a short delay
      setTimeout(() => performSearch(), 100);
      return;
    }
    
    // Use partial matching for better search experience
    const escapedQuery = escapeRegExp(query);
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    
    textSpans.forEach((span) => {
      const el = span as HTMLElement;
      const text = el.textContent || '';
      if (!text) return;
      if (!regex.test(text)) return;
      // Reset regex lastIndex for subsequent tests
      regex.lastIndex = 0;
      const replaced = text.replace(regex, '<mark class="pdf-search-highlight" data-pdf-search-hit="$1">$1</mark>');
      el.innerHTML = replaced;
    });
    matchesRef.current = Array.from(containerRef.current.querySelectorAll('mark.pdf-search-highlight')) as HTMLElement[];
    setMatchCount(matchesRef.current.length);
    if (matchesRef.current.length > 0) {
      setCurrentMatchIndex(0);
      // Highlight the first match as active and scroll into view
      matchesRef.current[0].classList.add('pdf-search-active');
      matchesRef.current[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchQuery, clearHighlights]);

  const jumpToMatch = useCallback((next: boolean) => {
    const total = matchesRef.current.length;
    if (total === 0) return;
    // Remove current active state
    matchesRef.current[currentMatchIndex]?.classList.remove('pdf-search-active');
    const newIndex = next
      ? (currentMatchIndex + 1) % total
      : (currentMatchIndex - 1 + total) % total;
    setCurrentMatchIndex(newIndex);
    const target = matchesRef.current[newIndex];
    if (target) {
      target.classList.add('pdf-search-active');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentMatchIndex]);

  // Re-run search when query changes or layout changes while search UI is shown
  useEffect(() => {
    if (!showSearch) return;
    if (!searchQuery.trim()) {
      clearHighlights();
      return;
    }
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 100); // Reduced debounce time for more responsive search
    return () => clearTimeout(timeoutId);
  }, [showSearch, searchQuery, numPages, selectedPageWidth, scale, containerWidth, performSearch, clearHighlights]);

  // Auto-focus search input when search panel opens
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [showSearch]);

  // PDF fullscreen functionality
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

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
          <p className="text-sm mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'flex flex-col h-full'} ${className}`}>
      {/* PDF Toolbar */}
      <div className="flex items-center px-4 py-0 bg-white dark:bg-gray-900 flex-shrink-0">
        {/* Left section - Search button */}
        <div className="flex items-center flex-1">
          <Button
            variant={showSearch ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-2 cursor-pointer"
            onClick={() => {
              const next = !showSearch;
              setShowSearch(next);
              if (!next) {
                clearHighlights();
                setSearchQuery(''); // Reset search text when closing
              } else {
                setSearchQuery(''); // Reset search text when opening
                // Focus the search input after a brief delay to ensure it's rendered
                setTimeout(() => {
                  searchInputRef.current?.focus();
                }, 100);
              }
            }}
            aria-label="Search in PDF"
            title="Search in PDF"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Center section - Page counter and width selector */}
        <div className="flex items-center justify-center space-x-3">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {loading ? '...' : `${currentPage} / ${numPages}`}
          </span>
          
          <Select value={selectedPageWidth} onValueChange={handlePageWidthChange}>
            <SelectTrigger className="w-24 h-7 text-xs px-1 cursor-pointer">
              <SelectValue placeholder="Page fit" />
            </SelectTrigger>
            <SelectContent className="w-40 cursor-pointer">
              {/* Current scale display */}
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {Math.round(getDisplayScale() * 100)}%
                  </span>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newScale = Math.max(0.25, scale - 0.25);
                        setScale(newScale);
                        setSelectedPageWidth(findClosestPreset(newScale));
                      }}
                    >
                      −
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0 rounded-full cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const newScale = Math.min(5.0, scale + 0.25);
                        setScale(newScale);
                        setSelectedPageWidth(findClosestPreset(newScale));
                      }}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Preset options */}
              {pageWidthOptions.map((option) => {
                // Only show custom if it's currently selected
                if (option.id === 'custom' && selectedPageWidth !== 'custom') return null;
                
                return (
                  <SelectItem key={option.id} value={option.id} className="cursor-pointer">
                    {option.id === 'custom' ? `${Math.round(scale * 100)}%` : option.label}
                  </SelectItem>
                );
              }).filter(Boolean)}
            </SelectContent>
          </Select>
        </div>

        {/* Right section - Fullscreen button */}
        <div className="flex items-center justify-end flex-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 cursor-pointer"
            onClick={toggleFullscreen}
            aria-label="Toggle PDF fullscreen"
            title="Toggle PDF fullscreen"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showSearch && (
        <div className="px-3 pb-2 bg-white dark:bg-gray-900 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (e.shiftKey) {
                    jumpToMatch(false);
                  } else {
                    jumpToMatch(true);
                  }
                }
              }}
              placeholder="Find in document"
              className="w-48 h-8 px-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none"
            />
            <span className="text-xs text-gray-600 dark:text-gray-400 w-10 text-right">
              {matchCount > 0 ? `${currentMatchIndex + 1}/${matchCount}` : '0/0'}
            </span>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer" onClick={() => jumpToMatch(false)}>
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer" onClick={() => jumpToMatch(true)}>
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer" onClick={() => { setShowSearch(false); clearHighlights(); setSearchQuery(''); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* PDF Content */}
      <div ref={containerRef} className={`flex-1 overflow-auto relative pdf-content-container ${isFullscreen ? 'h-screen' : ''}`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-10">
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading PDF...</span>
            </div>
          </div>
        )}
        
        <div className="flex flex-col items-center p-2 space-y-4">
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
                key={`page-${index + 1}`}
                data-page-number={index + 1}
                className="pdf-page"
              >
                <Page
                  pageNumber={index + 1}
                  scale={selectedPageWidth === 'page-width' ? undefined : scale}
                  width={getPageWidth()}
                  className="shadow-lg max-w-full rounded-lg mb-4"
                  renderTextLayer={showSearch}
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