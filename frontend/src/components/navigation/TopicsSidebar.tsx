"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Topic } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, ChevronDown, ChevronRight, ChevronsLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export default function TopicsSidebar({ selectedTopicId, onSelectTopic, onToggleSidebar }: TopicsSidebarProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTopics();
  }, []);

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

  const toggleCourse = (courseId: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedCourses(newExpanded);
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

  // Build course structure dynamically from database fields
  const getCourseStructure = (): Course[] => {
    // Group topics by course
    const courseGroups = topics.reduce((acc, topic) => {
      const courseName = topic.course || 'Uncategorized';
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

      // Add course with its sections
      courses.push({
        id: courseName.toLowerCase().replace(/\s+/g, '-'),
        name: courseName,
        sections: sections.sort((a, b) => {
          // Sort sections by the minimum topic ID in each section
          // This ensures sections appear in the order they appear in the database
          const minIdA = Math.min(...a.topics.map(t => t.id));
          const minIdB = Math.min(...b.topics.map(t => t.id));
          return minIdA - minIdB;
        })
      });
    });

    // Add placeholder courses that don't exist in database yet
    const placeholderCourses = ['Calculus II', 'Calculus III', 'Linear Algebra', 'Probability/Statistics'];
    placeholderCourses.forEach(courseName => {
      if (!courseGroups[courseName]) {
        courses.push({
          id: courseName.toLowerCase().replace(/\s+/g, '-').replace('/', '-'),
          name: courseName,
          sections: []
        });
      }
    });

    // Sort courses in specific order
    return courses.sort((a, b) => {
      const order = ['Calculus I', 'Calculus II', 'Calculus III', 'Linear Algebra', 'Probability/Statistics'];
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
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="rounded-lg bg-red-50 p-3 text-red-800 dark:bg-red-900/20 dark:text-red-400">
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
    <div className="flex h-full flex-col min-h-0">
      {/* Header */}
      <div className="p-4 h-[73px] flex items-center justify-between flex-shrink-0">
        <h2 className="font-bold text-xl text-gray-900 dark:text-white">
          epigram
        </h2>
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-8 w-8 cursor-pointer"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Main Menu Structure */}
      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
        <div className="p-2">
          {/* Create Practice Section */}
          <div className="mb-4">
            <Button
              variant="ghost"
              className="w-full justify-start py-2 px-3 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
              onClick={() => {
                // TODO: Navigate to Create Practice page
                console.log('Navigate to Create Practice page');
              }}
            >
              <span className="flex-1 text-left">Create Practice</span>
            </Button>
          </div>

          {/* Study by Course Section */}
          <div className="mb-2">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start py-2 px-3 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <span className="flex-1 text-left">Study by Course</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-4 space-y-1">
                  {courses.map((course) => (
                    <div key={course.id} className="mb-2">
                      <Collapsible 
                        open={expandedCourses.has(course.id)} 
                        onOpenChange={() => toggleCourse(course.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <Button
                            variant="ghost"
                            className="w-full justify-start py-2 px-3 font-medium cursor-pointer"
                          >
                            <span className="flex-1 text-left">{course.name}</span>
                            {expandedCourses.has(course.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="ml-1 space-y-1">
                            {['Calculus II', 'Calculus III', 'Linear Algebra', 'Probability/Statistics'].includes(course.name) ? (
                              <div className="py-3 px-3 text-sm text-gray-500 dark:text-gray-400 italic">
                                Coming soon
                              </div>
                            ) : (
                              course.sections.map((section) => (
                                <div key={section.id}>
                                  <Collapsible
                                    open={expandedSections.has(section.id)}
                                    onOpenChange={() => toggleSection(section.id)}
                                  >
                                    <CollapsibleTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="w-full justify-start py-1.5 px-3 text-sm cursor-pointer"
                                      >
                                        <span className="flex-1 text-left">{section.name}</span>
                                        {expandedSections.has(section.id) ? (
                                          <ChevronDown className="h-3 w-3" />
                                        ) : (
                                          <ChevronRight className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                      <div className="ml-1 space-y-1">
                                        {section.topics.map((topic) => (
                                          <Button
                                            key={topic.id}
                                            variant={selectedTopicId === topic.id ? "default" : "ghost"}
                                            className={cn(
                                              "w-full justify-start text-left h-auto py-2 px-3 text-xs cursor-pointer",
                                              selectedTopicId === topic.id && "bg-blue-600 text-white hover:bg-blue-700"
                                            )}
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
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
}