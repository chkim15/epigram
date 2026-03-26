"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import ProblemsListView from "@/components/problems/ProblemsListView";
import CompanySidebar from "@/components/problems/CompanySidebar";
import { supabase } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface ProblemWithTopics {
  id: string;
  problem_name: string | null;
  difficulty: string | null;
  company_labels: string[] | null;
  problem_labels: string[] | null;
  problem_quant_topics: Array<{
    quant_topic_id: number;
    quant_topics: { name: string } | null;
  }>;
}

function ProblemsPageContent() {
  const { user, isAuthenticated, isLoading, showCheckoutSuccess, setShowCheckoutSuccess } = useAuthGuard();
  const [problems, setProblems] = useState<ProblemWithTopics[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedMainTopic, setSelectedMainTopic] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Fetch problems and completion data
  useEffect(() => {
    if (!isAuthenticated && !isLoading) return;

    async function fetchData() {
      try {
        setDataLoading(true);

        // Query 1: All included problems with topic joins
        const { data: problemsData, error: problemsError } = await supabase
          .from('problems')
          .select(`
            id, problem_name, difficulty, company_labels, problem_labels,
            problem_quant_topics(quant_topic_id, quant_topics(name))
          `)
          .eq('included', true)
          .order('problem_id');

        if (problemsError) throw problemsError;
        setProblems((problemsData as unknown as ProblemWithTopics[]) || []);

        // Query 2 & 3: User completed and bookmarked problems
        if (user) {
          const [{ data: completedData }, { data: bookmarkedData }] = await Promise.all([
            supabase
              .from('user_completed_problems')
              .select('problem_id')
              .eq('user_id', user.id),
            supabase
              .from('user_bookmarks')
              .select('problem_id')
              .eq('user_id', user.id),
          ]);

          if (completedData) {
            setCompletedIds(completedData.map((c: { problem_id: string }) => c.problem_id));
          }
          if (bookmarkedData) {
            setBookmarkedIds(bookmarkedData.map((b: { problem_id: string }) => b.problem_id));
          }
        }
      } catch (err) {
        console.error('Error fetching problems:', err);
      } finally {
        setDataLoading(false);
      }
    }

    fetchData();
  }, [user, isAuthenticated, isLoading]);

  // Derived data
  const completedSet = useMemo(() => new Set(completedIds), [completedIds]);
  const bookmarkedSet = useMemo(() => new Set(bookmarkedIds), [bookmarkedIds]);

  const toggleBookmark = async (problemId: string) => {
    if (!user) return;
    const isBookmarked = bookmarkedSet.has(problemId);
    if (isBookmarked) {
      setBookmarkedIds((prev) => prev.filter((id) => id !== problemId));
      await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('problem_id', problemId);
    } else {
      setBookmarkedIds((prev) => [...prev, problemId]);
      await supabase
        .from('user_bookmarks')
        .insert({ user_id: user.id, problem_id: problemId });
    }
  };

  const mainTopicTags = useMemo(() => {
    const allowedTopics = new Set([
      "Induction", "Logical Reasoning", "Symmetry", "Series", "Pigeon Principle",
      "Problem Simplification", "Modular Arithmetic", "Proof by Contradiction",
      "Calculus Methods", "Vector Geometry", "Determinant and Rank",
      "Eigenvalues and Eigenvectors", "Positive Semi-Definiteness (PSD)", "Quadratic Forms",
      "Counting", "Geometric Probability", "Combinatorial Probability",
      "Inclusion and Exclusion Principle", "Conditional Probability and Bayesian Law",
      "Expectation and Variance", "Covariance and Correlation", "Uniform Distribution",
      "Geometric Distribution", "Exponential Distribution", "Poisson Distribution",
      "(Multivariate) Gaussian Distributions", "Linearity of Expectations", "Order Statistics",
      "Max and Min", "Applications of Symmetry", "Markov Chain", "Martingale",
      "Random Walk", "Dynamical Programming", "Coin Flipping", "Dice Rolling",
      "Game Theory", "Sampling Distribution", "Bias-Variance", "Likelihood",
      "Bayesian Inference", "Law of Large Numbers (LLN)", "Central Limit Theorem (CLT)",
      "Rejection Sampling", "Uniform Sampling", "Hypothesis Testing", "Linear Regression",
      "Ridge and Lasso Regression", "Time Series Analysis", "Monte Carlo",
      "Information Theory", "Games", "Bidding", "Optimization", "Finance",
      "Approximation", "Paradox", "Factorials", "Number Theory", "Prime Number",
      "Permutations", "Combinations", "Harmonic Number", "Cards",
      "Binomial Distribution", "Bernoulli Distribution", "Sharpe Ratio",
      "Brain Teasers", "Recursion", "Matrix Algebra", "Binary Matrices",
      "Portfolio Optimization", "Inequalities (Estimate)", "Nash Equilibrium",
      "Optimal Strategy",
    ]);

    const counts = new Map<string, number>();
    for (const p of problems) {
      const seen = new Set<string>();
      for (const pt of p.problem_quant_topics || []) {
        const name = pt.quant_topics?.name;
        if (name && !seen.has(name) && allowedTopics.has(name)) {
          seen.add(name);
          counts.set(name, (counts.get(name) || 0) + 1);
        }
      }
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [problems]);

  const companyTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of problems) {
      if (p.company_labels) {
        for (const company of p.company_labels) {
          counts.set(company, (counts.get(company) || 0) + 1);
        }
      }
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [problems]);

  // Filtered problems
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      // Hide problems without a name
      if (!p.problem_name || p.problem_name.trim() === '') return false;

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.problem_name?.toLowerCase().includes(q)) return false;
      }

      // Difficulty filter
      if (selectedDifficulty && p.difficulty !== selectedDifficulty) return false;

      // Main topic filter
      if (selectedMainTopic) {
        const hasMatchingTopic = p.problem_quant_topics?.some(
          (pt) => pt.quant_topics?.name === selectedMainTopic
        );
        if (!hasMatchingTopic) return false;
      }

      // Company filter
      if (selectedCompany) {
        if (!p.company_labels?.includes(selectedCompany)) return false;
      }

      // Tag filter
      if (selectedTag) {
        if (!p.problem_labels?.includes(selectedTag)) return false;
      }

      // Status filter
      if (selectedStatus === 'completed') {
        if (!completedSet.has(p.id)) return false;
      } else if (selectedStatus === 'not_started') {
        if (completedSet.has(p.id)) return false;
      } else if (selectedStatus === 'bookmarked') {
        if (!bookmarkedSet.has(p.id)) return false;
      }

      return true;
    });
  }, [problems, searchQuery, selectedDifficulty, selectedMainTopic, selectedCompany, selectedTag, selectedStatus, completedSet, bookmarkedSet]);

  const solvedCount = useMemo(() => {
    return filteredProblems.filter((p) => completedSet.has(p.id)).length;
  }, [filteredProblems, completedSet]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#a16207' }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppShell
      showCheckoutSuccess={showCheckoutSuccess}
      onDismissCheckout={() => setShowCheckoutSuccess(false)}
    >
      {dataLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#a16207' }} />
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 overflow-hidden px-8 lg:px-16">
          <ProblemsListView
            problems={filteredProblems}
            completedSet={completedSet}
            mainTopicTags={mainTopicTags}
            totalCount={filteredProblems.length}
            solvedCount={solvedCount}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedDifficulty={selectedDifficulty}
            onDifficultyChange={setSelectedDifficulty}
            selectedMainTopic={selectedMainTopic}
            onMainTopicChange={setSelectedMainTopic}
            selectedTag={selectedTag}
            onTagChange={setSelectedTag}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            bookmarkedSet={bookmarkedSet}
            onToggleBookmark={toggleBookmark}
          />
          <CompanySidebar
            companyTags={companyTags}
            selectedCompany={selectedCompany}
            onSelectCompany={setSelectedCompany}
          />
        </div>
      )}
    </AppShell>
  );
}

export default function ProblemsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#a16207' }} />
      </div>
    }>
      <ProblemsPageContent />
    </Suspense>
  );
}
