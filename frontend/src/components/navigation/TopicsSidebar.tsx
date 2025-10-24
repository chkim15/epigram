"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { Topic } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, ChevronDown, ChevronRight, ChevronLeft, ChevronsLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface Course {
  id: string;
  name: string;
  sections: Section[];
}

interface Section {
  id: string;
  name: string;
  topics: Topic[];
}


interface TopicsSidebarProps {
  selectedTopicId: number | null;
  onSelectTopic: (topicId: number) => void;
  onToggleSidebar?: () => void;
  onCreatePractice?: () => void;
  onRecommendedPractice?: () => void;
  onBookmarks?: () => void;
  onLogoClick?: () => void;
  onAITutor?: () => void;
  onHistory?: () => void;
  onStudyCalculus?: () => void;
  activeMenu?: string;
}


export default function TopicsSidebar({ selectedTopicId, onSelectTopic, onToggleSidebar, onCreatePractice, onRecommendedPractice, onBookmarks, onLogoClick, onAITutor, onHistory, activeMenu }: TopicsSidebarProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'main' | 'course'>('main');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [userSchool, setUserSchool] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchTopics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('id');

      if (error) throw error;

      setTopics(data || []);
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError('Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = useCallback(async () => {
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
  }, [user]);

  useEffect(() => {
    fetchTopics();
    if (user) {
      fetchUserProfile();
    }
  }, [user, fetchUserProfile]);


  const selectCourse = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView('course');
    // Clear expanded sections when switching courses
    setExpandedSections(new Set());
  };

  const goBackToMain = () => {
    setCurrentView('main');
    setSelectedCourse(null);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Get display name for courses based on user's school
  const getCourseDisplayName = (courseName: string): string => {
    if (!userSchool) {
      // Default names with AP Calculus designations when no school is set
      if (courseName === 'Calculus I') return 'Calculus I / AP Calc AB';
      if (courseName === 'Calculus II') return 'Calculus II / AP Calc BC';
      return courseName;
    }

    if (userSchool === 'High school') {
      if (courseName === 'Calculus I') return 'AP Calculus AB';
      if (courseName === 'Calculus II') return 'AP Calculus BC';
    } else if (userSchool === 'University of Pennsylvania') {
      if (courseName === 'Calculus I') return 'Math 1300';
      if (courseName === 'Calculus II') return 'Math 1400';
    }

    // For all other schools (including Columbia), use default names
    if (courseName === 'Calculus I') return 'Calculus I / AP Calc AB';
    if (courseName === 'Calculus II') return 'Calculus II / AP Calc BC';

    return courseName;
  };

  // Build course structure dynamically from database fields
  const getCourseStructure = (): Course[] => {
    // Group topics by course
    const courseGroups = topics.reduce((acc, topic) => {
      let courseName = topic.course || 'Uncategorized';
      
      // Special handling for Calculus Essentials and Special Topics
      if (topic.main_topics === 'Calculus Essentials') {
        courseName = 'Calculus Essentials';
      } else if (topic.main_topics === 'Special Topic') {
        courseName = 'Special Topics';
      } else if (courseName === 'Calculus') {
        // For any other "Calculus" course items, rename to Special Topics
        courseName = 'Special Topics';
      }
      
      if (!acc[courseName]) {
        acc[courseName] = [];
      }
      acc[courseName].push(topic);
      return acc;
    }, {} as Record<string, Topic[]>);

    // Build course structure
    const courses: Course[] = [];
    
    // Process each course
    Object.entries(courseGroups).forEach(([courseName, courseTopics]) => {
      // For Special Topics and Calculus Essentials, create a flat list without sections
      if (courseName === 'Special Topics' || courseName === 'Calculus Essentials') {
        // Create a single section with all topics
        const sections: Section[] = [{
          id: courseName.toLowerCase().replace(/\s+/g, '-') + '-all',
          name: courseName,
          topics: courseTopics.sort((a, b) => a.id - b.id)
        }];
        
        courses.push({
          id: courseName.toLowerCase().replace(/\s+/g, '-'),
          name: courseName,
          sections: sections
        });
      } else {
        // Group topics by main_topics within this course
        const sectionGroups = courseTopics.reduce((acc, topic) => {
          const sectionName = topic.main_topics || 'Other';
          // Filter out "Basics of Functions" section
          if (sectionName === 'Basics of Functions') {
            return acc;
          }
          if (!acc[sectionName]) {
            acc[sectionName] = [];
          }
          acc[sectionName].push(topic);
          return acc;
        }, {} as Record<string, Topic[]>);

        // Build sections for this course
        const sections: Section[] = Object.entries(sectionGroups).map(([sectionName, sectionTopics]) => ({
          id: sectionName.toLowerCase().replace(/\s+/g, '-'),
          name: sectionName,
          topics: sectionTopics.sort((a, b) => a.id - b.id)
        }));

        // Add course with its sections, using display name
        courses.push({
          id: courseName.toLowerCase().replace(/\s+/g, '-'),
          name: getCourseDisplayName(courseName),
          sections: sections.sort((a, b) => {
            // Sort sections by the minimum topic ID in each section
            // This ensures sections appear in the order they appear in the database
            const minIdA = Math.min(...a.topics.map(t => t.id));
            const minIdB = Math.min(...b.topics.map(t => t.id));
            return minIdA - minIdB;
          })
        });
      }
    });

    // No placeholder courses - only show courses with actual data

    // Sort courses in specific order (use display names for sorting)
    return courses.sort((a, b) => {
      // Define order with school-specific names
      const order = [
        'Calculus I / AP Calc AB', 'AP Calculus AB', 'Math 1300', 'Math 1101',  // All Calc I variations
        'Calculus II / AP Calc BC', 'AP Calculus BC', 'Math 1400', 'Math 1102',  // All Calc II variations
        'Special Topics',  // Special Topics after Calc II
        'Calculus Essentials'  // Calculus Essentials after Special Topics
      ];

      const indexA = order.indexOf(a.name);
      const indexB = order.indexOf(b.name);

      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--sidebar-foreground)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--destructive)', color: 'var(--destructive-foreground)' }}>
          {error}
        </div>
        <Button 
          onClick={fetchTopics} 
          variant="outline" 
          size="sm" 
          className="mt-2 w-full"
        >
          Retry
        </Button>
      </div>
    );
  }

  const courses = getCourseStructure();

  return (
    <div className="flex h-full flex-col min-h-0 w-[240px]">
        {/* Header */}
        <div className="p-4 h-[73px] flex items-center justify-between flex-shrink-0">
          <div 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            onClick={onLogoClick}
          >
            <Image
              src="/epigram_logo.svg"
              alt="Epigram Logo"
              width={32}
              height={32}
              style={{
                filter: 'var(--logo-filter, none)'
              }}
            />
            <h2 className="font-bold text-xl" style={{ color: 'var(--epigram-text-color)' }}>
              Epigram
            </h2>
          </div>
          {onToggleSidebar && currentView === 'main' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-8 w-8 cursor-pointer"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          )}
          {currentView === 'course' && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goBackToMain}
              className="h-8 w-8 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content Area - switches between main menu and course details */}
        <div className="flex-1 overflow-hidden min-h-0 relative">
          <AnimatePresence mode="wait">
            {currentView === 'main' ? (
              // Main Menu View
              <motion.div
                key="main"
                initial={{ x: -240, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -240, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute inset-0 overflow-y-auto custom-scrollbar"
              >
                <div className="p-2 pb-32">
                  {/* Practice Menu Items */}
                  {/* Handouts/Problems */}
                  <div className="mb-2">
                    <Collapsible defaultOpen={false}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start py-2 px-3 font-semibold cursor-pointer text-base rounded-xl"
                          style={{ color: 'var(--foreground)' }}
                        >
                          <span className="flex-1 text-left">Handouts/Problems</span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-4 space-y-1">
                          {courses.map((course) => (
                            <Button
                              key={course.id}
                              variant="ghost"
                              className="w-full justify-start py-2 px-3 font-medium cursor-pointer rounded-xl"
                              style={{
                                backgroundColor: selectedCourse?.id === course.id ? 'var(--muted)' : 'transparent',
                                color: selectedCourse?.id === course.id ? 'var(--sidebar-foreground)' : 'var(--foreground)'
                              }}
                              onClick={() => selectCourse(course)}
                            >
                              <span className="flex-1 text-left">{course.name}</span>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                  
                  {/* Recommended Practice */}
                  <div className="mb-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start py-2 px-3 font-semibold cursor-pointer text-base rounded-xl"
                      style={{
                        backgroundColor: activeMenu === 'recommended-practice' ? 'var(--muted)' : 'transparent',
                        color: 'var(--sidebar-foreground)'
                      }}
                      onClick={onRecommendedPractice}
                    >
                      <span className="flex-1 text-left">Recommended Practice</span>
                    </Button>
                  </div>

                  {/* Mock Exam/Quiz */}
                  <div className="mb-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start py-2 px-3 font-semibold cursor-pointer text-base rounded-xl"
                      style={{
                        backgroundColor: activeMenu === 'create-practice' ? 'var(--muted)' : 'transparent',
                        color: 'var(--sidebar-foreground)'
                      }}
                      onClick={onCreatePractice}
                    >
                      <span className="flex-1 text-left">Mock Exam/Quiz</span>
                    </Button>
                  </div>

                  {/* Bookmarks */}
                  <div className="mb-4 relative group">
                    <Button
                      variant="ghost"
                      className="w-full justify-start py-2 px-3 font-semibold cursor-pointer text-base rounded-xl disabled:opacity-100"
                      style={{
                        backgroundColor: activeMenu === 'bookmarks' ? 'var(--muted)' : 'transparent',
                        color: 'var(--sidebar-foreground)',
                        pointerEvents: user ? 'auto' : 'none'
                      }}
                      onClick={onBookmarks}
                      disabled={!user}
                    >
                      <span className="flex-1 text-left">Bookmarks</span>
                    </Button>
                    {!user && (
                      <div className="absolute left-12 bottom-full mb-1 px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-0 pointer-events-none whitespace-nowrap z-50" style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}>
                        Please sign in
                        <div className="absolute left-4 top-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4" style={{ borderTopColor: 'var(--sidebar-foreground)' }} />
                      </div>
                    )}
                  </div>

                  {/* Separator */}
                  <div className="mx-3 mb-4 border-t" style={{ borderColor: 'var(--border)' }} />

                  {/* Tutor Menu Items */}
                  {/* AI Tutor */}
                  <div className="mb-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start py-2 px-3 font-semibold cursor-pointer text-base rounded-xl"
                      style={{
                        backgroundColor: activeMenu === 'ai-tutor' ? 'var(--muted)' : 'transparent',
                        color: 'var(--sidebar-foreground)'
                      }}
                      onClick={onAITutor}
                    >
                      <span className="flex-1 text-left">AI Tutor</span>
                    </Button>
                  </div>

                  {/* History */}
                  <div className="mb-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start py-2 px-3 font-semibold cursor-pointer text-base rounded-xl"
                      style={{
                        backgroundColor: activeMenu === 'history' ? 'var(--muted)' : 'transparent',
                        color: 'var(--sidebar-foreground)'
                      }}
                      onClick={onHistory}
                    >
                      <span className="flex-1 text-left">History</span>
                    </Button>
                  </div>
            </div>
              </motion.div>
            ) : (
              // Course Details View
              <motion.div
                key="course"
                initial={{ x: 240, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 240, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute inset-0 overflow-y-auto custom-scrollbar"
              >
                <div className="p-4 pb-32">
              {selectedCourse && (
                <>
                  <h3 className="font-semibold text-lg mb-4" style={{ color: 'var(--sidebar-foreground)' }}>{selectedCourse.name}</h3>
                  {(selectedCourse.name === 'Special Topics' || selectedCourse.name === 'Calculus Essentials') ? (
                    // For Special Topics and Calculus Essentials, show topics directly without section dropdown
                    <div className="space-y-1">
                      {selectedCourse.sections[0].topics.map((topic) => (
                        <Button
                          key={topic.id}
                          variant={selectedTopicId === topic.id ? "default" : "ghost"}
                          className="w-full justify-start text-left h-auto py-2 px-3 text-xs cursor-pointer rounded-xl"
                          style={{
                            backgroundColor: selectedTopicId === topic.id ? 'var(--muted)' : 'transparent',
                            color: selectedTopicId === topic.id ? 'var(--sidebar-foreground)' : 'var(--muted-foreground)'
                          }}
                          onClick={() => onSelectTopic(topic.id)}
                        >
                          <span className="flex-1 leading-relaxed whitespace-normal break-words">
                            {topic.subtopics || `Topic ${topic.id}`}
                          </span>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    // For other courses, show sections with collapsible topics
                    selectedCourse.sections.map((section) => (
                      <div key={section.id} className="mb-4">
                        <Collapsible
                          open={expandedSections.has(section.id)}
                          onOpenChange={() => toggleSection(section.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-start py-2 px-3 font-medium cursor-pointer rounded-xl"
                              style={{ color: 'var(--foreground)' }}
                            >
                              <span className={cn(
                                "flex-1 text-left",
                                section.name.length > 25 && "text-sm"
                              )}>{section.name}</span>
                              {expandedSections.has(section.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="ml-4 mt-1 space-y-1">
                              {section.topics.map((topic) => (
                                <Button
                                  key={topic.id}
                                  variant={selectedTopicId === topic.id ? "default" : "ghost"}
                                  className="w-full justify-start text-left h-auto py-2 px-3 text-xs cursor-pointer rounded-xl"
                                  style={{
                                    backgroundColor: selectedTopicId === topic.id ? 'var(--muted)' : 'transparent',
                                    color: selectedTopicId === topic.id ? 'var(--sidebar-foreground)' : 'var(--muted-foreground)'
                                  }}
                                  onClick={() => onSelectTopic(topic.id)}
                                >
                                  <span className="flex-1 leading-relaxed whitespace-normal break-words">
                                    {topic.subtopics || `Topic ${topic.id}`}
                                  </span>
                                </Button>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </div>
  );
}