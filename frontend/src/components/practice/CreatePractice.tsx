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
  created_at: string;
  updated_at?: string;
}

interface CreatePracticeProps {
  onStartPractice: (topicIds: number[], difficulties: string[]) => void;
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
      const { data, error } = await supabase
        .from('user_practice_sessions')
        .insert({
          user_id: user.id,
          name: session.name,
          topic_ids: session.topic_ids,
          difficulties: session.difficulties
        })
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
    if (!userSchool) return courseName;
    
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
        'Calculus I', 'Math 1300', 'Math 1101',  // All Calc I variations
        'Calculus II', 'Math 1400', 'Math 1102'  // All Calc II variations
      ];
      
      const indexA = order.indexOf(a.name);
      const indexB = order.indexOf(b.name);
      
      // Group Calc I variations together (indices 0-2) and Calc II variations together (indices 3-5)
      const groupA = indexA !== -1 ? Math.floor(indexA / 3) : -1;
      const groupB = indexB !== -1 ? Math.floor(indexB / 3) : -1;
      
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
    
    // Save the session to database
    const savedSession = await saveSession({
      name: sessionName,
      topic_ids: selectedTopicIds,
      difficulties
    });
    
    if (savedSession) {
      // Update local state
      setPracticeSessions([savedSession, ...practiceSessions]);
    }
    
    // Call the parent callback with selected filters
    onStartPractice(selectedTopicIds, difficulties);
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
    onStartPractice(topicIds, difficulties);
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
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading topics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Button onClick={fetchTopics} className="mt-4 cursor-pointer">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white dark:bg-gray-900">
      {/* Left sidebar - Practice Sessions List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
        <div>
          <h3 className="text-lg font-semibold mb-4">Saved Sessions</h3>
          <div>
            {!user ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sign in to save and load practice sessions
              </p>
            ) : practiceSessions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No saved sessions yet. Create your first practice session!
              </p>
            ) : (
              <div className="space-y-2">
                {practiceSessions.map(session => (
                  <div
                    key={session.id}
                    className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{session.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {(session.topic_ids || (session as {topicIds?: number[]}).topicIds || []).length} topics, {session.difficulties.length} difficulties
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
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
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none whitespace-nowrap z-50">
                              Please sign in
                              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900 dark:border-t-gray-700" />
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 cursor-pointer hover:text-red-600"
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
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Practice Session
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select topics and difficulty levels to create a custom practice session
          </p>
        </div>

        <div className="space-y-6">
          {/* Session Name and Difficulty Selection - Side by Side */}
          <div className="grid grid-cols-5 gap-4">
            {/* Session Name */}
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Session Name</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Enter session name"
                  className="w-full"
                />
              </CardContent>
            </Card>
            
            {/* Difficulty Selection */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Difficulty Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard', 'very_hard'] as Difficulty[]).map(difficulty => (
                    <div
                      key={difficulty}
                      onClick={() => toggleDifficulty(difficulty)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md border cursor-pointer transition-all",
                        selectedDifficulties.has(difficulty)
                          ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      )}
                    >
                      <Checkbox
                        checked={selectedDifficulties.has(difficulty)}
                        onCheckedChange={() => toggleDifficulty(difficulty)}
                        className="cursor-pointer h-4 w-4"
                      />
                      <span className="text-sm font-medium">{getDifficultyLabel(difficulty)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Topics Selection - 70% width */}
          <div className="grid grid-cols-10 gap-4">
            <Card className="col-span-7">
              <CardHeader>
                <CardTitle>Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {courses.map(course => (
                  <div key={course.id} className="border rounded-lg p-4">
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
                        <span className="font-semibold text-lg">{course.name}</span>
                      </div>
                      <div className="p-1">
                        {expandedCourses.has(course.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                    
                    {/* Main Topics */}
                    {expandedCourses.has(course.id) && (
                      <div className="ml-6 space-y-3">
                        {course.mainTopics.map(mainTopic => (
                          <div key={mainTopic.id} className="border-l-2 border-gray-200 dark:border-gray-700 pl-4">
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
                                <span className="font-medium">{mainTopic.name}</span>
                              </div>
                              <div className="p-1">
                                {expandedMainTopics.has(mainTopic.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
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
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
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

            {/* Practice Summary - Right side */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Practice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Selected Topics</p>
                  <p className="text-xl font-bold">{getSelectedTopicIds().length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Difficulty Levels</p>
                  <p className="text-xl font-bold">{selectedDifficulties.size}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Available Questions</p>
                  <p className="text-xl font-bold">{getSelectedTopicIds().length * 5}</p>
                </div>
                
                {/* Start Practice Button */}
                <div className="pt-4 relative group">
                  <Button
                    onClick={handleStartPractice}
                    className={cn(
                      "w-full",
                      user ? "cursor-pointer" : "cursor-default disabled:opacity-100"
                    )}
                    size="lg"
                    disabled={!user || getSelectedTopicIds().length === 0 || selectedDifficulties.size === 0}
                    style={{ pointerEvents: user && getSelectedTopicIds().length > 0 && selectedDifficulties.size > 0 ? 'auto' : 'none' }}
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Start ({getSelectedTopicIds().length} topics)
                  </Button>
                  {!user && getSelectedTopicIds().length > 0 && selectedDifficulties.size > 0 && (
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none whitespace-nowrap z-50">
                      Please sign in
                      <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-900 dark:border-t-gray-700" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}