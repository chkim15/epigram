import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { QuantTopic } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Play,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import ProGate from "@/components/subscription/ProGate";

type Difficulty = 'easy' | 'medium' | 'hard' | 'very_hard';

interface PracticeSession {
  id: string;
  user_id?: string;
  name: string;
  topic_ids: number[];
  difficulties: string[];
  problem_count?: number;
  problem_ids?: string[];
  created_at: string;
  updated_at?: string;
}

interface CreatePracticeProps {
  onStartPractice: (topicIds: number[], difficulties: string[], source?: string, count?: number, problemIds?: string[]) => void;
}

export default function CreatePractice({ onStartPractice }: CreatePracticeProps) {
  const [quantTopics, setQuantTopics] = useState<QuantTopic[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  // Difficulty filtering
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<Difficulty>>(
    new Set(['easy', 'medium', 'hard', 'very_hard'])
  );

  // Practice sessions
  const [practiceSessions, setPracticeSessions] = useState<PracticeSession[]>([]);
  const [sessionName, setSessionName] = useState<string>('');

  // Problem filters and count
  const [excludeBookmarked, setExcludeBookmarked] = useState<boolean>(false);
  const [excludeCompleted, setExcludeCompleted] = useState<boolean>(false);
  const [problemCount, setProblemCount] = useState<number>(10);
  const [availableQuestions, setAvailableQuestions] = useState<number>(0);

  useEffect(() => {
    fetchQuantTopics();
    if (user) {
      loadSessions();
    } else {
      setPracticeSessions([]);
    }
  }, [user]);

  useEffect(() => {
    const sessionCount = practiceSessions.length + 1;
    setSessionName(`Practice ${sessionCount}`);
  }, [practiceSessions.length]);

  const loadSessions = async () => {
    if (!user) {
      setPracticeSessions([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_practice_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPracticeSessions(data || []);
    } catch (err) {
      console.error('Error loading sessions:', err);
      const stored = localStorage.getItem('practiceSessions');
      if (stored) {
        try {
          const sessions = JSON.parse(stored);
          const migratedSessions = sessions.map((s: {
            topicIds?: number[];
            topic_ids?: number[];
            createdAt?: string;
            created_at?: string;
            [key: string]: unknown;
          }) => ({
            ...s,
            topic_ids: s.topicIds || s.topic_ids,
            created_at: s.createdAt || s.created_at
          }));
          setPracticeSessions(migratedSessions);
          if (user) {
            localStorage.removeItem('practiceSessions');
          }
        } catch (e) {
          console.error('Error parsing stored sessions:', e);
        }
      }
    }
  };

  const saveSession = async (session: Omit<PracticeSession, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) return null;

    try {
      const insertData: {
        user_id: string;
        name: string;
        topic_ids: number[];
        difficulties: string[];
        problem_count?: number;
        problem_ids?: string[];
      } = {
        user_id: user.id,
        name: session.name,
        topic_ids: session.topic_ids,
        difficulties: session.difficulties
      };

      if (session.problem_count !== undefined) {
        insertData.problem_count = session.problem_count;
      }

      if (session.problem_ids !== undefined) {
        insertData.problem_ids = session.problem_ids;
      }

      const { data, error } = await supabase
        .from('user_practice_sessions')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error saving session:', err);
      return null;
    }
  };

  const fetchQuantTopics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('quant_topics')
        .select('*')
        .order('id');

      if (error) throw error;

      setQuantTopics(data || []);
    } catch (err) {
      console.error('Error fetching quant topics:', err);
      setError('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const toggleTopicSelection = (topicId: number) => {
    setSelectedTopicIds(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const selectAllTopics = () => {
    if (selectedTopicIds.size === quantTopics.length) {
      setSelectedTopicIds(new Set());
    } else {
      setSelectedTopicIds(new Set(quantTopics.map(t => t.id)));
    }
  };

  const toggleDifficulty = (difficulty: Difficulty) => {
    const newDifficulties = new Set(selectedDifficulties);
    if (newDifficulties.has(difficulty)) {
      newDifficulties.delete(difficulty);
    } else {
      newDifficulties.add(difficulty);
    }
    setSelectedDifficulties(newDifficulties);
  };

  // Update available questions when selections change
  useEffect(() => {
    const calculateAvailableQuestions = async () => {
      const topicIds = Array.from(selectedTopicIds);
      const difficulties = Array.from(selectedDifficulties);

      if (topicIds.length === 0 || difficulties.length === 0) {
        setAvailableQuestions(0);
        return;
      }

      try {
        let query = supabase
          .from('problems')
          .select('id', { count: 'exact', head: true })
          .in('difficulty', difficulties)
          .eq('included', true);

        // Add topic filter using problem_quant_topics junction table
        if (topicIds.length > 0) {
          const { data: problemIds } = await supabase
            .from('problem_quant_topics')
            .select('problem_id')
            .in('quant_topic_id', topicIds);

          if (problemIds) {
            const uniqueProblemIds = [...new Set(problemIds.map(p => p.problem_id))];
            query = query.in('id', uniqueProblemIds);
          }
        }

        // Apply exclusion filters
        if (user) {
          const excludeIds: string[] = [];

          if (excludeBookmarked) {
            const { data: bookmarks } = await supabase
              .from('user_bookmarks')
              .select('problem_id')
              .eq('user_id', user.id);

            if (bookmarks && bookmarks.length > 0) {
              excludeIds.push(...bookmarks.map(b => b.problem_id));
            }
          }

          if (excludeCompleted) {
            const { data: completed } = await supabase
              .from('user_completed_problems')
              .select('problem_id')
              .eq('user_id', user.id);

            if (completed && completed.length > 0) {
              const completedIds = completed.map(c => c.problem_id);
              completedIds.forEach(id => {
                if (!excludeIds.includes(id)) {
                  excludeIds.push(id);
                }
              });
            }
          }

          if (excludeIds.length > 0) {
            query = query.filter('id', 'not.in', `(${excludeIds.join(',')})`);
          }
        }

        const { count } = await query;
        setAvailableQuestions(count || 0);
      } catch (err) {
        console.error('Error calculating available questions:', err);
        setAvailableQuestions(0);
      }
    };

    calculateAvailableQuestions();
  }, [Array.from(selectedTopicIds).join(','), selectedDifficulties, excludeBookmarked, excludeCompleted, user]);

  const generateProblemList = async (topicIds: number[], difficulties: string[], count: number): Promise<string[]> => {
    try {
      let query = supabase
        .from('problems')
        .select('id')
        .eq('included', true);

      // Add topic filter using problem_quant_topics junction table
      if (topicIds.length > 0) {
        const { data: problemIds } = await supabase
          .from('problem_quant_topics')
          .select('problem_id')
          .in('quant_topic_id', topicIds);

        if (problemIds) {
          const uniqueProblemIds = [...new Set(problemIds.map(p => p.problem_id))];
          query = query.in('id', uniqueProblemIds);
        }
      }

      if (difficulties.length > 0) {
        query = query.in('difficulty', difficulties);
      }

      if (user) {
        const excludeIds: string[] = [];

        if (excludeBookmarked) {
          const { data: bookmarks } = await supabase
            .from('user_bookmarks')
            .select('problem_id')
            .eq('user_id', user.id);

          if (bookmarks && bookmarks.length > 0) {
            excludeIds.push(...bookmarks.map(b => b.problem_id));
          }
        }

        if (excludeCompleted) {
          const { data: completed } = await supabase
            .from('user_completed_problems')
            .select('problem_id')
            .eq('user_id', user.id);

          if (completed && completed.length > 0) {
            const completedIds = completed.map(c => c.problem_id);
            completedIds.forEach(id => {
              if (!excludeIds.includes(id)) {
                excludeIds.push(id);
              }
            });
          }
        }

        if (excludeIds.length > 0) {
          query = query.filter('id', 'not.in', `(${excludeIds.join(',')})`);
        }
      }

      const result = await query;

      if (result.data) {
        const problemIds = [...result.data.map(p => p.id)];
        for (let i = problemIds.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [problemIds[i], problemIds[j]] = [problemIds[j], problemIds[i]];
        }
        return problemIds.slice(0, count);
      }

      return [];
    } catch (error) {
      console.error('Error generating problem list:', error);
      return [];
    }
  };

  const handleStartPractice = async () => {
    const topicIds = Array.from(selectedTopicIds);
    const difficulties = Array.from(selectedDifficulties);

    if (!user) {
      alert('Please sign in to start a practice session');
      return;
    }

    if (topicIds.length === 0) {
      alert('Please select at least one topic');
      return;
    }

    if (difficulties.length === 0) {
      alert('Please select at least one difficulty level');
      return;
    }

    const problemIds = await generateProblemList(topicIds, difficulties, problemCount);

    if (problemIds.length === 0) {
      alert('No problems found matching your criteria. Please adjust your filters.');
      return;
    }

    const savedSession = await saveSession({
      name: sessionName,
      topic_ids: topicIds,
      difficulties,
      problem_count: problemCount,
      problem_ids: problemIds
    });

    if (savedSession) {
      setPracticeSessions([savedSession, ...practiceSessions]);
    }

    const source = 'all';
    onStartPractice(topicIds, difficulties, source, problemCount);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_practice_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setPracticeSessions(practiceSessions.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error('Error deleting session:', err);
    }
  };

  const handleLoadSession = (session: PracticeSession) => {
    if (!user) {
      alert('Please sign in to load a practice session');
      return;
    }
    const topicIds = session.topic_ids || (session as {topicIds?: number[]}).topicIds || [];
    const difficulties = session.difficulties || [];
    const sessionProblemCount = session.problem_count || 10;

    if (session.problem_ids && session.problem_ids.length > 0) {
      onStartPractice(topicIds, difficulties, 'saved', sessionProblemCount, session.problem_ids);
    } else {
      onStartPractice(topicIds, difficulties, 'all', sessionProblemCount);
    }
  };

  const getDifficultyLabel = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'easy': return 'Easy';
      case 'medium': return 'Medium';
      case 'hard': return 'Hard';
      case 'very_hard': return 'Very Hard';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" style={{ color: 'var(--primary)' }} />
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading topics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p style={{ color: 'var(--destructive)' }}>{error}</p>
          <Button onClick={fetchQuantTopics} className="mt-4 cursor-pointer">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full" style={{ backgroundColor: 'var(--background)' }}>
      {/* Left sidebar - Practice Sessions List */}
      <div className="w-64 border-r p-4 overflow-y-auto custom-scrollbar" style={{ borderColor: 'var(--border)' }}>
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Saved Sessions</h3>
          <div>
            {!user ? (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Sign in to save and load practice sessions
              </p>
            ) : practiceSessions.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                No saved sessions yet. Create your first practice session!
              </p>
            ) : (
              <div className="space-y-2">
                {practiceSessions.map(session => (
                  <div
                    key={session.id}
                    className="p-3 border rounded-xl transition-colors"
                    style={{
                      backgroundColor: 'var(--background)',
                      borderColor: 'var(--border)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--secondary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--background)';
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{session.name}</h4>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
                          {session.problem_count
                            ? `${session.problem_count} problems`
                            : `${(session.topic_ids || (session as {topicIds?: number[]}).topicIds || []).length} topics, ${session.difficulties.length} difficulties`
                          }
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)', opacity: 0.7 }}>
                          {new Date(session.created_at || (session as {createdAt?: string}).createdAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <div className="relative group">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8",
                              user ? "cursor-pointer" : "cursor-default disabled:opacity-100"
                            )}
                            onClick={() => handleLoadSession(session)}
                            disabled={!user}
                            style={{ pointerEvents: user ? 'auto' : 'none' }}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          {!user && (
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none whitespace-nowrap z-50" style={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', border: '1px solid var(--border)' }}>
                              Please sign in
                              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4" style={{ borderTopColor: 'var(--border)' }} />
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 cursor-pointer"
                          style={{ color: 'var(--muted-foreground)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--destructive)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Main content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-6 pl-6 pr-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Create Your Own Practice
          </h1>
          <p style={{ color: 'var(--muted-foreground)' }}>
            Select topics and difficulty levels to create a custom practice session
          </p>
        </div>

        <div className="grid grid-cols-[60%_40%] gap-4 h-full">
          {/* Left Column: Session Name and Topics */}
          <div className="space-y-6">
            {/* Session Name */}
            <Card className="rounded-xl border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base" style={{ color: 'var(--foreground)' }}>Session Name</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Enter session name"
                  className="w-full"
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: 'var(--background)',
                    color: 'var(--foreground)'
                  }}
                />
              </CardContent>
            </Card>

            {/* Topics */}
            <Card className="flex-1 rounded-xl border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle style={{ color: 'var(--foreground)' }}>Topics</CardTitle>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={selectAllTopics}
                      className="text-sm cursor-pointer"
                      style={{ color: 'var(--muted-foreground)' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
                    >
                      {selectedTopicIds.size === quantTopics.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                      <span className="font-medium">{availableQuestions}</span> available problems
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {quantTopics.map(topic => (
                    <div
                      key={topic.id}
                      onClick={() => toggleTopicSelection(topic.id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer transition-all text-sm"
                      style={{
                        borderColor: selectedTopicIds.has(topic.id) ? 'var(--foreground)' : 'var(--border)',
                        backgroundColor: selectedTopicIds.has(topic.id) ? 'var(--secondary)' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (!selectedTopicIds.has(topic.id)) {
                          e.currentTarget.style.backgroundColor = 'var(--secondary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!selectedTopicIds.has(topic.id)) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <Checkbox
                        checked={selectedTopicIds.has(topic.id)}
                        onCheckedChange={() => toggleTopicSelection(topic.id)}
                        className="cursor-pointer h-3.5 w-3.5"
                      />
                      <span style={{ color: 'var(--foreground)' }}>{topic.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Practice Settings - Right side */}
            <Card className="h-fit rounded-xl border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
              <CardHeader>
                <CardTitle style={{ color: 'var(--foreground)' }}>Practice Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Difficulty Levels */}
                <div>
                  <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>Difficulty Levels</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(['easy', 'medium', 'hard', 'very_hard'] as Difficulty[]).map(difficulty => (
                      <div
                        key={difficulty}
                        onClick={() => toggleDifficulty(difficulty)}
                        className="flex items-center gap-1 px-1.5 py-1 rounded-xl border cursor-pointer transition-all text-xs"
                        style={{
                          borderColor: 'var(--border)',
                          backgroundColor: selectedDifficulties.has(difficulty) ? 'var(--secondary)' : 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedDifficulties.has(difficulty)) {
                            e.currentTarget.style.backgroundColor = 'var(--secondary)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedDifficulties.has(difficulty)) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div className="relative flex items-center justify-center">
                          <Checkbox
                            checked={selectedDifficulties.has(difficulty)}
                            onCheckedChange={() => toggleDifficulty(difficulty)}
                            className="cursor-pointer h-3 w-3 flex items-center justify-center"
                          />
                        </div>
                        <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{getDifficultyLabel(difficulty)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Problem Filters */}
                <div>
                  <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>Exclude:</p>
                  <div className="space-y-2">
                    <div
                      onClick={() => setExcludeBookmarked(!excludeBookmarked)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer transition-all w-36",
                        !user && "opacity-50 cursor-not-allowed"
                      )}
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: excludeBookmarked ? 'var(--secondary)' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (user && !excludeBookmarked) {
                          e.currentTarget.style.backgroundColor = 'var(--secondary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (user && !excludeBookmarked) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <Checkbox
                        checked={excludeBookmarked}
                        onCheckedChange={(checked) => setExcludeBookmarked(!!checked)}
                        className="cursor-pointer h-4 w-4"
                        disabled={!user}
                      />
                      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Bookmarked</span>
                    </div>
                    <div
                      onClick={() => setExcludeCompleted(!excludeCompleted)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer transition-all w-36",
                        !user && "opacity-50 cursor-not-allowed"
                      )}
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: excludeCompleted ? 'var(--secondary)' : 'transparent'
                      }}
                      onMouseEnter={(e) => {
                        if (user && !excludeCompleted) {
                          e.currentTarget.style.backgroundColor = 'var(--secondary)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (user && !excludeCompleted) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <Checkbox
                        checked={excludeCompleted}
                        onCheckedChange={(checked) => setExcludeCompleted(!!checked)}
                        className="cursor-pointer h-4 w-4"
                        disabled={!user}
                      />
                      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Completed</span>
                    </div>
                  </div>
                </div>

                {/* Number of Problems */}
                <div>
                  <p className="text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>Number of Problems</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="5"
                      max={Math.min(20, availableQuestions || 20)}
                      value={Math.min(problemCount, Math.min(20, availableQuestions || 20))}
                      onChange={(e) => setProblemCount(parseInt(e.target.value) || 5)}
                      className="w-20 px-3 py-1.5 text-sm border rounded-xl focus:outline-none"
                      style={{
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)'
                      }}
                    />
                    <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>problems</span>
                  </div>
                </div>

                {/* Start Practice Button */}
                <div className="pt-2 relative group">
                  <ProGate feature="mock_exam">
                    <Button
                      onClick={handleStartPractice}
                      className={cn(
                        "w-full rounded-xl",
                        user ? "cursor-pointer" : "cursor-default disabled:opacity-100"
                      )}
                      size="lg"
                      disabled={!user || selectedTopicIds.size === 0 || selectedDifficulties.size === 0}
                      style={{ pointerEvents: user && selectedTopicIds.size > 0 && selectedDifficulties.size > 0 ? 'auto' : 'none' }}
                    >
                      <Play className="h-5 w-5 mr-2" />
                      Start Practice
                    </Button>
                  </ProGate>
                  {!user && selectedTopicIds.size > 0 && selectedDifficulties.size > 0 && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none whitespace-nowrap z-50" style={{ backgroundColor: 'var(--popover)', color: 'var(--popover-foreground)', border: '1px solid var(--border)' }}>
                      Please sign in
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4" style={{ borderTopColor: 'var(--border)' }} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
