"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Problem, Subproblem, Document, UserAnswer } from "@/types/database";
import { useProblemStore } from "@/stores/problemStore";
import { MathContent } from "@/lib/utils/katex";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Loader2,
  LineChart,
  Calculator,
  Lightbulb,
  ChevronDown,
  Bookmark,
  Check,
  Brain,
  FileText,
  AlertCircle,
  Shuffle,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import GeoGebraDialog from "@/components/geogebra/GeoGebraDialog";
import ScientificCalculatorDialog from "@/components/geogebra/ScientificCalculatorDialog";
import { useAuthStore } from "@/stores/authStore";

interface ProblemViewerProps {
  selectedTopicId: number | null;
  selectedTopicIds?: number[];
  selectedDifficulties?: string[];
  viewMode?: 'problems' | 'bookmarks';
  problemCount?: number;
  savedProblemIds?: string[];
}

export default function ProblemViewer({ selectedTopicId, selectedTopicIds = [], selectedDifficulties = [], viewMode = 'problems', problemCount = 10, savedProblemIds = [] }: ProblemViewerProps) {
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
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});
  const [submitted, setSubmitted] = useState<{ [key: string]: boolean }>({});
  const [previousAnswers, setPreviousAnswers] = useState<{ [key: string]: UserAnswer[] }>({});
  const [geogebraOpen, setGeogebraOpen] = useState(false);
  const [scientificCalculatorOpen, setScientificCalculatorOpen] = useState(false);
  const [expandedHints, setExpandedHints] = useState<{ [key: string]: boolean }>({});
  const [problemHints, setProblemHints] = useState<{ [key: string]: Array<{ id: string; hint_text: string; hint_order: number }> }>({});
  const [revealedHints, setRevealedHints] = useState<{ [key: string]: number }>({});
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedLoading, setCompletedLoading] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (viewMode === 'bookmarks') {
      fetchBookmarkedProblems();
    } else if (selectedTopicId !== null || selectedTopicIds.length > 0) {
      fetchAllProblems();
    } else {
      // Clear problems when no topic is selected
      setProblemList([]);
    }
  }, [selectedTopicId, selectedTopicIds, selectedDifficulties, viewMode, problemCount, savedProblemIds]);

  useEffect(() => {
    if (currentProblem) {
      console.log('Current problem changed:', {
        problemId: currentProblem.id,
        problemDocumentId: currentProblem.document_id,
        allDocumentsCount: allDocuments.length
      });
      
      fetchSubproblems(currentProblem.id);
      fetchHints(currentProblem.id);
      checkBookmarkStatus(currentProblem.id);
      checkCompletedStatus(currentProblem.id);
      fetchPreviousAnswers(currentProblem.id);
      
      // Clear state when problem changes
      setAnswers({});
      setExpandedHints({});
      setRevealedHints({});
      setSubmitted({});
      setPreviousAnswers({});
      
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
  }, [currentProblem, allDocuments, user]);

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
        // Practice mode: use saved problem IDs if available, otherwise filter and randomize
        if (savedProblemIds.length > 0) {
          // Use saved problem IDs - fetch specific problems in order
          const result = await supabase
            .from('problems')
            .select(`
              id, problem_id, document_id, problem_text, correct_answer, hint, solution_text,
              math_approach, reasoning_type, difficulty, importance,
              comment, version, created_at, updated_at, included
            `)
            .eq('included', true)
            .in('id', savedProblemIds);

          problemsData = result.data;
          problemsError = result.error;

          // Sort problems to match the saved order
          if (problemsData) {
            const problemMap = new Map(problemsData.map(p => [p.id, p]));
            problemsData = savedProblemIds
              .map(id => problemMap.get(id))
              .filter(p => p !== undefined) as Problem[];
          }
        } else {
          // Original behavior: filter by multiple topics and difficulties
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

          // For practice mode, we want to randomize and limit results
          const result = await query;

          problemsData = result.data;
          problemsError = result.error;

          // Clean up the data structure - remove the problem_topics array from each problem
          if (problemsData) {
            // Remove duplicates that might occur when a problem has multiple topics
            const uniqueProblems = new Map<string, Problem>();
            problemsData.forEach((problem: Problem & { problem_topics?: unknown }) => {
              const { problem_topics, ...cleanProblem } = problem;
              if (!uniqueProblems.has(cleanProblem.id)) {
                uniqueProblems.set(cleanProblem.id, cleanProblem);
              }
            });
            const uniqueProblemsArray = Array.from(uniqueProblems.values());

            // Randomize the problems
            for (let i = uniqueProblemsArray.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [uniqueProblemsArray[i], uniqueProblemsArray[j]] = [uniqueProblemsArray[j], uniqueProblemsArray[i]];
            }

            // Limit to the specified problem count
            problemsData = uniqueProblemsArray.slice(0, problemCount);
          }
        }
      } else if (selectedTopicId) {
        // Single topic selection from sidebar - show 3 random problems
        const result = await supabase
          .from('problems')
          .select(`
            id, problem_id, document_id, problem_text, correct_answer, hint, solution_text,
            math_approach, reasoning_type, difficulty, importance,
            comment, version, created_at, updated_at, included,
            problem_topics!inner(topic_id)
          `)
          .eq('included', true)
          .eq('problem_topics.topic_id', selectedTopicId);

        problemsData = result.data;
        problemsError = result.error;

        // Clean up the data structure and randomize
        if (problemsData) {
          // Remove the problem_topics array from each problem
          const cleanedProblems = problemsData.map((problem: Problem & { problem_topics?: unknown }) => {
            const { problem_topics, ...cleanProblem } = problem;
            return cleanProblem;
          });

          // Filter out hard and very hard difficulty problems (only keep easy and medium)
          const filteredProblems = cleanedProblems.filter((problem: Problem) =>
            problem.difficulty === 'easy' || problem.difficulty === 'medium' || !problem.difficulty
          );

          // Randomize the problems using Fisher-Yates shuffle
          const shuffled = [...filteredProblems];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }

          // Limit to 3 problems (or less if there are fewer than 3)
          problemsData = shuffled.slice(0, Math.min(3, shuffled.length));
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

  const fetchBookmarkedProblems = async () => {
    if (!user) {
      setProblemList([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching bookmarked problems for user:', user.id);
      
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
      }
      
      // Fetch bookmarked problems
      const { data: bookmarksData, error: bookmarksError } = await supabase
        .from('user_bookmarks')
        .select(`
          problem_id,
          created_at,
          problems (
            id, problem_id, document_id, problem_text, correct_answer, hint, solution_text,
            math_approach, reasoning_type, difficulty, importance,
            comment, version, created_at, updated_at, included
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (bookmarksError) throw bookmarksError;

      console.log(`Found ${bookmarksData?.length || 0} bookmarked problems`);

      const problems = bookmarksData?.map(b => b.problems).filter(Boolean).flat() || [];
      setProblemList(problems);
      
      // Set initial document based on first problem
      if (problems.length > 0 && documentsData && documentsData.length > 0) {
        const firstProblemDoc = documentsData.find(doc => doc.id === problems[0].document_id);
        if (firstProblemDoc) {
          setCurrentDocument(firstProblemDoc);
        }
      }
    } catch (err) {
      console.error('Error fetching bookmarked problems:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async (problemId: string) => {
    if (!user) {
      setIsBookmarked(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('problem_id', problemId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking bookmark status:', error);
      }
      
      setIsBookmarked(!!data);
    } catch (err) {
      console.error('Error checking bookmark status:', err);
      setIsBookmarked(false);
    }
  };

  const toggleBookmark = async () => {
    if (!user || !currentProblem) return;
    
    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('user_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('problem_id', currentProblem.id);

        if (error) throw error;
        setIsBookmarked(false);
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('user_bookmarks')
          .insert({
            user_id: user.id,
            problem_id: currentProblem.id
          });

        if (error) throw error;
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const checkCompletedStatus = async (problemId: string) => {
    if (!user) {
      setIsCompleted(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_completed_problems')
        .select('id')
        .eq('user_id', user.id)
        .eq('problem_id', problemId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking completed status:', error);
      }
      
      setIsCompleted(!!data);
    } catch (err) {
      console.error('Error checking completed status:', err);
      setIsCompleted(false);
    }
  };

  const toggleCompleted = async () => {
    if (!user || !currentProblem) return;
    
    setCompletedLoading(true);
    try {
      if (isCompleted) {
        // Remove completed status
        const { error } = await supabase
          .from('user_completed_problems')
          .delete()
          .eq('user_id', user.id)
          .eq('problem_id', currentProblem.id);

        if (error) throw error;
        setIsCompleted(false);
      } else {
        // Add completed status
        const { error } = await supabase
          .from('user_completed_problems')
          .insert({
            user_id: user.id,
            problem_id: currentProblem.id
          });

        if (error) throw error;
        setIsCompleted(true);
      }
    } catch (err) {
      console.error('Error toggling completed status:', err);
    } finally {
      setCompletedLoading(false);
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
      
      // Fetch hints for each subproblem
      if (data && data.length > 0) {
        for (const subproblem of data) {
          await fetchSubproblemHints(subproblem.id);
        }
      }
    } catch (err) {
      console.error('Error fetching subproblems:', err);
      setSubproblems([]);
    }
  };

  const fetchHints = async (problemId: string) => {
    try {
      const { data, error } = await supabase
        .from('hints')
        .select('id, hint_text, hint_order')
        .eq('problem_id', problemId)
        .order('hint_order');

      if (error) throw error;

      setProblemHints(prev => ({ ...prev, main: data || [] }));
    } catch (err) {
      console.error('Error fetching hints:', err);
    }
  };

  const fetchSubproblemHints = async (subproblemId: string) => {
    try {
      const { data, error } = await supabase
        .from('hints')
        .select('id, hint_text, hint_order')
        .eq('subproblem_id', subproblemId)
        .order('hint_order');

      if (error) throw error;

      setProblemHints(prev => ({ ...prev, [`sub_${subproblemId}`]: data || [] }));
    } catch (err) {
      console.error('Error fetching subproblem hints:', err);
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

  const fetchPreviousAnswers = async (problemId: string) => {
    if (!user) return;

    try {
      // Fetch previous answers for main problem
      const { data: mainAnswers, error: mainError } = await supabase
        .from('user_answers')
        .select('*')
        .eq('user_id', user.id)
        .eq('problem_id', problemId)
        .is('subproblem_id', null)
        .order('attempt_number', { ascending: false });

      if (!mainError && mainAnswers && mainAnswers.length > 0) {
        setPreviousAnswers(prev => ({ ...prev, main: mainAnswers }));
        // Set the latest answer as current
        setAnswers(prev => ({ ...prev, main: mainAnswers[0].answer_text }));
      }

      // Fetch previous answers for subproblems
      if (subproblems.length > 0) {
        for (const subproblem of subproblems) {
          const { data: subAnswers, error: subError } = await supabase
            .from('user_answers')
            .select('*')
            .eq('user_id', user.id)
            .eq('problem_id', problemId)
            .eq('subproblem_id', subproblem.id)
            .order('attempt_number', { ascending: false });

          if (!subError && subAnswers && subAnswers.length > 0) {
            setPreviousAnswers(prev => ({ ...prev, [`sub_${subproblem.key}`]: subAnswers }));
            // Set the latest answer as current
            setAnswers(prev => ({ ...prev, [`sub_${subproblem.key}`]: subAnswers[0].answer_text }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching previous answers:', err);
    }
  };

  const handleSubmitAnswer = async (key: string, subproblemId: string | null) => {
    if (!user || !currentProblem || !answers[key]?.trim()) return;

    setSubmitting(prev => ({ ...prev, [key]: true }));
    
    try {
      // Get the current attempt number
      const previousAttempts = previousAnswers[key] || [];
      const attemptNumber = previousAttempts.length + 1;

      // Submit the answer
      const { error } = await supabase
        .from('user_answers')
        .insert({
          user_id: user.id,
          problem_id: currentProblem.id,
          subproblem_id: subproblemId,
          answer_text: answers[key].trim(),
          attempt_number: attemptNumber
        });

      if (error) throw error;

      // Update state to show success
      setSubmitted(prev => ({ ...prev, [key]: true }));
      
      // Update previous answers
      const newAnswer: UserAnswer = {
        id: '', // Will be generated by database
        user_id: user.id,
        problem_id: currentProblem.id,
        subproblem_id: subproblemId,
        answer_text: answers[key].trim(),
        is_correct: null,
        attempt_number: attemptNumber,
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setPreviousAnswers(prev => ({
        ...prev,
        [key]: [newAnswer, ...(prev[key] || [])]
      }));

      // Reset submitted state after 2 seconds
      setTimeout(() => {
        setSubmitted(prev => ({ ...prev, [key]: false }));
      }, 2000);

      // Dispatch custom event to notify SolutionsTab about the submission
      window.dispatchEvent(new CustomEvent('answerSubmitted', { 
        detail: { problemId: currentProblem.id, key } 
      }));

    } catch (err) {
      console.error('Error submitting answer:', err);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(prev => ({ ...prev, [key]: false }));
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
      <div className="flex h-full flex-col min-h-0 px-2 py-2 bg-white dark:bg-gray-900">
        <div className="rounded-2xl overflow-hidden flex h-full flex-col">
          <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-gray-900 p-3 custom-scrollbar">
            {viewMode === 'bookmarks' ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Bookmark className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                    No Bookmarked Problems
                  </h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {user ? "Bookmark problems to access them here" : "Sign in to bookmark problems"}
                  </p>
                </div>
              </div>
            ) : selectedTopicId === null ? (
              <div className="max-w-5xl mx-auto px-6 pt-1.5 pb-6">
                <div className="flex items-center gap-3 mb-8">
                  <Image src="/epigram_logo.svg" alt="Epigram Logo" width={40} height={40} className="dark:invert" />
                  <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                    Epigram&apos;s Study Tips
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Brain className="h-5 w-5 text-blue-500" />
                      Work First, Check Later
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed ml-7">
                      Always attempt each problem on your own before looking at hints or solutions. Push your thinking as far as possible so you truly engage your brain.
                    </p>
                  </div>

                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-green-500" />
                      Use Handouts Strategically
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed ml-7">
                      If you&apos;re unsure about the concepts, consult the handouts while solving problems. They&apos;re placed side-by-side for quick reference.
                    </p>
                  </div>

                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      Learn From Mistakes
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed ml-7">
                      When you get a problem wrong, bookmark it and explicitly write down what step or idea you missed. Then use handouts, textbooks, or AI support to figure out why you made the mistake and how to avoid it next time.
                    </p>
                  </div>

                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Shuffle className="h-5 w-5 text-purple-500" />
                      Value Multiple Approaches
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed ml-7">
                      Pay close attention to problems that have more than one solution. These problems reveal important connections between different ideas and techniques.
                    </p>
                  </div>

                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Target className="h-5 w-5 text-red-500" />
                      Practice With Focus
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed ml-7">
                      Set aside dedicated time for concentrated practice. Avoid distractions so you can work deeply and retain more.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                    No Problems Found
                  </h3>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col min-h-0 px-2 py-2 bg-white dark:bg-gray-900">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex h-full flex-col">
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
                    <div className="ml-auto flex items-center gap-2">
                      <div className="relative inline-block group">
                        <Button
                          variant="outline"
                          size="default"
                          onClick={toggleCompleted}
                          disabled={!user || completedLoading}
                          className={cn(
                            "!p-1 rounded-lg transition-colors disabled:opacity-100",
                            user ? "cursor-pointer" : "cursor-default",
                            user && isCompleted 
                              ? "bg-green-600 text-white hover:bg-green-700 border-green-600" 
                              : user ? "hover:bg-gray-50 dark:hover:bg-gray-800" : ""
                          )}
                          style={{ pointerEvents: user && !completedLoading ? 'auto' : 'none' }}
                        >
                          <Check className="!h-6 !w-6" />
                        </Button>
                        <div className={cn(
                          "absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none whitespace-nowrap z-50",
                          user && "hidden"
                        )}>
                          Please sign in
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900 dark:border-t-gray-700" />
                        </div>
                        {user && (
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none whitespace-nowrap z-50">
                            {isCompleted ? "Mark as incomplete" : "Mark as complete"}
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900 dark:border-t-gray-700" />
                          </div>
                        )}
                      </div>
                      <div className="relative inline-block group">
                        <Button
                          variant="outline"
                          size="default"
                          onClick={toggleBookmark}
                          disabled={!user || bookmarkLoading}
                          className={cn(
                            "!p-1 rounded-lg transition-colors disabled:opacity-100",
                            user ? "cursor-pointer" : "cursor-default",
                            user && isBookmarked 
                              ? "text-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20" 
                              : user ? "hover:bg-gray-50 dark:hover:bg-gray-800" : ""
                          )}
                          style={{ pointerEvents: user && !bookmarkLoading ? 'auto' : 'none' }}
                        >
                          <Bookmark className={cn(
                            "!h-6 !w-6",
                            isBookmarked && "fill-current"
                          )} />
                        </Button>
                        <div className={cn(
                          "absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none whitespace-nowrap z-50",
                          user && "hidden"
                        )}>
                          Please sign in
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900 dark:border-t-gray-700" />
                        </div>
                        {user && (
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none whitespace-nowrap z-50">
                            {isBookmarked ? "Remove bookmark" : "Add bookmark"}
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900 dark:border-t-gray-700" />
                          </div>
                        )}
                      </div>
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
                  
                  {/* Progressive hints for main problem */}
                  {problemHints['main'] && problemHints['main'].length > 0 && subproblems.length === 0 && (
                    <div className="mb-4">
                      {problemHints['main'].map((hint, index) => {
                        const isRevealed = (revealedHints['main'] || 0) > index;
                        const canReveal = index === 0 || (revealedHints['main'] || 0) >= index;
                        
                        if (!isRevealed && !canReveal) return null;
                        
                        return (
                          <div key={hint.id} className="mb-2">
                            {!isRevealed ? (
                              <button
                                onClick={() => setRevealedHints(prev => ({ ...prev, main: (prev.main || 0) + 1 }))}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-yellow-700 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors cursor-pointer"
                              >
                                <Lightbulb className="h-4 w-4" />
                                <span>Show Hint {index + 1}</span>
                              </button>
                            ) : (
                              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-900/30">
                                <div className="prose max-w-none dark:prose-invert text-sm">
                                  <MathContent content={hint.hint_text} documentId={currentDocument?.document_id} />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Fallback for old hint field if no hints in new table */}
                  {currentProblem.hint && (!problemHints['main'] || problemHints['main'].length === 0) && subproblems.length === 0 && (
                    <div className="mb-4">
                      <button
                        onClick={() => setExpandedHints(prev => ({ ...prev, main: !prev.main }))}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-yellow-700 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors cursor-pointer"
                      >
                        <Lightbulb className="h-4 w-4" />
                        <span>Hint</span>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          expandedHints['main'] && "rotate-180"
                        )} />
                      </button>
                      {expandedHints['main'] && (
                        <div className="mt-2 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-900/30">
                          <div className="prose max-w-none dark:prose-invert text-sm">
                            <MathContent content={currentProblem.hint} documentId={currentDocument?.document_id} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Answer input for main problem (only if no subproblems) */}
                  {subproblems.length === 0 && (
                    <div className="mt-4 space-y-2" data-answer-section="main">
                      <textarea
                        className="w-full min-h-[66px] p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none overflow-hidden focus:outline-none"
                        placeholder="Type your answer here..."
                        value={answers['main'] || ''}
                        onChange={(e) => {
                          handleAnswerChange('main', e.target.value);
                          handleTextareaResize(e);
                        }}
                        onInput={handleTextareaResize}
                        disabled={submitting['main']}
                      />
                      <div className="flex items-center justify-between">
                        <div className="relative inline-block group">
                          <Button
                            onClick={() => handleSubmitAnswer('main', null)}
                            disabled={!answers['main']?.trim() || submitting['main'] || !user}
                            className="cursor-pointer rounded-xl"
                            size="sm"
                          >
                            {submitting['main'] ? (
                              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</>
                            ) : submitted['main'] ? (
                              <><Check className="h-4 w-4 mr-2" /> Submitted</>
                            ) : (
                              <>Submit</>
                            )}
                          </Button>
                          <div className={cn(
                            "absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none whitespace-nowrap z-50",
                            user && "hidden"
                          )}>
                            Please sign in
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900 dark:border-t-gray-700" />
                          </div>
                        </div>
                      </div>
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
                            
                            {/* Progressive hints for subproblem */}
                            {problemHints[`sub_${subproblem.id}`] && problemHints[`sub_${subproblem.id}`].length > 0 && (
                              <div className="mt-4">
                                {problemHints[`sub_${subproblem.id}`].map((hint, index) => {
                                  const hintKey = `sub_${subproblem.id}`;
                                  const isRevealed = (revealedHints[hintKey] || 0) > index;
                                  const canReveal = index === 0 || (revealedHints[hintKey] || 0) >= index;
                                  
                                  if (!isRevealed && !canReveal) return null;
                                  
                                  return (
                                    <div key={hint.id} className="mb-2">
                                      {!isRevealed ? (
                                        <button
                                          onClick={() => setRevealedHints(prev => ({ ...prev, [hintKey]: (prev[hintKey] || 0) + 1 }))}
                                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-yellow-700 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors cursor-pointer"
                                        >
                                          <Lightbulb className="h-4 w-4" />
                                          <span>Show Hint {index + 1}</span>
                                        </button>
                                      ) : (
                                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-900/30">
                                          <div className="prose max-w-none dark:prose-invert text-sm">
                                            <MathContent content={hint.hint_text} documentId={currentDocument?.document_id} />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            
                            {/* Fallback for old hint field if no hints in new table */}
                            {subproblem.hint && (!problemHints[`sub_${subproblem.id}`] || problemHints[`sub_${subproblem.id}`].length === 0) && (
                              <div className="mt-4">
                                <button
                                  onClick={() => setExpandedHints(prev => ({ ...prev, [`sub_${subproblem.key}`]: !prev[`sub_${subproblem.key}`] }))}
                                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-yellow-700 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors cursor-pointer"
                                >
                                  <Lightbulb className="h-4 w-4" />
                                  <span>Hint</span>
                                  <ChevronDown className={cn(
                                    "h-4 w-4 transition-transform",
                                    expandedHints[`sub_${subproblem.key}`] && "rotate-180"
                                  )} />
                                </button>
                                {expandedHints[`sub_${subproblem.key}`] && (
                                  <div className="mt-2 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-900/30">
                                    <div className="prose max-w-none dark:prose-invert text-sm">
                                      <MathContent content={subproblem.hint} documentId={currentDocument?.document_id} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Answer input for subproblem */}
                            <div className="mt-4 space-y-2" data-answer-section={`sub_${subproblem.key}`}>
                              <textarea
                                className="w-full min-h-[66px] p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none overflow-hidden focus:outline-none"
                                placeholder="Type your answer here..."
                                value={answers[`sub_${subproblem.key}`] || ''}
                                onChange={(e) => {
                                  handleAnswerChange(`sub_${subproblem.key}`, e.target.value);
                                  handleTextareaResize(e);
                                }}
                                onInput={handleTextareaResize}
                                disabled={submitting[`sub_${subproblem.key}`]}
                              />
                              <div className="flex items-center justify-between">
                                <div className="relative inline-block group">
                                  <Button
                                    onClick={() => handleSubmitAnswer(`sub_${subproblem.key}`, subproblem.id)}
                                    disabled={!answers[`sub_${subproblem.key}`]?.trim() || submitting[`sub_${subproblem.key}`] || !user}
                                    className="cursor-pointer rounded-xl"
                                    size="sm"
                                  >
                                    {submitting[`sub_${subproblem.key}`] ? (
                                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</>
                                    ) : submitted[`sub_${subproblem.key}`] ? (
                                      <><Check className="h-4 w-4 mr-2" /> Submitted</>
                                    ) : (
                                      <>Submit</>
                                    )}
                                  </Button>
                                  <div className={cn(
                                    "absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none whitespace-nowrap z-50",
                                    user && "hidden"
                                  )}>
                                    Please sign in
                                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900 dark:border-t-gray-700" />
                                  </div>
                                </div>
                              </div>
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
              className="cursor-pointer disabled:cursor-not-allowed rounded-xl"
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
              className="cursor-pointer disabled:cursor-not-allowed rounded-xl"
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