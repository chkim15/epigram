"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Problem, Subproblem, Document } from "@/types/database";
import { useProblemStore } from "@/stores/problemStore";
import { MathContent } from "@/lib/utils/katex";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen,
  Loader2,
  LineChart,
  Calculator 
} from "lucide-react";
import { cn } from "@/lib/utils";
import GeoGebraDialog from "@/components/geogebra/GeoGebraDialog";
import ScientificCalculatorDialog from "@/components/geogebra/ScientificCalculatorDialog";

interface ProblemViewerProps {
  selectedTopicId: number | null;
  selectedTopicIds?: number[];
  selectedDifficulties?: string[];
}

export default function ProblemViewer({ selectedTopicId, selectedTopicIds = [], selectedDifficulties = [] }: ProblemViewerProps) {
  const {
    currentProblem,
    currentProblemIndex,
    problemList,
    currentDocument,
    isLoading,
    canGoNext,
    canGoPrevious,
    setProblemList,
    setCurrentDocument,
    nextProblem,
    previousProblem,
    setLoading,
  } = useProblemStore();

  console.log('ProblemViewer state:', {
    currentProblem,
    currentProblemIndex,
    problemListLength: problemList.length,
    isLoading
  });

  const [subproblems, setSubproblems] = useState<Subproblem[]>([]);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [geogebraOpen, setGeogebraOpen] = useState(false);
  const [scientificCalculatorOpen, setScientificCalculatorOpen] = useState(false);

  useEffect(() => {
    fetchAllProblems();
  }, [selectedTopicId, selectedTopicIds, selectedDifficulties]);

  useEffect(() => {
    if (currentProblem) {
      console.log('Current problem changed:', {
        problemId: currentProblem.id,
        problemDocumentId: currentProblem.document_id,
        allDocumentsCount: allDocuments.length
      });
      
      fetchSubproblems(currentProblem.id);
      
      // Clear answers when problem changes
      setAnswers({});
      
      // Update current document based on the current problem's document_id
      if (allDocuments.length > 0) {
        const problemDocument = allDocuments.find(doc => doc.id === currentProblem.document_id);
        if (problemDocument) {
          setCurrentDocument(problemDocument);
          console.log('Updated document for problem:', {
            problemId: currentProblem.id,
            problemNumber: currentProblem.problem_id,
            documentId: problemDocument.document_id,
            documentPrimaryId: problemDocument.id
          });
        } else {
          console.warn('No document found for problem document_id:', currentProblem.document_id);
        }
      } else {
        console.warn('Documents not loaded yet');
      }
    }
  }, [currentProblem, allDocuments]);

  const fetchAllProblems = async () => {
    try {
      setLoading(true);
      const isPracticeMode = selectedTopicIds.length > 0 || selectedDifficulties.length > 0;
      console.log('Fetching problems from database...', {
        practiceMode: isPracticeMode,
        selectedTopicId,
        selectedTopicIds,
        selectedDifficulties
      });
      
      // First fetch documents data
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*');

      if (documentsError) {
        console.error('Error fetching documents:', documentsError);
      }

      // Store all documents
      if (documentsData && documentsData.length > 0) {
        setAllDocuments(documentsData);
        console.log('Loaded documents:', documentsData);
      }
      
      let problemsData;
      let problemsError;
      
      if (isPracticeMode) {
        // Practice mode: filter by multiple topics and difficulties
        let query = supabase
          .from('problems')
          .select(`
            id, problem_id, document_id, problem_text, correct_answer, hint, solution_text,
            math_approach, reasoning_type, difficulty, importance,
            comment, version, created_at, updated_at, included,
            problem_topics!inner(topic_id)
          `)
          .eq('included', true);
        
        // Filter by topics if provided
        if (selectedTopicIds.length > 0) {
          query = query.in('problem_topics.topic_id', selectedTopicIds);
        }
        
        // Filter by difficulties if provided
        if (selectedDifficulties.length > 0) {
          query = query.in('difficulty', selectedDifficulties);
        }
        
        const result = await query
          .order('document_id')
          .order('problem_id');
        
        problemsData = result.data;
        problemsError = result.error;
        
        // Clean up the data structure - remove the problem_topics array from each problem
        if (problemsData) {
          // Remove duplicates that might occur when a problem has multiple topics
          const uniqueProblems = new Map<string, Problem>();
          problemsData.forEach((problem: Problem & { problem_topics?: unknown }) => {
            const { problem_topics: _, ...cleanProblem } = problem;
            if (!uniqueProblems.has(cleanProblem.id)) {
              uniqueProblems.set(cleanProblem.id, cleanProblem);
            }
          });
          problemsData = Array.from(uniqueProblems.values());
        }
      } else if (selectedTopicId) {
        // Single topic selection from sidebar
        const result = await supabase
          .from('problems')
          .select(`
            id, problem_id, document_id, problem_text, correct_answer, hint, solution_text,
            math_approach, reasoning_type, difficulty, importance,
            comment, version, created_at, updated_at, included,
            problem_topics!inner(topic_id)
          `)
          .eq('included', true)
          .eq('problem_topics.topic_id', selectedTopicId)
          .order('document_id')
          .order('problem_id');
        
        problemsData = result.data;
        problemsError = result.error;
        
        // Clean up the data structure - remove the problem_topics array from each problem
        if (problemsData) {
          problemsData = problemsData.map((problem: Problem & { problem_topics?: unknown }) => {
            const { problem_topics: _, ...cleanProblem } = problem;
            return cleanProblem;
          });
        }
      } else {
        // Fetch ALL problems when no topic is selected
        const result = await supabase
          .from('problems')
          .select(`
            id, problem_id, document_id, problem_text, correct_answer, hint, solution_text,
            math_approach, reasoning_type, difficulty, importance,
            comment, version, created_at, updated_at, included
          `)
          .eq('included', true)
          .order('document_id')
          .order('problem_id');
        
        problemsData = result.data;
        problemsError = result.error;
      }

      console.log('Database response:', { problemsData, problemsError });

      if (problemsError) throw problemsError;

      console.log(`Found ${problemsData?.length || 0} problems${isPracticeMode ? ' for practice session' : selectedTopicId ? ` for topic ${selectedTopicId}` : ' total'}`);

      setProblemList(problemsData || []);
      
      // Set initial document based on first problem
      if (problemsData && problemsData.length > 0 && documentsData && documentsData.length > 0) {
        const firstProblemDoc = documentsData.find(doc => doc.id === problemsData[0].document_id);
        if (firstProblemDoc) {
          setCurrentDocument(firstProblemDoc);
        }
      }
    } catch (err) {
      console.error('Error fetching problems:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubproblems = async (problemId: string) => {
    try {
      const { data, error } = await supabase
        .from('subproblems')
        .select('*')
        .eq('problem_id', problemId)
        .order('key');

      if (error) throw error;

      setSubproblems(data || []);
    } catch (err) {
      console.error('Error fetching subproblems:', err);
      setSubproblems([]);
    }
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'hard': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'very_hard': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handleAnswerChange = (key: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTextareaResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };


  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading problems...</p>
        </div>
      </div>
    );
  }

  if (problemList.length === 0 && !isLoading) {
    return (
      <div className="flex h-full flex-col min-h-0 px-2 py-2 bg-white dark:bg-gray-900">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex h-full flex-col">
          <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-gray-900 p-3 custom-scrollbar">
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No Problems Found
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col min-h-0 px-2 py-2 bg-white dark:bg-gray-900">
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex h-full flex-col">
      {/* Problem Content */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-gray-900 p-3 custom-scrollbar">
        <div className="w-full space-y-6 min-w-0">
          {currentProblem && (
            <>
              {/* Main Problem */}
              <Card className="w-full border-0 shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span>Problem {currentProblemIndex + 1}</span>
                    {currentProblem.difficulty && (
                      <Badge className={cn("text-xs", getDifficultyColor(currentProblem.difficulty))}>
                        {currentProblem.difficulty.replace('_', ' ')}
                      </Badge>
                    )}
                    <div className="ml-auto flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => setScientificCalculatorOpen(true)}
                        className="!p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                        title="Open Scientific Calculator"
                      >
                        <Calculator className="!h-6 !w-6" />
                      </Button>
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => setGeogebraOpen(true)}
                        className="!p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
                        title="Open Graphing Calculator"
                      >
                        <LineChart className="!h-6 !w-6" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentProblem.problem_text && (
                    <div className="prose max-w-none dark:prose-invert mb-6 overflow-hidden break-words">
                      <MathContent content={currentProblem.problem_text} documentId={currentDocument?.document_id} />
                    </div>
                  )}
                  
                  {/* Answer input for main problem (only if no subproblems) */}
                  {subproblems.length === 0 && (
                    <div className="mt-4">
                      <textarea
                        className="w-full min-h-[100px] p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none overflow-hidden focus:outline-none"
                        placeholder="Type your answer here..."
                        value={answers['main'] || ''}
                        onChange={(e) => {
                          handleAnswerChange('main', e.target.value);
                          handleTextareaResize(e);
                        }}
                        onInput={handleTextareaResize}
                      />
                    </div>
                  )}
                  
                  {/* Subproblems inside main card */}
                  {subproblems.length > 0 && (
                    <div className="space-y-4">
                      {subproblems.map((subproblem) => (
                        <Card key={subproblem.id} className="w-full max-w-full border-0 shadow-none py-3 gap-0">
                          <CardContent className="px-0">
                            <div className="font-medium text-blue-600 dark:text-blue-400 mb-2 text-lg">
                              {subproblem.key}.
                            </div>
                            <div className="prose max-w-none dark:prose-invert overflow-hidden break-words">
                              <MathContent content={subproblem.problem_text || ''} documentId={currentDocument?.document_id} />
                            </div>
                            {/* Answer input for subproblem */}
                            <div className="mt-4">
                              <textarea
                                className="w-full min-h-[100px] p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none overflow-hidden focus:outline-none"
                                placeholder="Type your answer here..."
                                value={answers[`sub_${subproblem.key}`] || ''}
                                onChange={(e) => {
                                  handleAnswerChange(`sub_${subproblem.key}`, e.target.value);
                                  handleTextareaResize(e);
                                }}
                                onInput={handleTextareaResize}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white p-4 dark:bg-gray-900 h-[58px] flex flex-col justify-center flex-shrink-0">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={previousProblem}
              disabled={!canGoPrevious()}
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Problem {currentProblemIndex + 1} of {problemList.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextProblem}
              disabled={!canGoNext()}
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      </div>

      {/* Calculator Dialogs */}
      <ScientificCalculatorDialog open={scientificCalculatorOpen} onOpenChange={setScientificCalculatorOpen} />
      <GeoGebraDialog open={geogebraOpen} onOpenChange={setGeogebraOpen} />
    </div>
  );
}