"use client";

import { useEffect, useState, useRef } from "react";
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
  Target,
  GraduationCap,
  Trophy,
  Sigma
} from "lucide-react";
import { cn } from "@/lib/utils";
import GeoGebraDialog from "@/components/geogebra/GeoGebraDialog";
import ScientificCalculatorDialog from "@/components/geogebra/ScientificCalculatorDialog";
import { useAuthStore } from "@/stores/authStore";

interface ProblemViewerProps {
  selectedTopicId: number | null;
  selectedTopicIds?: number[];
  selectedDifficulties?: string[];
  viewMode?: 'problems' | 'bookmarks' | 'recommended-problems';
  problemCount?: number;
  savedProblemIds?: string[];
  recommendedProblemIds?: string[];
}

interface MathFieldElement extends HTMLElement {
  value?: string;
  getValue?: () => string;
}

export default function ProblemViewer({ selectedTopicId, selectedTopicIds = [], selectedDifficulties = [], viewMode = 'problems', problemCount = 10, savedProblemIds = [], recommendedProblemIds = [] }: ProblemViewerProps) {
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


  const [subproblems, setSubproblems] = useState<Subproblem[]>([]);
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState<{ [key: string]: boolean }>({});
  const [submitted, setSubmitted] = useState<{ [key: string]: boolean }>({});
  const [previousAnswers, setPreviousAnswers] = useState<{ [key: string]: UserAnswer[] }>({});
  const [gradingFeedback, setGradingFeedback] = useState<{ [key: string]: { isCorrect: boolean; feedback?: string } }>({});
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
  const answerContentEditableRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Import MathLive when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('mathlive').then(({ MathfieldElement }) => {
        if (!customElements.get('math-field')) {
          try {
            customElements.define('math-field', MathfieldElement);
          } catch (err) {
            console.warn('MathLive already registered:', err);
          }
        }
      }).catch(err => {
        console.error('Failed to load MathLive:', err);
      });
    }
  }, []);

  // Simple effect for recommended problems
  useEffect(() => {
    if (viewMode === 'recommended-problems' && recommendedProblemIds.length > 0) {
      fetchRecommendedProblems();
    }
  }, [viewMode, recommendedProblemIds]);

  // Effect for other modes
  useEffect(() => {
    if (viewMode === 'recommended-problems') {
      // Handled by the effect above
      return;
    }

    const loadProblems = async () => {
      if (viewMode === 'bookmarks') {
        await fetchBookmarkedProblems();
      } else if (savedProblemIds.length > 0) {
        // For practice mode with saved problems
        await fetchAllProblems();
      } else if (selectedTopicId !== null || selectedTopicIds.length > 0) {
        // Topic-based browsing
        await fetchAllProblems();
      } else {
        // Clear problems when no topic is selected
        setProblemList([]);
      }
    };

    loadProblems();
  }, [selectedTopicId, selectedTopicIds, selectedDifficulties, viewMode, problemCount, savedProblemIds]);

  useEffect(() => {
    if (currentProblem) {
      
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
      setGradingFeedback({});

      // Clear contenteditable divs
      Object.keys(answerContentEditableRefs.current).forEach(key => {
        const element = answerContentEditableRefs.current[key];
        if (element) {
          element.innerHTML = '';
        }
      });
      
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

          // If we have no filters at all in practice mode, don't fetch anything
          if (selectedTopicIds.length === 0 && selectedDifficulties.length === 0) {
            console.log('No topics or difficulties selected in practice mode, skipping fetch');
            problemsData = [];
            problemsError = null;
            setProblemList([]);
            setLoading(false);
            return;
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
              const { problem_topics: _, ...cleanProblem } = problem;
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
            const { problem_topics: _, ...cleanProblem } = problem;
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

      if (problemsError) throw problemsError;

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

  const fetchRecommendedProblems = async () => {
    try {
      setLoading(true);

      // Fetch the specific recommended problems
      const { data: problemsData, error: problemsError } = await supabase
        .from('problems')
        .select(`
          id, problem_id, document_id, problem_text, correct_answer, hint, solution_text,
          math_approach, reasoning_type, difficulty, importance,
          comment, version, created_at, updated_at, included
        `)
        .eq('included', true)
        .in('id', recommendedProblemIds);

      if (problemsError) {
        console.error('Error fetching problems:', problemsError);
        throw problemsError;
      }

      // Sort problems to match the recommended order
      let sortedProblems = problemsData || [];
      if (sortedProblems.length > 0) {
        const problemMap = new Map(sortedProblems.map(p => [p.id, p]));
        sortedProblems = recommendedProblemIds
          .map(id => problemMap.get(id))
          .filter(p => p !== undefined) as Problem[];
      }

      // Fetch documents for these problems
      const { data: documentsData } = await supabase
        .from('documents')
        .select('*');

      if (documentsData) {
        setAllDocuments(documentsData);
      }

      setProblemList(sortedProblems);

      // Set initial document if available
      if (sortedProblems.length > 0 && documentsData && documentsData.length > 0) {
        const firstProblemDoc = documentsData.find(doc => doc.id === sortedProblems[0].document_id);
        if (firstProblemDoc) {
          setCurrentDocument(firstProblemDoc);
        }
      }
    } catch (error) {
      console.error('Error fetching recommended problems:', error);
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

  const handleAnswerFocus = (key: string) => {
    // Reset submitted state when user focuses on the input
    setSubmitted(prev => ({ ...prev, [key]: false }));
    // Also clear grading feedback for this field
    setGradingFeedback(prev => {
      const newFeedback = { ...prev };
      delete newFeedback[key];
      return newFeedback;
    });
  };

  const insertMathField = (key: string) => {
    const contentEditable = answerContentEditableRefs.current[key];
    if (!contentEditable) return;

    // Clean up any empty math fields first
    const existingMathFields = contentEditable.querySelectorAll('math-field');
    existingMathFields.forEach(field => {
      if (!field.getAttribute('value')) {
        field.remove();
      }
    });

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // If no selection, focus the contentEditable and place cursor at end
      contentEditable.focus();
      const range = document.createRange();
      range.selectNodeContents(contentEditable);
      range.collapse(false);
      const newSelection = window.getSelection();
      if (newSelection) {
        newSelection.removeAllRanges();
        newSelection.addRange(range);
      }
      return insertMathField(key); // Retry with the new selection
    }

    const range = selection.getRangeAt(0);

    // Check if the selection is within our contentEditable
    if (!contentEditable.contains(range.commonAncestorContainer)) {
      contentEditable.focus();
      const newRange = document.createRange();
      newRange.selectNodeContents(contentEditable);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
      return insertMathField(key); // Retry with the new selection
    }

    // Create a new math-field element
    const mathField = document.createElement('math-field');
    const uniqueId = Date.now();
    mathField.setAttribute('data-index', uniqueId.toString());
    mathField.style.display = 'inline-block';
    mathField.style.fontSize = 'inherit';
    mathField.setAttribute('value', '');

    // Disable virtual keyboard and menu
    mathField.setAttribute('virtual-keyboard-mode', 'off');
    mathField.setAttribute('menu', 'false');

    // Insert the math field at cursor position
    range.deleteContents();
    range.insertNode(mathField);

    // Add a space after the math field for better cursor placement
    const spaceAfter = document.createTextNode('\u00A0'); // Non-breaking space
    mathField.parentNode?.insertBefore(spaceAfter, mathField.nextSibling);

    // Move cursor after the space
    range.setStartAfter(spaceAfter);
    range.setEndAfter(spaceAfter);
    selection.removeAllRanges();
    selection.addRange(range);

    // Add event listeners to manage inactive class
    mathField.addEventListener('focus', () => {
      mathField.classList.remove('inactive');
    });

    mathField.addEventListener('blur', (e: FocusEvent) => {
      // Check if focus is moving to a related element (like dropdown menu)
      const relatedTarget = e.relatedTarget as HTMLElement;

      // If the related target is part of the math field or its UI, don't mark as inactive
      if (relatedTarget && (
        mathField.contains(relatedTarget) ||
        relatedTarget.closest('.ML__popover') ||
        relatedTarget.closest('[role="menu"]')
      )) {
        return;
      }

      // Add a delay to allow menu interactions
      setTimeout(() => {
        // Check if the math field or any popover has focus
        const activeElement = document.activeElement;
        const hasMenuOpen = document.querySelector('.ML__popover:not([style*="display: none"])');
        const hasDropdown = document.querySelector('[role="menu"]:not([style*="display: none"])');

        if (!mathField.contains(activeElement as Node) && !hasMenuOpen && !hasDropdown) {
          mathField.classList.add('inactive');

          // Clean up empty fields
          if (!mathField.getAttribute('value')) {
            mathField.remove();
          }
        }
      }, 150); // Slightly longer delay to ensure menu interactions complete
    });

    // Watch for menu interactions using MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if a menu was added to the DOM
          const hasMenu = document.querySelector('.ML__popover') || document.querySelector('[role="menu"]');
          if (hasMenu) {
            // Keep field active while menu is open
            mathField.classList.remove('inactive');
          }
        }
      });
    });

    // Observe changes to the body for menu additions
    observer.observe(document.body, { childList: true, subtree: true });

    // Store observer reference for cleanup
    const mathFieldWithObserver = mathField as HTMLElement & { __observer?: MutationObserver };
    mathFieldWithObserver.__observer = observer;

    // Focus the math field
    setTimeout(() => {
      mathField.focus();
    }, 0);

    // Trigger input event to update the value
    handleContentEditableChange(key, contentEditable);
  };

  const getContentEditableText = (element: HTMLDivElement): string => {
    let result = '';

    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        if (tagName === 'math-field') {
          const mathFieldElement = element as MathFieldElement;
          const latex = mathFieldElement.value || mathFieldElement.getValue?.() || element.getAttribute('value') || element.textContent || '';
          result += `$$${latex}$$`;
        } else if (tagName === 'br') {
          result += '\n';
        } else if (tagName === 'div' || tagName === 'p') {
          for (const child of Array.from(element.childNodes)) {
            processNode(child);
          }
          result += '\n';
        } else {
          for (const child of Array.from(element.childNodes)) {
            processNode(child);
          }
        }
      }
    };

    for (const child of Array.from(element.childNodes)) {
      processNode(child);
    }

    return result.trim();
  };

  const handleContentEditableChange = (key: string, element: HTMLDivElement) => {
    const text = getContentEditableText(element);
    handleAnswerChange(key, text);
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
        // Set contenteditable content
        const mainElement = answerContentEditableRefs.current['main'];
        if (mainElement) {
          mainElement.innerText = mainAnswers[0].answer_text;
        }
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
            // Set contenteditable content
            const subElement = answerContentEditableRefs.current[`sub_${subproblem.key}`];
            if (subElement) {
              subElement.innerText = subAnswers[0].answer_text;
            }
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
      const { data: insertData, error } = await supabase
        .from('user_answers')
        .insert({
          user_id: user.id,
          problem_id: currentProblem.id,
          subproblem_id: subproblemId,
          answer_text: answers[key].trim(),
          attempt_number: attemptNumber
        })
        .select()
        .single();

      if (error) throw error;

      // Get the correct answer for grading
      let correctAnswer: string | null = null;
      if (subproblemId) {
        // Find the subproblem's correct answer
        const subproblem = subproblems.find(sp => sp.id === subproblemId);
        correctAnswer = subproblem?.correct_answer || null;
        console.log('Subproblem correct answer:', correctAnswer);
      } else {
        // Use the main problem's correct answer
        correctAnswer = currentProblem.correct_answer;
        console.log('Main problem correct answer:', correctAnswer);
      }

      // Grade the answer if we have a correct answer
      let isCorrect: boolean | null = null;
      if (correctAnswer) {
        console.log('Grading answer:', { userAnswer: answers[key].trim(), correctAnswer });
        try {
          const gradeResponse = await fetch('/api/grade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userAnswer: answers[key].trim(),
              correctAnswer: correctAnswer,
              problemText: subproblemId
                ? subproblems.find(sp => sp.id === subproblemId)?.problem_text
                : currentProblem.problem_text
            })
          });

          console.log('Grade response status:', gradeResponse.status);
          if (gradeResponse.ok) {
            const gradeResult = await gradeResponse.json();
            console.log('Grade result:', gradeResult);
            isCorrect = gradeResult.isCorrect;

            // Update the is_correct field in the database
            const { error: updateError } = await supabase
              .from('user_answers')
              .update({ is_correct: isCorrect })
              .eq('id', insertData.id);

            if (updateError) {
              console.error('Error updating grading result:', updateError);
            } else {
              console.log('Successfully updated is_correct to:', isCorrect);
            }

            // Show feedback to user (keep it visible permanently)
            setGradingFeedback(prev => ({
              ...prev,
              [key]: {
                isCorrect: isCorrect === true,  // Convert null to false
                feedback: gradeResult.feedback || (isCorrect ? 'Correct!' : 'Incorrect')
              }
            }));
          } else {
            const errorText = await gradeResponse.text();
            console.error(`Grading API error (${gradeResponse.status}):`, errorText);
            // Continue without grading if API fails
          }
        } catch (gradeError) {
          console.error('Error grading answer:', gradeError);
          // Continue even if grading fails
        }
      } else {
        console.log('No correct answer found - skipping grading');
      }

      // Update state to show success
      setSubmitted(prev => ({ ...prev, [key]: true }));

      // Update previous answers with grading result
      const newAnswer: UserAnswer = {
        id: insertData.id,
        user_id: user.id,
        problem_id: currentProblem.id,
        subproblem_id: subproblemId,
        answer_text: answers[key].trim(),
        is_correct: isCorrect,
        attempt_number: attemptNumber,
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setPreviousAnswers(prev => ({
        ...prev,
        [key]: [newAnswer, ...(prev[key] || [])]
      }));

      // Don't reset submitted state - keep it until user interacts with input

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
      <div className="flex h-full flex-col min-h-0 px-2 py-2" style={{ backgroundColor: 'var(--background)' }}>
        <div className="rounded-xl overflow-hidden flex h-full flex-col">
          <div className="flex-1 overflow-y-auto min-h-0 p-3 custom-scrollbar" style={{ backgroundColor: 'var(--background)' }}>
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
              <div className="max-w-7xl mx-auto px-6 pt-1.5 pb-6">
                <div className="grid grid-cols-2 gap-8">
                  {/* Left Column - Interview Prep Tips */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <Image
                        src="/epigram_logo.svg"
                        alt="Epigram Logo"
                        width={40}
                        height={40}
                        style={{
                          filter: 'var(--logo-filter, none)'
                        }}
                      />
                      <h2 className="text-2xl font-extrabold" style={{ color: 'var(--epigram-text-color)' }}>
                        Interview Prep Tips
                      </h2>
                    </div>
                    <div className="space-y-4">
                      <div className="backdrop-blur-md rounded-xl p-4 border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                          <Brain className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                          Master the Fundamentals
                        </h3>
                        <p className="text-sm leading-relaxed ml-7" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                          Build a strong foundation in <span className="font-semibold">probability, statistics, and linear algebra</span>. Interviewers test core concepts repeatedly &mdash; make sure you can solve them quickly and accurately.
                        </p>
                      </div>

                      <div className="backdrop-blur-md rounded-xl p-4 border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                          <FileText className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                          Think Out Loud
                        </h3>
                        <p className="text-sm leading-relaxed ml-7" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                          In real interviews, <span className="font-semibold">explaining your reasoning</span> matters as much as the answer. Practice articulating your approach before jumping into calculations.
                        </p>
                      </div>

                      <div className="backdrop-blur-md rounded-xl p-4 border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                          <AlertCircle className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                          Learn From Mistakes
                        </h3>
                        <p className="text-sm leading-relaxed ml-7" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                          When you get a problem wrong, <span className="font-semibold">bookmark</span> it and identify the concept you missed. Quant interviews revisit the same patterns &mdash; understanding <span className="font-semibold">why</span> you erred is more valuable than memorizing answers.
                        </p>
                      </div>

                      <div className="backdrop-blur-md rounded-xl p-4 border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                          <Shuffle className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                          Value Multiple Approaches
                        </h3>
                        <p className="text-sm leading-relaxed ml-7" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                          Many quant problems can be solved via <span className="font-semibold">different methods</span> (combinatorial, algebraic, simulation). Knowing multiple approaches shows depth and flexibility.
                        </p>
                      </div>

                      <div className="backdrop-blur-md rounded-xl p-4 border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                          <Target className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                          Practice Under Pressure
                        </h3>
                        <p className="text-sm leading-relaxed ml-7" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                          Set a timer and simulate <span className="font-semibold">interview conditions</span>. Speed and accuracy under pressure are what separate strong candidates.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Interview Strategy */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="text-2xl font-extrabold pt-2" style={{ color: 'var(--foreground)' }}>
                        Interview Strategy
                      </h2>
                    </div>
                    <div className="space-y-4">
                      <div className="backdrop-blur-md rounded-xl p-4 border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                          <GraduationCap className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                          Quant Trading Interviews
                          <span className="text-sm font-normal" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                            (Phone, Superday, Final)
                          </span>
                        </h3>
                        <p className="text-sm leading-relaxed ml-7" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                          Focus on <span className="font-semibold">probability brainteasers</span>, <span className="font-semibold">expected value</span>, and <span className="font-semibold">mental math</span>. Start with easy and medium problems to build speed, then tackle hard problems for depth.
                        </p>
                      </div>
                      <div className="backdrop-blur-md rounded-xl p-4 border" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                          <Trophy className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                          Hedge Fund &amp; Prop Shop Interviews
                          <span className="text-sm font-normal" style={{ color: 'var(--foreground)', opacity: 0.6 }}>
                            (Quantitative Research)
                          </span>
                        </h3>
                        <p className="text-sm leading-relaxed ml-7" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                          Prioritize <span className="font-semibold">stochastic processes</span>, <span className="font-semibold">statistics</span>, and <span className="font-semibold">linear algebra</span> problems. These roles demand rigorous mathematical reasoning and the ability to derive results from first principles.
                        </p>
                      </div>
                    </div>
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
    <div className="flex h-full flex-col min-h-0 px-2 py-2" style={{ backgroundColor: 'var(--background)' }}>
      <div className="rounded-xl border overflow-hidden flex h-full flex-col" style={{ borderColor: 'var(--border)' }}>
      {/* Problem Content */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 custom-scrollbar" style={{ backgroundColor: 'var(--background)' }}>
        <div className="w-full space-y-6 min-w-0">
          {currentProblem && (
            <>
              {/* Main Problem */}
              <Card className="w-full border-0 shadow-none" style={{ backgroundColor: 'transparent' }}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span>Problem {currentProblemIndex + 1}</span>
                    <span className="text-xs font-normal" style={{ color: 'var(--background)' }}>({currentProblem.problem_id})</span>
                    <div className="ml-auto flex items-center gap-2">
                      <div className="relative inline-block group">
                        <Button
                          variant="outline"
                          size="default"
                          onClick={toggleCompleted}
                          disabled={!user || completedLoading}
                          className={cn(
                            "!p-1 rounded-xl transition-colors disabled:opacity-100",
                            user ? "cursor-pointer" : "cursor-default"
                          )}
                          style={{
                            backgroundColor: user && isCompleted ? '#4a7c59' : 'var(--background)',
                            borderColor: user && isCompleted ? '#4a7c59' : 'var(--border)',
                            color: user && isCompleted ? 'white' : 'var(--foreground)',
                            pointerEvents: user && !completedLoading ? 'auto' : 'none'
                          }}
                          onMouseEnter={(e) => {
                            if (user && !completedLoading) {
                              e.currentTarget.style.backgroundColor = user && isCompleted ? '#3d6847' : 'var(--secondary)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (user && !completedLoading) {
                              e.currentTarget.style.backgroundColor = user && isCompleted ? '#4a7c59' : 'var(--background)';
                            }
                          }}
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
                            "!p-1 rounded-xl transition-colors disabled:opacity-100",
                            user ? "cursor-pointer" : "cursor-default"
                          )}
                          style={{
                            pointerEvents: user && !bookmarkLoading ? 'auto' : 'none',
                            backgroundColor: 'var(--background)',
                            borderColor: 'var(--border)',
                            color: user && isBookmarked ? '#eab308' : 'var(--foreground)'
                          }}
                          onMouseEnter={(e) => {
                            if (user && !bookmarkLoading) {
                              e.currentTarget.style.backgroundColor = 'var(--secondary)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (user && !bookmarkLoading) {
                              e.currentTarget.style.backgroundColor = 'var(--background)';
                            }
                          }}
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
                      </div>
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => setScientificCalculatorOpen(true)}
                        className="!p-1 cursor-pointer rounded-xl"
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
                        title="Open Scientific Calculator"
                      >
                        <Calculator className="!h-6 !w-6" />
                      </Button>
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => setGeogebraOpen(true)}
                        className="!p-1 cursor-pointer rounded-xl"
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
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors cursor-pointer border rounded-xl"
                                style={{
                                  borderColor: 'var(--primary)',
                                  color: 'var(--primary)',
                                  backgroundColor: 'var(--background)',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--secondary)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--background)';
                                }}
                              >
                                <Lightbulb className="h-4 w-4" />
                                <span>Show Hint {index + 1}</span>
                              </button>
                            ) : (
                              <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--primary)', backgroundColor: 'var(--card)' }}>
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
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-xl border"
                        style={{
                          borderColor: 'var(--primary)',
                          color: 'var(--primary)',
                          backgroundColor: 'var(--background)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--secondary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'var(--background)';
                        }}
                      >
                        <Lightbulb className="h-4 w-4" />
                        <span>Hint</span>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform",
                          expandedHints['main'] && "rotate-180"
                        )} />
                      </button>
                      {expandedHints['main'] && (
                        <div className="mt-2 p-4 rounded-xl border" style={{ borderColor: 'var(--primary)', backgroundColor: 'var(--card)' }}>
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
                      <div className="flex gap-2 items-start">
                        <div className="flex-1 flex items-center gap-2 rounded-2xl border px-2" style={{ backgroundColor: 'var(--input)', borderColor: 'var(--border)' }}>
                          <button
                            className="h-8 w-10 rounded-xl border cursor-pointer flex items-center justify-center flex-shrink-0"
                            aria-label="Insert math equation"
                            onClick={() => insertMathField('main')}
                            style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                          >
                            <Sigma className="h-5 w-5" aria-hidden="true" style={{ color: 'var(--foreground)' }} />
                          </button>
                          <div
                            ref={(el) => { answerContentEditableRefs.current['main'] = el; }}
                            contentEditable={!submitting['main']}
                            className="flex-1 min-h-[50px] max-h-[150px] overflow-y-auto py-3 px-2 outline-none bg-transparent custom-scrollbar"
                            style={{
                              color: 'var(--foreground)',
                              minHeight: '50px',
                              maxHeight: '150px',
                              outline: 'none',
                              boxShadow: 'none',
                              fontSize: '16px',
                              lineHeight: '24px'
                            }}
                            data-placeholder="Type your answer here..."
                            onInput={(e) => handleContentEditableChange('main', e.currentTarget)}
                            onFocus={() => handleAnswerFocus('main')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (answers['main']?.trim() && !submitting['main'] && user) {
                                  handleSubmitAnswer('main', null);
                                }
                              }
                            }}
                            suppressContentEditableWarning={true}
                          />
                        </div>
                        <div className="relative inline-block group">
                          <Button
                            onClick={() => handleSubmitAnswer('main', null)}
                            disabled={!answers['main']?.trim() || submitting['main'] || !user}
                            className="cursor-pointer rounded-xl h-[50px] px-4"
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
                      {gradingFeedback['main'] && (
                        <div className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium animate-in fade-in duration-300 font-sans"
                        )}
                        style={{
                          backgroundColor: gradingFeedback['main'].isCorrect ? '#4a7c59' : '#a0442c',
                          color: 'white',
                          fontFamily: 'Inter, sans-serif'
                        }}>
                          {gradingFeedback['main'].isCorrect ? (
                            <Check className="h-4 w-4 flex-shrink-0" />
                          ) : (
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          )}
                          <span>{gradingFeedback['main'].feedback}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Subproblems inside main card */}
                  {subproblems.length > 0 && (
                    <div className="space-y-4">
                      {subproblems.map((subproblem) => (
                        <Card key={subproblem.id} className="w-full max-w-full shadow-none py-3 gap-0 border-0 rounded-xl" style={{ backgroundColor: 'var(--background)' }}>
                          <CardContent className="px-0">
                            <div className="font-medium mb-2 text-lg" style={{ color: 'var(--primary)' }}>
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
                                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors cursor-pointer border rounded-xl"
                                          style={{
                                            borderColor: 'var(--primary)',
                                            color: 'var(--primary)',
                                            backgroundColor: 'var(--background)',
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--secondary)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor = 'var(--background)';
                                          }}
                                        >
                                          <Lightbulb className="h-4 w-4" />
                                          <span>Show Hint {index + 1}</span>
                                        </button>
                                      ) : (
                                        <div className="p-4 rounded-xl border" style={{ borderColor: 'var(--primary)', backgroundColor: 'var(--card)' }}>
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
                                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors cursor-pointer rounded-xl border"
                                  style={{
                                    borderColor: 'var(--primary)',
                                    color: 'var(--primary)',
                                    backgroundColor: 'var(--background)',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--secondary)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--background)';
                                  }}
                                >
                                  <Lightbulb className="h-4 w-4" />
                                  <span>Hint</span>
                                  <ChevronDown className={cn(
                                    "h-4 w-4 transition-transform",
                                    expandedHints[`sub_${subproblem.key}`] && "rotate-180"
                                  )} />
                                </button>
                                {expandedHints[`sub_${subproblem.key}`] && (
                                  <div className="mt-2 p-4 rounded-xl border" style={{ borderColor: 'var(--primary)', backgroundColor: 'var(--card)' }}>
                                    <div className="prose max-w-none dark:prose-invert text-sm">
                                      <MathContent content={subproblem.hint} documentId={currentDocument?.document_id} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Answer input for subproblem */}
                            <div className="mt-4 space-y-2" data-answer-section={`sub_${subproblem.key}`}>
                              <div className="flex gap-2 items-start">
                                <div className="flex-1 flex items-center gap-2 rounded-2xl border px-2" style={{ backgroundColor: 'var(--input)', borderColor: 'var(--border)' }}>
                                  <button
                                    className="h-8 w-10 rounded-xl border cursor-pointer flex items-center justify-center flex-shrink-0"
                                    aria-label="Insert math equation"
                                    onClick={() => insertMathField(`sub_${subproblem.key}`)}
                                    style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                                  >
                                    <Sigma className="h-5 w-5" aria-hidden="true" style={{ color: 'var(--foreground)' }} />
                                  </button>
                                  <div
                                    ref={(el) => { answerContentEditableRefs.current[`sub_${subproblem.key}`] = el; }}
                                    contentEditable={!submitting[`sub_${subproblem.key}`]}
                                    className="flex-1 min-h-[50px] max-h-[150px] overflow-y-auto py-3 px-2 outline-none bg-transparent custom-scrollbar"
                                    style={{
                                      color: 'var(--foreground)',
                                      minHeight: '50px',
                                      maxHeight: '150px',
                                      outline: 'none',
                                      boxShadow: 'none',
                                      fontSize: '16px',
                                      lineHeight: '24px'
                                    }}
                                    data-placeholder="Type your answer here..."
                                    onInput={(e) => handleContentEditableChange(`sub_${subproblem.key}`, e.currentTarget)}
                                    onFocus={() => handleAnswerFocus(`sub_${subproblem.key}`)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (answers[`sub_${subproblem.key}`]?.trim() && !submitting[`sub_${subproblem.key}`] && user) {
                                          handleSubmitAnswer(`sub_${subproblem.key}`, subproblem.id);
                                        }
                                      }
                                    }}
                                    suppressContentEditableWarning={true}
                                  />
                                </div>
                                <div className="relative inline-block group">
                                  <Button
                                    onClick={() => handleSubmitAnswer(`sub_${subproblem.key}`, subproblem.id)}
                                    disabled={!answers[`sub_${subproblem.key}`]?.trim() || submitting[`sub_${subproblem.key}`] || !user}
                                    className="cursor-pointer rounded-xl h-[50px] px-4"
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
                              {gradingFeedback[`sub_${subproblem.key}`] && (
                                <div className={cn(
                                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium animate-in fade-in duration-300 font-sans"
                                )}
                                style={{
                                  backgroundColor: gradingFeedback[`sub_${subproblem.key}`].isCorrect ? '#4a7c59' : '#a0442c',
                                  color: 'white',
                                  fontFamily: 'Inter, sans-serif'
                                }}>
                                  {gradingFeedback[`sub_${subproblem.key}`].isCorrect ? (
                                    <Check className="h-4 w-4 flex-shrink-0" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                  )}
                                  <span>{gradingFeedback[`sub_${subproblem.key}`].feedback}</span>
                                </div>
                              )}
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
      <div className="p-4 h-[58px] flex flex-col justify-center flex-shrink-0" style={{ backgroundColor: 'var(--background)' }}>
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={previousProblem}
              disabled={!canGoPrevious()}
              className="cursor-pointer disabled:cursor-not-allowed rounded-xl"
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Problem {currentProblemIndex + 1} of {problemList.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={nextProblem}
              disabled={!canGoNext()}
              className="cursor-pointer disabled:cursor-not-allowed rounded-xl"
              style={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
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