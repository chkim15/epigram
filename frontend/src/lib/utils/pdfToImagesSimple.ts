/**
 * PDF Text Extractor
 * Uses PDF.js from CDN to extract text directly from PDFs
 */

export interface ExtractionProgress {
  currentPage: number;
  totalPages: number;
  percentage: number;
  status: 'loading' | 'extracting' | 'complete' | 'error';
  message: string;
}

export interface PDFExtractionOptions {
  maxPages?: number;
  onProgress?: (progress: ExtractionProgress) => void;
}

// PDF.js types (minimal definitions)
interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
}

interface PDFPageProxy {
  getTextContent(): Promise<TextContent>;
  cleanup(): void;
}

interface TextContent {
  items: Array<{ str: string }>;
}

interface PDFJSLib {
  getDocument(src: { data: ArrayBuffer }): { promise: Promise<PDFDocumentProxy> };
  GlobalWorkerOptions: { workerSrc: string };
}

// Global reference to PDF.js loaded from CDN
declare global {
  interface Window {
    pdfjsLib?: PDFJSLib;
  }
}

/**
 * Load PDF.js from CDN if not already loaded
 */
async function loadPDFJS(): Promise<PDFJSLib> {
  // Check if already loaded
  if (window.pdfjsLib) {
    return window.pdfjsLib;
  }

  // Load PDF.js from CDN
  const PDFJS_VERSION = '3.11.174';
  const PDFJS_CDN = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PDFJS_CDN;
    script.async = true;

    script.onload = () => {
      if (window.pdfjsLib) {
        // Set worker from CDN
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js failed to load'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load PDF.js from CDN'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Extract text from a PDF file using PDF.js from CDN
 * This is faster and more accurate than converting to images + OCR
 */
export async function extractTextFromPDF(
  file: File,
  options: PDFExtractionOptions = {}
): Promise<string> {
  const {
    maxPages,
    onProgress
  } = options;

  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('PDF extraction only works in the browser');
  }

  try {
    // Update progress
    if (onProgress) {
      onProgress({
        currentPage: 0,
        totalPages: 0,
        percentage: 0,
        status: 'loading',
        message: 'Loading PDF library...'
      });
    }

    // Load PDF.js from CDN
    const pdfjsLib = await loadPDFJS();

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();

    if (onProgress) {
      onProgress({
        currentPage: 0,
        totalPages: 0,
        percentage: 10,
        status: 'loading',
        message: 'Loading PDF document...'
      });
    }

    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const totalPages = Math.min(pdfDoc.numPages, maxPages || pdfDoc.numPages);

    console.log(`Extracting text from ${totalPages} pages`);

    let extractedText = '';

    // Extract text from each page
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      if (onProgress) {
        onProgress({
          currentPage: pageNum,
          totalPages,
          percentage: Math.round((10 + (pageNum - 1) * 90 / totalPages)),
          status: 'extracting',
          message: `Extracting page ${pageNum} of ${totalPages}...`
        });
      }

      const page = await pdfDoc.getPage(pageNum);

      // Extract text content from the page
      const textContent = await page.getTextContent();

      // Combine all text items into a string
      const pageText = textContent.items
        .map((item) => item.str)
        .join(' ');

      extractedText += `\n\n--- Page ${pageNum} ---\n\n${pageText}`;

      // Clean up
      page.cleanup();
    }

    // Complete
    if (onProgress) {
      onProgress({
        currentPage: totalPages,
        totalPages,
        percentage: 100,
        status: 'complete',
        message: `Successfully extracted text from ${totalPages} pages`
      });
    }

    return extractedText.trim();

  } catch (error) {
    console.error('Error extracting text from PDF:', error);

    if (onProgress) {
      onProgress({
        currentPage: 0,
        totalPages: 0,
        percentage: 0,
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to extract text from PDF'
      });
    }

    throw error;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}