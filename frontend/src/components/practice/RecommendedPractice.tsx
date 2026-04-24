'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, X, Loader2, ChevronRight, BookOpen, AlertCircle, FileImage, Maximize2, RefreshCw } from 'lucide-react';
import { MathContent } from '@/lib/utils/katex';
import { extractTextFromPDF } from '@/lib/utils/pdfToImagesSimple';
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

interface Problem {
  id: string;
  problem_text: string;
  difficulty: string;
  similarity: number;
  document_id: string;
  has_subproblems: boolean;
  subproblems?: Array<{
    id: string;
    key: string;
    problem_text: string;
    solution_text: string | null;
  }>;
}

interface Topic {
  id: number;
  main_topics: string;
  subtopics: string;
  course: string;
}

interface RecommendedPracticeProps {
  onStartPractice: (problemIds: string[]) => void;
  userId?: string;
  initialRecommendations?: Problem[];
  initialTopics?: Topic[];
  initialFile?: File | null;
  initialStatus?: 'idle' | 'complete';
  onRecommendationsChange?: (data: {
    recommendations: Problem[];
    identifiedTopics: Topic[];
    file: File | null;
    uploadStatus: 'idle' | 'complete';
  }) => void;
}

interface UploadResponse {
  success: boolean;
  recommendations: Problem[];
  identifiedTopics?: Topic[];
  uploadSummary?: string;
  extractedLength?: number;
  pageCount?: number;
  message?: string;
  error?: string;
  suggestions?: string[];
}

export default function RecommendedPractice({
  onStartPractice,
  userId,
  initialRecommendations = [],
  initialTopics = [],
  initialFile = null,
  initialStatus = 'idle',
  onRecommendationsChange
}: RecommendedPracticeProps) {
  const [file, setFile] = useState<File | null>(initialFile);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recommendations, setRecommendations] = useState<Problem[]>(initialRecommendations);
  const [identifiedTopics, setIdentifiedTopics] = useState<Topic[]>(initialTopics);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'extracting' | 'complete' | 'error'>(
    initialStatus === 'complete' ? 'complete' : 'idle'
  );
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview-related state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Notify parent when recommendations change
  useEffect(() => {
    if (onRecommendationsChange && uploadStatus === 'complete') {
      onRecommendationsChange({
        recommendations,
        identifiedTopics,
        file,
        uploadStatus: 'complete'
      });
    }
  }, [recommendations, identifiedTopics, file, uploadStatus, onRecommendationsChange]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFullPreview) {
        setShowFullPreview(false);
      }
    };

    if (showFullPreview) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showFullPreview]);

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && !previewUrl.startsWith('data:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const validateAndSetFile = async (selectedFile: File) => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.some(type => selectedFile.type.startsWith(type.split('/')[0]))) {
      setErrorMessage('Please upload a PDF or image file');
      return;
    }

    if (selectedFile.size > maxSize) {
      setErrorMessage('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    setErrorMessage('');
    setRecommendations([]);
    setIdentifiedTopics([]);
    setUploadStatus('idle');

    // Generate preview based on file type
    await generatePreview(selectedFile);
  };

  const generatePreview = async (file: File) => {
    setPreviewLoading(true);

    // Clean up previous preview URL to prevent memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    try {
      if (file.type.startsWith('image/')) {
        // For images, create a data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
          setPreviewLoading(false);
        };
        reader.onerror = () => {
          setPreviewLoading(false);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // For PDFs, create object URL and get page count
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        // Try to get PDF page count (we'll need to load it with react-pdf)
        // This will be handled in the preview component itself
        setPdfPageCount(null); // Will be set when PDF loads
        setPreviewLoading(false);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setPreviewLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage('');

    try {
      let extractedText = '';

      // Check if file is PDF - extract text directly
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setUploadStatus('extracting');

        // Extract text from PDF
        console.log('Extracting text from PDF...');
        extractedText = await extractTextFromPDF(file);

        console.log(`Extracted ${extractedText.length} characters from PDF`);
      }

      setUploadStatus('uploading');

      // Prepare form data
      const formData = new FormData();

      // For PDFs, send extracted text; for images, send the image file
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        formData.append('extractedText', extractedText);
        formData.append('isPDF', 'true');
      } else {
        formData.append('file', file);
        formData.append('isPDF', 'false');
      }

      if (userId) {
        formData.append('userId', userId);
      }

      setUploadStatus('processing');
      const response = await fetch('/api/recommendations/upload', {
        method: 'POST',
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (!response.ok) {
        // Check if there are suggestions for PDF files
        if (data.suggestions && data.suggestions.length > 0) {
          const errorMsg = data.error || 'Failed to process file';
          const suggestionsMsg = '\n\nSuggestions:\n• ' + data.suggestions.join('\n• ');
          throw new Error(errorMsg + suggestionsMsg);
        }
        throw new Error(data.error || 'Failed to process file');
      }

      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        if (data.identifiedTopics) {
          setIdentifiedTopics(data.identifiedTopics);
        }
        setUploadStatus('complete');
      } else {
        if (data.identifiedTopics) {
          setIdentifiedTopics(data.identifiedTopics);
        }
        setUploadStatus('complete');
        setErrorMessage(data.message || 'No similar problems found. Try uploading more specific content.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred while processing your file');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setRecommendations([]);
    setIdentifiedTopics([]);

    // Clean up preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPdfPageCount(null);
    setShowFullPreview(false);
    setUploadStatus('idle');
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetSession = () => {
    // Reset all state to initial values
    setFile(null);
    setRecommendations([]);
    setIdentifiedTopics([]);
    setUploadStatus('idle');
    setErrorMessage('');
    setIsProcessing(false);
    setDragActive(false);

    // Clean up preview-related state
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPdfPageCount(null);
    setShowFullPreview(false);
    setPreviewLoading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Notify parent if needed
    if (onRecommendationsChange) {
      onRecommendationsChange({
        recommendations: [],
        identifiedTopics: [],
        file: null,
        uploadStatus: 'idle'
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'hard':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };


  return (
    <div className="recommended-practice h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-3" style={{ color: '#141310' }}>
              Personalized Practice
            </h2>
            <p className="text-gray-600">
              Upload your lecture notes or problems (PDF/Image) to get personalized practice problems
            </p>
          </div>
          {/* New Practice Button - Show when we have results */}
          {(uploadStatus === 'complete' || recommendations.length > 0) && (
            <button
              onClick={resetSession}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all cursor-pointer border"
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--secondary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--background)';
              }}
              title="Start a new practice session"
            >
              <RefreshCw className="w-4 h-4" />
              <span>New Practice</span>
            </button>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <div className="upload-section mb-8">
        <div
          className={`file-upload-area relative border-2 border-dashed rounded-xl transition-all ${
            dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/*"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />

          {!file ? (
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center cursor-pointer p-8"
            >
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2" style={{ color: '#141310' }}>
                Drop your file here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports PDF and images (PNG, JPG, WEBP) up to 10MB
              </p>
            </label>
          ) : (
            <div className="file-preview">
              {/* Preview Content with Action Buttons */}
              <div className="preview-content relative rounded-lg overflow-hidden">
                {/* Action Buttons Overlay */}
                <div className="absolute top-2 right-2 z-10 flex space-x-1">
                  <button
                    onClick={() => setShowFullPreview(true)}
                    className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm transition-all cursor-pointer"
                    title="View full preview"
                  >
                    <Maximize2 className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={removeFile}
                    className="p-1.5 bg-white/90 hover:bg-white rounded-lg shadow-sm transition-all cursor-pointer"
                    title="Remove file"
                  >
                    <X className="w-4 h-4 text-gray-700" />
                  </button>
                </div>

                {previewLoading ? (
                  <div className="flex items-center justify-center h-80 bg-white">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    {file.type.startsWith('image/') && previewUrl && (
                      <div className="bg-white flex items-center justify-center min-h-[20rem]">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="max-h-72 max-w-full object-contain border border-black rounded-lg"
                        />
                      </div>
                    )}

                    {(file.type === 'application/pdf' || file.name.endsWith('.pdf')) && previewUrl && (
                      <div className="bg-white flex items-center justify-center p-2">
                        <Document
                          file={previewUrl}
                          onLoadSuccess={({ numPages }) => setPdfPageCount(numPages)}
                          loading={
                            <div className="flex items-center justify-center h-80">
                              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                          }
                          error={
                            <div className="flex flex-col items-center justify-center h-80 text-gray-500">
                              <FileText className="w-12 h-12 mb-2" />
                              <p className="text-sm">PDF preview unavailable</p>
                            </div>
                          }
                          className="border border-black rounded-lg overflow-hidden"
                        >
                          <Page
                            pageNumber={1}
                            width={Math.min(window.innerWidth * 0.6, 500)}
                            className="mx-auto"
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                          />
                        </Document>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>



        {/* Error Message */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <p className="text-sm text-red-700 whitespace-pre-line">{errorMessage}</p>
          </div>
        )}

        {/* Upload Button */}
        {file && uploadStatus !== 'complete' && (
          <button
            onClick={handleUpload}
            disabled={!file || isProcessing}
            className="mt-6 px-6 py-3 rounded-xl font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: isProcessing ? '#e9e6dc' : '#141310',
              color: 'white',
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = '#3d3929';
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = '#141310';
              }
            }}
          >
            {isProcessing ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>
                  {uploadStatus === 'extracting' ? 'Extracting text...' :
                   uploadStatus === 'uploading' ? 'Uploading...' : 'Processing...'}
                </span>
              </span>
            ) : (
              'Get Recommendations'
            )}
          </button>
        )}
      </div>


      {/* Identified Topics Section */}
      {identifiedTopics.length > 0 && uploadStatus === 'complete' && (
        <div className="identified-topics-section mb-6 p-4 rounded-xl border" style={{ backgroundColor: '#faf9f5', borderColor: 'rgb(240,238,230)' }}>
          <h3 className="text-lg font-semibold mb-3" style={{ color: '#141310' }}>
            Identified Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {identifiedTopics.map((topic) => (
              <div
                key={topic.id}
                className="px-3 py-2 rounded-lg text-sm border"
                style={{
                  backgroundColor: 'white',
                  borderColor: 'rgb(240,238,230)',
                  color: '#141310'
                }}
              >
                <span className="font-medium">{topic.main_topics}</span>
                {topic.subtopics && (
                  <span className="text-gray-600 ml-1">- {topic.subtopics}</span>
                )}
                <span className="text-xs text-gray-500 ml-2">({topic.course})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="recommendations-section">
          <h3 className="text-xl font-semibold mb-6" style={{ color: '#141310' }}>
            Recommended Problems
          </h3>

          <div className="space-y-4">
            {recommendations.map((problem, index) => (
              <div
                key={problem.id}
                className="recommendation-card border rounded-xl p-5 hover:shadow-md transition-shadow bg-white"
                style={{ borderColor: 'rgb(240,238,230)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-semibold" style={{ color: '#141310' }}>
                      #{index + 1}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getDifficultyColor(
                        problem.difficulty
                      )}`}
                    >
                      {problem.difficulty}
                    </span>
                    {problem.has_subproblems && (
                      <span className="text-xs text-gray-500">
                        ({problem.subproblems?.length || 0} parts)
                      </span>
                    )}
                  </div>
                </div>

                <div className="problem-preview mb-4">
                  <div className="text-gray-700 line-clamp-3">
                    <MathContent content={problem.problem_text} />
                  </div>
                  {problem.has_subproblems && problem.subproblems && (
                    <div className="mt-2 pl-4 border-l-2 border-gray-200">
                      {problem.subproblems.slice(0, 2).map(sp => (
                        <div key={sp.id} className="text-sm text-gray-600 mt-1 flex">
                          <span className="font-medium mr-2">({sp.key})</span>
                          <MathContent content={sp.problem_text.substring(0, 80) + '...'} />
                        </div>
                      ))}
                      {problem.subproblems.length > 2 && (
                        <p className="text-xs text-gray-500 mt-1">
                          +{problem.subproblems.length - 2} more parts
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <button
                  className="flex items-center space-x-2 text-sm font-medium cursor-pointer"
                  style={{ color: '#a16207' }}
                  onClick={() => onStartPractice([problem.id])}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.textDecoration = 'underline';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.textDecoration = 'none';
                  }}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Try This Problem</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Start All Button - Primary color for visibility */}
          <button
            className="mt-6 w-full py-3.5 rounded-xl font-semibold transition-all cursor-pointer border shadow-md"
            style={{
              backgroundColor: '#a16207',
              color: 'white',
              borderColor: '#a16207',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#8a5206';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#a16207';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
            onClick={() => onStartPractice(recommendations.map(r => r.id))}
          >
            Start Practice with All {recommendations.length} Problems
          </button>
        </div>
      )}

      {/* Empty State */}
      {uploadStatus === 'complete' && recommendations.length === 0 && !errorMessage && (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            No similar problems found in our database.
          </p>
          <p className="text-sm text-gray-500">
            Try uploading more specific mathematical content or lecture notes with clear problem statements.
          </p>
        </div>
      )}
        </div>
      </div>

      {/* Full Preview Modal */}
      {showFullPreview && file && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
          onClick={() => setShowFullPreview(false)}
        >
          <div
            className="relative bg-white rounded-xl max-w-6xl max-h-[90vh] w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgb(240,238,230)' }}>
              <div className="flex items-center space-x-3">
                {file.type.startsWith('image/') ? (
                  <FileImage className="w-5 h-5 text-gray-600" />
                ) : (
                  <FileText className="w-5 h-5 text-gray-600" />
                )}
                <div>
                  <p className="font-medium" style={{ color: '#141310' }}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                    {pdfPageCount && ` • ${pdfPageCount} pages`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFullPreview(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              {file.type.startsWith('image/') && previewUrl && (
                <div className="p-4 flex items-center justify-center min-h-[400px] bg-gray-50">
                  <img
                    src={previewUrl}
                    alt="Full preview"
                    className="max-w-full h-auto rounded"
                  />
                </div>
              )}

              {(file.type === 'application/pdf' || file.name.endsWith('.pdf')) && previewUrl && (
                <div className="p-4 bg-gray-50">
                  <Document
                    file={previewUrl}
                    loading={
                      <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
                      </div>
                    }
                    error={
                      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <FileText className="w-16 h-16 mb-3" />
                        <p>Failed to load PDF</p>
                      </div>
                    }
                  >
                    {pdfPageCount && Array.from(new Array(pdfPageCount), (_, index) => (
                      <div key={`page_${index + 1}`} className="mb-4">
                        <div className="text-center text-sm text-gray-500 mb-2">
                          Page {index + 1} of {pdfPageCount}
                        </div>
                        <Page
                          pageNumber={index + 1}
                          width={Math.min(window.innerWidth * 0.8, 800)}
                          className="mx-auto shadow-lg"
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      </div>
                    ))}
                  </Document>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}