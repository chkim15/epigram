"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface WorkerState {
  isReady: boolean;
  isInitializing: boolean;
  error: string | null;
  workerVersion: string | null;
}

interface PDFWorkerContextType extends WorkerState {
  initializeWorker: () => Promise<boolean>;
  resetWorker: () => Promise<void>;
}

const PDFWorkerContext = createContext<PDFWorkerContextType | null>(null);

export const usePDFWorker = () => {
  const context = useContext(PDFWorkerContext);
  if (!context) {
    throw new Error('usePDFWorker must be used within a PDFWorkerProvider');
  }
  return context;
};

interface PDFWorkerProviderProps {
  children: React.ReactNode;
}

export const PDFWorkerProvider: React.FC<PDFWorkerProviderProps> = ({ children }) => {
  const [workerState, setWorkerState] = useState<WorkerState>({
    isReady: false,
    isInitializing: false,
    error: null,
    workerVersion: null,
  });

  const initializeWorker = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') {
      return false;
    }

    setWorkerState(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      // Dynamic import to ensure client-side only
      const { pdfjs } = await import('react-pdf');

      // Set up worker with local .mjs file
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.mjs';
        console.log(`Using local PDF.js worker (version: ${pdfjs.version})`);
      }

      // Test worker by creating a minimal PDF document
      const testArrayBuffer = new ArrayBuffer(8);
      const testUint8Array = new Uint8Array(testArrayBuffer);
      
      // Simple worker health check - try to create a loading task
      try {
        const loadingTask = pdfjs.getDocument({ data: testUint8Array });
        await loadingTask.promise.catch(() => {
          // Expected to fail with invalid PDF, but worker should initialize
        });
      } catch {
        // Expected - we just want to trigger worker initialization
      }

      setWorkerState({
        isReady: true,
        isInitializing: false,
        error: null,
        workerVersion: pdfjs.version,
      });

      console.log(`PDF.js worker initialized successfully (version: ${pdfjs.version})`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown worker initialization error';
      console.error('PDF worker initialization failed:', error);
      
      setWorkerState({
        isReady: false,
        isInitializing: false,
        error: errorMessage,
        workerVersion: null,
      });
      
      return false;
    }
  }, []);

  const resetWorker = useCallback(async (): Promise<void> => {
    setWorkerState({
      isReady: false,
      isInitializing: false,
      error: null,
      workerVersion: null,
    });
    
    // Clear any existing worker
    if (typeof window !== 'undefined') {
      try {
        const { pdfjs } = await import('react-pdf');
        pdfjs.GlobalWorkerOptions.workerSrc = '';
      } catch (error) {
        console.warn('Error clearing worker:', error);
      }
    }
    
    // Re-initialize
    await initializeWorker();
  }, [initializeWorker]);

  // Initialize worker on mount
  useEffect(() => {
    initializeWorker();
  }, [initializeWorker]);

  const contextValue: PDFWorkerContextType = {
    ...workerState,
    initializeWorker,
    resetWorker,
  };

  return (
    <PDFWorkerContext.Provider value={contextValue}>
      {children}
    </PDFWorkerContext.Provider>
  );
};