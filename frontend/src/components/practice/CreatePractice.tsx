import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Topic } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Play,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";

interface Course {
  id: string;
  name: string;
  selected: boolean;
  mainTopics: MainTopic[];
}

interface MainTopic {
  id: string;
  name: string;
  selected: boolean;
  subtopics: SubTopic[];
}

interface SubTopic {
  id: number;
  name: string;
  selected: boolean;
}

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
  const [topics, setTopics] = useState<Topic[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedMainTopics, setExpandedMainTopics] = useState<Set<string>>(new Set());
  const [userSchool, setUserSchool] = useState<string | null>(null);
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
    fetchTopics();
    if (user) {
      fetchUserProfile();
      loadSessions();
    } else {
      setPracticeSessions([]);
    }
  }, [user]);

  useEffect(() => {
    // Generate default session name
    const sessionCount = practiceSessions.length + 1;
    setSessionName(`Practice ${sessionCount}`);
  }, [practiceSessions.length]);

  // Rebuild course structure when userSchool changes
  useEffect(() => {
    if (topics.length > 0) {
      buildCourseStructure(topics);
    }
  }, [userSchool, topics]);

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
      // Fallback to localStorage for backward compatibility
      const stored = localStorage.getItem('practiceSessions');
      if (stored) {
        try {
          const sessions = JSON.parse(stored);
          // Migrate old sessions to new format
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
          // Clear localStorage after migration
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
      // Prepare the insert data, conditionally including problem_count
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

      // Only add problem_count if it exists to handle schema differences
      if (session.problem_count !== undefined) {
        insertData.problem_count = session.problem_count;
      }

      // Only add problem_ids if it exists
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

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('id');

      if (error) throw error;

      setTopics(data || []);
      // buildCourseStructure will be called by the effect when topics or userSchool changes
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('school')
        .eq('user_id', user.id)
        .single();
      
      if (profile) {
        setUserSchool(profile.school);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // Get display name for courses based on user's school
  const getCourseDisplayName = (courseName: string): string => {
    if (!userSchool) {
      // Default names with AP Calculus designations when no school is set
      if (courseName === 'Calculus I') return 'Calculus I / AP Calc AB';
      if (courseName === 'Calculus II') return 'Calculus II / AP Calc BC';
      return courseName;
    }
    
    if (userSchool === 'University of Pennsylvania') {
      if (courseName === 'Calculus I') return 'Math 1300';
      if (courseName === 'Calculus II') return 'Math 1400';
    } else if (userSchool === 'Columbia University') {
      if (courseName === 'Calculus I') return 'Math 1101';
      if (courseName === 'Calculus II') return 'Math 1102';
    }
    
    return courseName;
  };

  const buildCourseStructure = (topicsData: Topic[]) => {
    // Group topics by course and main_topics
    const courseMap = new Map<string, Map<string, Topic[]>>();
    
    topicsData.forEach(topic => {
      const courseName = topic.course || 'Uncategorized';
      const mainTopicName = topic.main_topics || 'Other';
      
      // Skip "Basics of Functions" main topic
      if (mainTopicName === 'Basics of Functions') {
        return;
      }
      
      // Skip generic "Calculus" course (keep only "Calculus I" and "Calculus II")
      if (courseName === 'Calculus') {
        return;
      }
      
      if (!courseMap.has(courseName)) {
        courseMap.set(courseName, new Map());
      }
      
      const mainTopicsMap = courseMap.get(courseName)!;
      if (!mainTopicsMap.has(mainTopicName)) {
        mainTopicsMap.set(mainTopicName, []);
      }
      
      mainTopicsMap.get(mainTopicName)!.push(topic);
    });
    
    // Build course structure
    const coursesArray: Course[] = [];
    courseMap.forEach((mainTopicsMap, courseName) => {
      const mainTopicsArray: MainTopic[] = [];
      
      mainTopicsMap.forEach((subtopics, mainTopicName) => {
        mainTopicsArray.push({
          id: mainTopicName.toLowerCase().replace(/\s+/g, '-'),
          name: mainTopicName,
          selected: false,
          subtopics: subtopics.map(t => ({
            id: t.id,
            name: t.subtopics || `Topic ${t.id}`,
            selected: false
          })).sort((a, b) => a.id - b.id)
        });
      });
      
      // Sort main topics by the minimum topic ID in each
      mainTopicsArray.sort((a, b) => {
        const minIdA = Math.min(...a.subtopics.map(t => t.id));
        const minIdB = Math.min(...b.subtopics.map(t => t.id));
        return minIdA - minIdB;
      });
      
      coursesArray.push({
        id: courseName.toLowerCase().replace(/\s+/g, '-'),
        name: getCourseDisplayName(courseName),
        selected: false,
        mainTopics: mainTopicsArray
      });
    });
    
    // Sort courses in specific order (use display names for sorting)
    coursesArray.sort((a, b) => {
      // Define order with both original and school-specific names
      const order = [
        'Calculus I / AP Calc AB', 'Calculus I', 'Math 1300', 'Math 1101',  // All Calc I variations
        'Calculus II / AP Calc BC', 'Calculus II', 'Math 1400', 'Math 1102'  // All Calc II variations
      ];
      
      const indexA = order.indexOf(a.name);
      const indexB = order.indexOf(b.name);
      
      // Group Calc I variations together (indices 0-3) and Calc II variations together (indices 4-7)
      const groupA = indexA !== -1 ? Math.floor(indexA / 4) : -1;
      const groupB = indexB !== -1 ? Math.floor(indexB / 4) : -1;
      
      if (groupA !== -1 && groupB !== -1) {
        return groupA - groupB;
      }
      if (groupA !== -1) return -1;
      if (groupB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
    
    setCourses(coursesArray);
  };

  const toggleCourseExpansion = (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
  };

  const toggleMainTopicExpansion = (mainTopicId: string) => {
    const newExpanded = new Set(expandedMainTopics);
    if (newExpanded.has(mainTopicId)) {
      newExpanded.delete(mainTopicId);
    } else {
      newExpanded.add(mainTopicId);
    }
    setExpandedMainTopics(newExpanded);
  };

  const toggleCourseSelection = (courseId: string) => {
    setCourses(prevCourses => 
      prevCourses.map(course => {
        if (course.id === courseId) {
          const newSelected = !course.selected;
          return {
            ...course,
            selected: newSelected,
            mainTopics: course.mainTopics.map(mainTopic => ({
              ...mainTopic,
              selected: newSelected,
              subtopics: mainTopic.subtopics.map(subtopic => ({
                ...subtopic,
                selected: newSelected
              }))
            }))
          };
        }
        return course;
      })
    );
  };

  const toggleMainTopicSelection = (courseId: string, mainTopicId: string) => {
    setCourses(prevCourses => 
      prevCourses.map(course => {
        if (course.id === courseId) {
          const updatedMainTopics = course.mainTopics.map(mainTopic => {
            if (mainTopic.id === mainTopicId) {
              const newSelected = !mainTopic.selected;
              return {
                ...mainTopic,
                selected: newSelected,
                subtopics: mainTopic.subtopics.map(subtopic => ({
                  ...subtopic,
                  selected: newSelected
                }))
              };
            }
            return mainTopic;
          });
          
          // Check if all main topics are selected to update course selection
          const allMainTopicsSelected = updatedMainTopics.every(mt => mt.selected);
          
          return {
            ...course,
            selected: allMainTopicsSelected,
            mainTopics: updatedMainTopics
          };
        }
        return course;
      })
    );
  };

  const toggleSubtopicSelection = (courseId: string, mainTopicId: string, subtopicId: number) => {
    setCourses(prevCourses => 
      prevCourses.map(course => {
        if (course.id === courseId) {
          const updatedMainTopics = course.mainTopics.map(mainTopic => {
            if (mainTopic.id === mainTopicId) {
              const updatedSubtopics = mainTopic.subtopics.map(subtopic => {
                if (subtopic.id === subtopicId) {
                  return {
                    ...subtopic,
                    selected: !subtopic.selected
                  };
                }
                return subtopic;
              });
              
              // Check if all subtopics are selected to update main topic selection
              const allSubtopicsSelected = updatedSubtopics.every(st => st.selected);
              
              return {
                ...mainTopic,
                selected: allSubtopicsSelected,
                subtopics: updatedSubtopics
              };
            }
            return mainTopic;
          });
          
          // Check if all main topics are selected to update course selection
          const allMainTopicsSelected = updatedMainTopics.every(mt => mt.selected);
          
          return {
            ...course,
            selected: allMainTopicsSelected,
            mainTopics: updatedMainTopics
          };
        }
        return course;
      })
    );
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

  const getSelectedTopicIds = (): number[] => {
    const selectedIds: number[] = [];
    courses.forEach(course => {
      course.mainTopics.forEach(mainTopic => {
        mainTopic.subtopics.forEach(subtopic => {
          if (subtopic.selected) {
            selectedIds.push(subtopic.id);
          }
        });
      });
    });
    return selectedIds;
  };

  // Update available questions when selections change
  useEffect(() => {
    const calculateAvailableQuestions = async () => {
      const topicIds = getSelectedTopicIds();
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

        // Add topic filter using problem_topics junction table
        if (topicIds.length > 0) {
          const { data: problemIds } = await supabase
            .from('problem_topics')
            .select('problem_id')
            .in('topic_id', topicIds);

          if (problemIds) {
            const uniqueProblemIds = [...new Set(problemIds.map(p => p.problem_id))];
            query = query.in('id', uniqueProblemIds);
          }
        }

        // Apply exclusion filters when bookmarked/completed ARE selected
        if (user) {
          // Collect IDs to exclude
          const excludeIds: string[] = [];

          // If excludeBookmarked is true, get bookmarked problem IDs to exclude
          if (excludeBookmarked) {
            const { data: bookmarks } = await supabase
              .from('user_bookmarks')
              .select('problem_id')
              .eq('user_id', user.id);

            if (bookmarks && bookmarks.length > 0) {
              excludeIds.push(...bookmarks.map(b => b.problem_id));
            }
          }

          // If excludeCompleted is true, get completed problem IDs to exclude
          if (excludeCompleted) {
            const { data: completed, error } = await supabase
              .from('user_completed_problems')
              .select('problem_id')
              .eq('user_id', user.id);

            console.log('Completed problems query result:', { completed, error });

            if (completed && completed.length > 0) {
              // Add to excludeIds, avoiding duplicates
              const completedIds = completed.map(c => c.problem_id);
              console.log('Completed problem IDs to exclude:', completedIds);
              completedIds.forEach(id => {
                if (!excludeIds.includes(id)) {
                  excludeIds.push(id);
                }
              });
            }
          }

          // Apply the exclusion filter if there are any IDs to exclude
          if (excludeIds.length > 0) {
            console.log('Total IDs to exclude:', excludeIds);
            console.log('Exclude filter string:', `(${excludeIds.join(',')})`);
            // Use Supabase's filter method properly for UUID arrays
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
  }, [getSelectedTopicIds().join(','), selectedDifficulties, excludeBookmarked, excludeCompleted, user]);

  const generateProblemList = async (topicIds: number[], difficulties: string[], count: number): Promise<string[]> => {
    try {
      // Build the same query as in ProblemViewer
      let query = supabase
        .from('problems')
        .select('id')
        .eq('included', true);

      // Add topic filter using problem_topics junction table
      if (topicIds.length > 0) {
        const { data: problemIds } = await supabase
          .from('problem_topics')
          .select('problem_id')
          .in('topic_id', topicIds);

        if (problemIds) {
          const uniqueProblemIds = [...new Set(problemIds.map(p => p.problem_id))];
          query = query.in('id', uniqueProblemIds);
        }
      }

      // Filter by difficulties
      if (difficulties.length > 0) {
        query = query.in('difficulty', difficulties);
      }

      // Apply exclusion filters if user is signed in
      if (user) {
        const excludeIds: string[] = [];

        // Exclude bookmarked problems if filter is active
        if (excludeBookmarked) {
          const { data: bookmarks } = await supabase
            .from('user_bookmarks')
            .select('problem_id')
            .eq('user_id', user.id);

          if (bookmarks && bookmarks.length > 0) {
            excludeIds.push(...bookmarks.map(b => b.problem_id));
          }
        }

        // Exclude completed problems if filter is active
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

        // Apply exclusion filter if there are any IDs to exclude
        if (excludeIds.length > 0) {
          query = query.filter('id', 'not.in', `(${excludeIds.join(',')})`);
        }
      }

      const result = await query;

      if (result.data) {
        // Randomize the problems
        const problemIds = [...result.data.map(p => p.id)];
        for (let i = problemIds.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [problemIds[i], problemIds[j]] = [problemIds[j], problemIds[i]];
        }

        // Limit to the specified count
        return problemIds.slice(0, count);
      }

      return [];
    } catch (error) {
      console.error('Error generating problem list:', error);
      return [];
    }
  };

  const handleStartPractice = async () => {
    const selectedTopicIds = getSelectedTopicIds();
    const difficulties = Array.from(selectedDifficulties);

    if (!user) {
      alert('Please sign in to start a practice session');
      return;
    }

    if (selectedTopicIds.length === 0) {
      alert('Please select at least one topic');
      return;
    }

    if (difficulties.length === 0) {
      alert('Please select at least one difficulty level');
      return;
    }

    // Generate the actual problem list for this session
    const problemIds = await generateProblemList(selectedTopicIds, difficulties, problemCount);

    if (problemIds.length === 0) {
      alert('No problems found matching your criteria. Please adjust your filters.');
      return;
    }

    // Save the session to database with the actual problem IDs
    const savedSession = await saveSession({
      name: sessionName,
      topic_ids: selectedTopicIds,
      difficulties,
      problem_count: problemCount,
      problem_ids: problemIds
    });

    if (savedSession) {
      // Update local state
      setPracticeSessions([savedSession, ...practiceSessions]);
    }

    // Call the parent callback with selected filters
    // Note: excludeBookmarked and excludeCompleted are exclusion filters
    const source = 'all'; // Always 'all' since we're using exclusion filters
    onStartPractice(selectedTopicIds, difficulties, source, problemCount);
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

      // Update local state
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
    // Load the session's selections - handle both old and new field names
    const topicIds = session.topic_ids || (session as {topicIds?: number[]}).topicIds || [];
    const difficulties = session.difficulties || [];
    const problemCount = session.problem_count || 10;

    // If we have saved problem IDs, use them; otherwise fall back to generation
    if (session.problem_ids && session.problem_ids.length > 0) {
      // Pass the saved problem IDs to the parent
      onStartPractice(topicIds, difficulties, 'saved', problemCount, session.problem_ids);
    } else {
      // Old session without saved problems - use original behavior
      onStartPractice(topicIds, difficulties, 'all', problemCount);
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
          <Button onClick={fetchTopics} className="mt-4 cursor-pointer">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full" style={{ backgroundColor: 'var(--background)' }}>
      {/* Left sidebar - Practice Sessions List */}
      <div className="w-64 border-r p-4 overflow-y-auto" style={{ borderColor: 'var(--border)' }}>
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
      <div className="flex-1 overflow-y-auto py-6 pl-6 pr-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--foreground)' }}>
            Create Practice Session
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
                  <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                    <span className="font-medium">{availableQuestions}</span> available problems
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {courses.map(course => (
                  <div key={course.id} className="border rounded-xl p-4" style={{ borderColor: 'var(--border)' }}>
                    {/* Course Level - Clickable entire row */}
                    <div 
                      className="flex items-center justify-between mb-3 cursor-pointer"
                      onClick={() => toggleCourseExpansion(course.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={course.selected}
                          onCheckedChange={() => toggleCourseSelection(course.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="cursor-pointer"
                        />
                        <span className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>{course.name}</span>
                      </div>
                      <div className="p-1">
                        {expandedCourses.has(course.id) ? (
                          <ChevronDown className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                        ) : (
                          <ChevronRight className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                        )}
                      </div>
                    </div>
                    
                    {/* Main Topics */}
                    {expandedCourses.has(course.id) && (
                      <div className="ml-6 space-y-3">
                        {course.mainTopics.map(mainTopic => (
                          <div key={mainTopic.id} className="border-l-2 pl-4" style={{ borderColor: 'var(--border)' }}>
                            <div 
                              className="flex items-center justify-between mb-2 cursor-pointer"
                              onClick={() => toggleMainTopicExpansion(mainTopic.id)}
                            >
                              <div className="flex items-center gap-3">
                                <Checkbox
                                  checked={mainTopic.selected}
                                  onCheckedChange={() => toggleMainTopicSelection(course.id, mainTopic.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="cursor-pointer"
                                />
                                <span className="font-medium" style={{ color: 'var(--foreground)' }}>{mainTopic.name}</span>
                              </div>
                              <div className="p-1">
                                {expandedMainTopics.has(mainTopic.id) ? (
                                  <ChevronDown className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                                ) : (
                                  <ChevronRight className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                                )}
                              </div>
                            </div>
                            
                            {/* Subtopics */}
                            {expandedMainTopics.has(mainTopic.id) && (
                              <div className="ml-6 space-y-2">
                                {mainTopic.subtopics.map(subtopic => (
                                  <div key={subtopic.id} className="flex items-center gap-3">
                                    <Checkbox
                                      checked={subtopic.selected}
                                      onCheckedChange={() => toggleSubtopicSelection(course.id, mainTopic.id, subtopic.id)}
                                      className="cursor-pointer"
                                    />
                                    <span className="text-sm" style={{ color: 'var(--foreground)' }}>
                                      {subtopic.name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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
                        className="flex items-center gap-1 px-1.5 py-1 rounded-lg border cursor-pointer transition-all text-xs"
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
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all w-36",
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
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-all w-36",
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
                      className="w-20 px-3 py-1.5 text-sm border rounded-lg focus:outline-none"
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
                  <Button
                    onClick={handleStartPractice}
                    className={cn(
                      "w-full rounded-xl",
                      user ? "cursor-pointer" : "cursor-default disabled:opacity-100"
                    )}
                    size="lg"
                    disabled={!user || getSelectedTopicIds().length === 0 || selectedDifficulties.size === 0}
                    style={{ pointerEvents: user && getSelectedTopicIds().length > 0 && selectedDifficulties.size > 0 ? 'auto' : 'none' }}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Start Practice
                  </Button>
                  {!user && getSelectedTopicIds().length > 0 && selectedDifficulties.size > 0 && (
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