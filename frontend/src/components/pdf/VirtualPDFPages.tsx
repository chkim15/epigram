"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Page } from 'react-pdf';

interface VirtualPDFPagesProps {
  numPages: number;
  scale: number | undefined;
  width: number;
  selectedPageWidth: string;
  containerHeight: number;
  onVisiblePagesChange: (visiblePages: number[]) => void;
  className?: string;
}

interface PageInfo {
  pageNumber: number;
  height: number;
  y: number;
}

const ESTIMATED_PAGE_HEIGHT = 600; // Default estimation before actual measurement
const BUFFER_PAGES = 2; // Render 2 pages above and below visible area

export const VirtualPDFPages: React.FC<VirtualPDFPagesProps> = ({
  numPages,
  scale,
  width,
  selectedPageWidth,
  containerHeight,
  onVisiblePagesChange,
  className = '',
}) => {
  const [pageHeights, setPageHeights] = useState<Map<number, number>>(new Map());
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Calculate page positions and which pages to render
  const pageInfo = useMemo((): PageInfo[] => {
    let currentY = 0;
    return Array.from({ length: numPages }, (_, index) => {
      const pageNumber = index + 1;
      const height = pageHeights.get(pageNumber) || ESTIMATED_PAGE_HEIGHT;
      const pageInfo: PageInfo = {
        pageNumber,
        height,
        y: currentY,
      };
      currentY += height + 16; // 16px spacing between pages
      return pageInfo;
    });
  }, [numPages, pageHeights]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    return pageInfo.length > 0 ? pageInfo[pageInfo.length - 1].y + pageInfo[pageInfo.length - 1].height : 0;
  }, [pageInfo]);

  // Calculate visible pages with buffer
  const visiblePages = useMemo(() => {
    const viewportTop = scrollTop;
    const viewportBottom = scrollTop + containerHeight;

    const visible: number[] = [];
    
    for (const info of pageInfo) {
      const pageTop = info.y;
      const pageBottom = info.y + info.height;
      
      // Add buffer zone
      const bufferedTop = pageTop - BUFFER_PAGES * ESTIMATED_PAGE_HEIGHT;
      const bufferedBottom = pageBottom + BUFFER_PAGES * ESTIMATED_PAGE_HEIGHT;
      
      if (bufferedBottom >= viewportTop && bufferedTop <= viewportBottom) {
        visible.push(info.pageNumber);
      }
    }
    
    return visible;
  }, [pageInfo, scrollTop, containerHeight]);

  // Update visible pages callback
  useEffect(() => {
    onVisiblePagesChange(visiblePages);
  }, [visiblePages, onVisiblePagesChange]);

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  // Measure page height when it loads
  const handlePageLoadSuccess = useCallback((pageNumber: number) => {
    const pageElement = pageRefs.current.get(pageNumber);
    if (pageElement) {
      const height = pageElement.getBoundingClientRect().height;
      setPageHeights(prev => {
        const updated = new Map(prev);
        updated.set(pageNumber, height);
        return updated;
      });
    }
  }, []);

  // Create page element
  const renderPage = useCallback((pageNumber: number) => {
    const info = pageInfo.find(p => p.pageNumber === pageNumber);
    if (!info) return null;

    return (
      <div
        key={`page-${pageNumber}`}
        ref={el => {
          if (el) {
            pageRefs.current.set(pageNumber, el);
          } else {
            pageRefs.current.delete(pageNumber);
          }
        }}
        data-page-number={pageNumber}
        className="pdf-page"
        style={{
          position: 'absolute',
          top: info.y,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'fit-content',
        }}
      >
        <Page
          pageNumber={pageNumber}
          scale={selectedPageWidth === 'page-width' ? undefined : scale}
          width={width}
          className={`shadow-lg max-w-full border border-gray-200 dark:border-gray-700 rounded-lg ${className}`}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          onLoadSuccess={() => handlePageLoadSuccess(pageNumber)}
        />
      </div>
    );
  }, [pageInfo, scale, selectedPageWidth, width, className, handlePageLoadSuccess]);

  return (
    <div
      ref={scrollContainerRef}
      className="relative w-full h-full overflow-auto"
      onScroll={handleScroll}
    >
      {/* Virtual container with full height */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Render only visible pages */}
        {visiblePages.map(pageNumber => renderPage(pageNumber))}
      </div>
    </div>
  );
};