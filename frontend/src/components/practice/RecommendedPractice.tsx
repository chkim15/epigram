'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, ChevronRight, BookOpen, AlertCircle } from 'lucide-react';
import { MathContent } from '@/lib/utils/katex';
import {
  extractTextFromPDF,
  formatFileSize,
  type ExtractionProgress
} from '@/lib/utils/pdfToImagesSimple';

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

export default function RecommendedPractice({ onStartPractice, userId }: RecommendedPracticeProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recommendations, setRecommendations] = useState<Problem[]>([]);
  const [identifiedTopics, setIdentifiedTopics] = useState<Topic[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'extracting' | 'complete' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [extractionInfo, setExtractionInfo] = useState<{ pageCount?: number; extractedLength?: number; message?: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF extraction states
  const [extractionProgress, setExtractionProgress] = useState<ExtractionProgress | null>(null);

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

  const validateAndSetFile = (selectedFile: File) => {
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
        extractedText = await extractTextFromPDF(file, {
          onProgress: setExtractionProgress
        });

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

      // Save extraction information
      if (data.pageCount || data.extractedLength || data.message) {
        setExtractionInfo({
          pageCount: data.pageCount,
          extractedLength: data.extractedLength,
          message: data.message
        });
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
    setUploadStatus('idle');
    setErrorMessage('');
    setExtractionInfo(null);
    setConvertedImages([]);
    setConversionProgress(null);
    setShowImagePreviews(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
        <h2 className="text-2xl font-semibold mb-3" style={{ color: '#141310' }}>
          Recommended Practice
        </h2>
        <p className="text-gray-600">
          Upload your lecture notes or handouts (PDF/Image) to get personalized practice problems
        </p>
      </div>

      {/* Upload Section */}
      <div className="upload-section mb-8">
        <div
          className={`file-upload-area relative border-2 border-dashed rounded-xl p-8 transition-all ${
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
              className="flex flex-col items-center cursor-pointer"
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
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium" style={{ color: '#141310' }}>
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Extraction Progress */}
        {extractionProgress && uploadStatus === 'extracting' && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {extractionProgress.message}
                </span>
              </div>
              <span className="text-sm text-blue-700">
                {extractionProgress.percentage}%
              </span>
            </div>
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${extractionProgress.percentage}%` }}
              />
            </div>
          </div>
        )}


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
                  {uploadStatus === 'converting' ? 'Converting PDF...' :
                   uploadStatus === 'uploading' ? 'Uploading...' : 'Processing...'}
                </span>
              </span>
            ) : (
              'Get Recommendations'
            )}
          </button>
        )}
      </div>

      {/* Extraction Info Section */}
      {extractionInfo && uploadStatus === 'complete' && (
        <div className="extraction-info-section mb-6 p-4 rounded-xl border"
             style={{ backgroundColor: '#f5f4ee', borderColor: 'rgb(240,238,230)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              {extractionInfo.pageCount && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span style={{ color: '#141310' }}>
                    <strong>{extractionInfo.pageCount}</strong> page{extractionInfo.pageCount > 1 ? 's' : ''} processed
                  </span>
                </div>
              )}
              {extractionInfo.extractedLength && (
                <div className="flex items-center gap-2">
                  <span style={{ color: '#141310' }}>
                    <strong>{extractionInfo.extractedLength.toLocaleString()}</strong> characters extracted
                  </span>
                </div>
              )}
            </div>
            {extractionInfo.message && recommendations.length > 0 && (
              <div className="text-sm text-green-700 font-medium">
                ✓ {extractionInfo.message}
              </div>
            )}
          </div>
        </div>
      )}

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

          {/* Start All Button */}
          <button
            className="mt-6 w-full py-3 rounded-xl font-medium transition-all cursor-pointer border"
            style={{
              backgroundColor: '#faf9f5',
              color: '#141310',
              borderColor: 'rgb(240,238,230)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f4ee';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#faf9f5';
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
    </div>
  );
}