import { create } from 'zustand';
import { Problem, Topic, Document } from '@/types/database';

interface ProblemStore {
  // Current state
  currentProblem: Problem | null;
  currentProblemIndex: number;
  problemList: Problem[];
  selectedTopicId: number | null;
  currentDocument: Document | null;
  
  // UI state
  showHint: boolean;
  showSolution: boolean;
  isLoading: boolean;
  
  // Actions
  setCurrentProblem: (problem: Problem) => void;
  setProblemList: (problems: Problem[]) => void;
  setCurrentDocument: (document: Document) => void;
  setSelectedTopicId: (topicId: number | null) => void;
  nextProblem: () => void;
  previousProblem: () => void;
  toggleHint: () => void;
  toggleSolution: () => void;
  setLoading: (loading: boolean) => void;
  
  // Computed
  canGoNext: () => boolean;
  canGoPrevious: () => boolean;
}

export const useProblemStore = create<ProblemStore>((set, get) => ({
  // Initial state
  currentProblem: null,
  currentProblemIndex: 0,
  problemList: [],
  selectedTopicId: null,
  currentDocument: null,
  showHint: false,
  showSolution: false,
  isLoading: false,

  // Actions
  setCurrentProblem: (problem) => {
    const { problemList } = get();
    const index = problemList.findIndex(p => p.id === problem.id);
    set({ 
      currentProblem: problem, 
      currentProblemIndex: Math.max(0, index),
      showHint: false,
      showSolution: false 
    });
  },

  setProblemList: (problems) => {
    set({ 
      problemList: problems,
      currentProblemIndex: 0,
      currentProblem: problems.length > 0 ? problems[0] : null,
      showHint: false,
      showSolution: false
    });
  },

  setCurrentDocument: (document) => {
    set({ currentDocument: document });
  },

  setSelectedTopicId: (topicId) => {
    set({ 
      selectedTopicId: topicId,
      problemList: [],
      currentProblem: null,
      currentProblemIndex: 0,
      showHint: false,
      showSolution: false
    });
  },

  nextProblem: () => {
    const { problemList, currentProblemIndex } = get();
    if (currentProblemIndex < problemList.length - 1) {
      const nextIndex = currentProblemIndex + 1;
      set({
        currentProblemIndex: nextIndex,
        currentProblem: problemList[nextIndex],
        showHint: false,
        showSolution: false
      });
    }
  },

  previousProblem: () => {
    const { problemList, currentProblemIndex } = get();
    if (currentProblemIndex > 0) {
      const prevIndex = currentProblemIndex - 1;
      set({
        currentProblemIndex: prevIndex,
        currentProblem: problemList[prevIndex],
        showHint: false,
        showSolution: false
      });
    }
  },

  toggleHint: () => set((state) => ({ showHint: !state.showHint })),
  
  toggleSolution: () => set((state) => ({ showSolution: !state.showSolution })),
  
  setLoading: (loading) => set({ isLoading: loading }),

  // Computed getters
  canGoNext: () => {
    const { problemList, currentProblemIndex } = get();
    return currentProblemIndex < problemList.length - 1;
  },

  canGoPrevious: () => {
    const { currentProblemIndex } = get();
    return currentProblemIndex > 0;
  },
}));