"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CheckCircle, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { MathContent } from "@/lib/utils/katex";

interface ProblemRow {
  id: string;
  problem_name: string | null;
  difficulty: string | null;
}

interface TopicTag {
  name: string;
  count: number;
}

interface ProblemsListViewProps {
  problems: ProblemRow[];
  completedSet: Set<string>;
  mainTopicTags: TopicTag[];
  totalCount: number;
  solvedCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDifficulty: string | null;
  onDifficultyChange: (difficulty: string | null) => void;
  selectedMainTopic: string | null;
  onMainTopicChange: (topic: string | null) => void;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#10b981',
  medium: '#f59e0b',
  hard: '#ef4444',
  very_hard: '#ef4444',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  very_hard: 'Hard',
};

export default function ProblemsListView({
  problems,
  completedSet,
  mainTopicTags,
  totalCount,
  solvedCount,
  searchQuery,
  onSearchChange,
  selectedDifficulty,
  onDifficultyChange,
  selectedMainTopic,
  onMainTopicChange,
}: ProblemsListViewProps) {
  const router = useRouter();
  const [topicsExpanded, setTopicsExpanded] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
      {/* Course Card */}
      <div
        className="rounded-xl p-5 mb-5 w-fit"
        style={{ backgroundColor: 'var(--foreground)' }}
      >
        <p className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Featured Course
        </p>
        <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--background)' }}>
          4-Week Intensive Quant Interview Prep
        </h2>
        <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Probability, Stochastic Processes, Statistics, and Brain Teasers
        </p>
        <button
          onClick={() => router.push('/practice')}
          className="px-4 py-1.5 text-sm font-medium rounded-xl border cursor-pointer transition-opacity"
          style={{
            borderColor: 'rgba(255,255,255,0.3)',
            color: 'var(--background)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          Get Started
        </button>
      </div>

      {/* Topic Tags — expand/collapse */}
      <div className="mb-4">
        <div
          className="flex flex-wrap gap-2 overflow-hidden transition-all"
          style={{ maxHeight: topicsExpanded ? '1000px' : '72px' }}
        >
          <button
            onClick={() => onMainTopicChange(null)}
            className="px-3 py-1 text-sm rounded-full cursor-pointer transition-colors border"
            style={{
              backgroundColor: !selectedMainTopic ? 'var(--foreground)' : 'transparent',
              color: !selectedMainTopic ? 'var(--background)' : 'var(--muted-foreground)',
              borderColor: !selectedMainTopic ? 'var(--foreground)' : 'var(--border)',
            }}
            onMouseEnter={(e) => {
              if (selectedMainTopic) e.currentTarget.style.backgroundColor = 'var(--sidebar-accent)';
            }}
            onMouseLeave={(e) => {
              if (selectedMainTopic) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            All Topics
          </button>
          {mainTopicTags.map((tag) => {
            const isActive = selectedMainTopic === tag.name;
            return (
              <button
                key={tag.name}
                onClick={() => onMainTopicChange(isActive ? null : tag.name)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-sm rounded-full cursor-pointer transition-colors border"
                style={{
                  backgroundColor: isActive ? 'var(--foreground)' : 'transparent',
                  color: isActive ? 'var(--background)' : 'var(--muted-foreground)',
                  borderColor: isActive ? 'var(--foreground)' : 'var(--border)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'var(--sidebar-accent)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span>{tag.name}</span>
                <span
                  className="text-xs px-1.5 rounded-full"
                  style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--sidebar-accent)',
                    color: isActive ? 'var(--background)' : 'var(--muted-foreground)',
                  }}
                >
                  {tag.count}
                </span>
              </button>
            );
          })}
        </div>
        {mainTopicTags.length > 6 && (
          <button
            onClick={() => setTopicsExpanded(!topicsExpanded)}
            className="flex items-center gap-1 mt-2 text-xs cursor-pointer ml-auto"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {topicsExpanded ? (
              <>Show less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>Show more <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: 'var(--muted-foreground)' }}
          />
          <input
            type="text"
            placeholder="Search questions"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-sm rounded-xl border bg-white focus:outline-none"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--foreground)',
            }}
          />
        </div>

        {/* Difficulty Dropdown */}
        <select
          value={selectedDifficulty || ''}
          onChange={(e) => onDifficultyChange(e.target.value || null)}
          className="h-9 px-3 text-sm rounded-xl border bg-white cursor-pointer focus:outline-none"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
          }}
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        {/* Solved Count */}
        <div className="flex-shrink-0 ml-auto">
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            {solvedCount} / {totalCount} Solved
          </span>
        </div>
      </div>

      {/* Problems Table */}
      <div>
        {/* Header */}
        <div
          className="flex items-center py-2 px-2 text-xs font-medium uppercase tracking-wide border-b"
          style={{ color: 'var(--muted-foreground)', borderColor: 'var(--border)' }}
        >
          <div className="w-8" />
          <div className="flex-1">Title</div>
          <div className="w-20 text-right">Difficulty</div>
        </div>

        {/* Rows */}
        {problems.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              No problems found
            </p>
          </div>
        ) : (
          problems.map((problem) => {
            const isCompleted = completedSet.has(problem.id);
            const diffColor = DIFFICULTY_COLORS[problem.difficulty || ''] || 'var(--muted-foreground)';
            const diffLabel = DIFFICULTY_LABELS[problem.difficulty || ''] || problem.difficulty || '—';

            return (
              <div
                key={problem.id}
                onClick={() => router.push(`/problems/${problem.id}`)}
                className="flex items-center py-3 px-2 border-b cursor-pointer transition-colors"
                style={{ borderColor: 'var(--border)' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--sidebar-background)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {/* Status */}
                <div className="w-8 flex-shrink-0">
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" style={{ color: '#10b981' }} />
                  ) : (
                    <Circle className="h-4 w-4" style={{ color: 'var(--border)' }} />
                  )}
                </div>

                {/* Title */}
                <div className="flex-1 min-w-0 text-sm">
                  {problem.problem_name ? (
                    <MathContent content={problem.problem_name} />
                  ) : (
                    <span style={{ color: 'var(--foreground)' }}>
                      Untitled Problem
                    </span>
                  )}
                </div>

                {/* Difficulty */}
                <div className="w-20 text-right flex-shrink-0">
                  <span className="text-sm font-medium" style={{ color: diffColor }}>
                    {diffLabel}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
