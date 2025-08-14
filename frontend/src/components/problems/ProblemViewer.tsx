"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Problem, Subproblem } from "@/types/database";
import { useProblemStore } from "@/stores/problemStore";
import { MathContent } from "@/lib/utils/katex";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  BookOpen,
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProblemViewerProps {}

export default function ProblemViewer({}: ProblemViewerProps) {
  const {
    currentProblem,
    currentProblemIndex,
    problemList,
    currentDocument,
    showHint,
    showSolution,
    isLoading,
    canGoNext,
    canGoPrevious,
    setProblemList,
    setCurrentDocument,
    nextProblem,
    previousProblem,
    toggleHint,
    toggleSolution,
    setLoading,
  } = useProblemStore();

  console.log('ProblemViewer state:', {
    currentProblem,
    currentProblemIndex,
    problemListLength: problemList.length,
    isLoading
  });

  const [subproblems, setSubproblems] = useState<Subproblem[]>([]);

  useEffect(() => {
    fetchAllProblems();
  }, []);

  useEffect(() => {
    if (currentProblem) {
      fetchSubproblems(currentProblem.id);
    }
  }, [currentProblem]);

  const fetchAllProblems = async () => {
    try {
      setLoading(true);
      console.log('Fetching problems from database...');
      
      // First get the document to find the document_id
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (documentsError) {
        console.error('Error fetching documents:', documentsError);
        throw documentsError;
      }

      console.log('Found documents:', documentsData);

      if (!documentsData || documentsData.length === 0) {
        console.log('No documents found');
        setProblemList([]);
        return;
      }

      // Use the first (most recent) document
      const document = documentsData[0];
      console.log('Using document:', document);
      
      // Set current document in store
      setCurrentDocument(document);

      // Fetch problems with topics using the same pattern as the editor
      const { data: problemsData, error: problemsError } = await supabase
        .from('problems')
        .select(`
          id, problem_id, document_id, problem_text, correct_answer, hint, solution_text,
          math_approach, reasoning_type, topic_id, difficulty, importance,
          comment, version, created_at, updated_at, topics:topic_id(subtopics, main_topics)
        `)
        .eq('document_id', document.id)
        .order('problem_id');

      console.log('Database response:', { problemsData, problemsError });

      if (problemsError) throw problemsError;

      console.log(`Found ${problemsData?.length || 0} problems`);
      setProblemList(problemsData || []);
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
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No Problems Found
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            The database appears to be empty. Please add some problems to the database first.
          </p>
          <Button onClick={fetchAllProblems} className="mt-4">
            Retry Loading
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col min-h-0">
      {/* Problem Content */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-white p-3">
        <div className="w-full space-y-6 min-w-0">
          {currentProblem && (
            <>
              {/* Main Problem */}
              <Card className="w-full">
                <CardHeader>
                  <CardTitle className="text-lg">Problem {currentProblemIndex + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentProblem.problem_text && (
                    <div className="prose max-w-none dark:prose-invert mb-6 overflow-hidden break-words">
                      <MathContent content={currentProblem.problem_text} documentId={currentDocument?.document_id} />
                    </div>
                  )}
                  
                  {/* Subproblems inside main card */}
                  {subproblems.length > 0 && (
                    <div className="space-y-4">
                      {subproblems.map((subproblem) => (
                        <Card key={subproblem.id} className="w-full max-w-full">
                          <CardContent className="pt-4">
                            <div className="font-medium text-blue-600 dark:text-blue-400 mb-2 text-lg">
                              {subproblem.key}.
                            </div>
                            <div className="prose max-w-none dark:prose-invert overflow-hidden break-words">
                              <MathContent content={subproblem.problem_text || ''} documentId={currentDocument?.document_id} />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Answer */}
              {currentProblem.correct_answer && (
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-600 dark:text-green-400">
                      Answer
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose max-w-none dark:prose-invert overflow-hidden break-words">
                      <MathContent content={currentProblem.correct_answer} documentId={currentDocument?.document_id} />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Solution Section */}
              {currentProblem.solution_text && (
                <Collapsible open={showSolution} onOpenChange={toggleSolution}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex items-center">
                        <BookOpen className="mr-2 h-4 w-4" />
                        View Solution
                      </span>
                      {showSolution ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Card className="mt-2 w-full">
                      <CardHeader>
                        <CardTitle className="text-lg text-blue-600 dark:text-blue-400">
                          Solution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="prose max-w-none dark:prose-invert overflow-hidden break-words">
                          <MathContent content={currentProblem.solution_text} documentId={currentDocument?.document_id} />
                        </div>
                      </CardContent>
                    </Card>
                  </CollapsibleContent>
                </Collapsible>
              )}
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
        {currentProblem?.difficulty && (
          <div className="flex justify-center mt-2">
            <Badge className={getDifficultyColor(currentProblem.difficulty)}>
              {currentProblem.difficulty.replace('_', ' ')}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}