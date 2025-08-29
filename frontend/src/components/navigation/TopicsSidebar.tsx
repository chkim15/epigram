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
  onCreatePractice?: () => void;
  onLogoClick?: () => void;
}

interface ExpandedCourse {
  courseId: string;
  courseName: string;
  sections: Section[];
}

export default function TopicsSidebar({ selectedTopicId, onSelectTopic, onToggleSidebar, onCreatePractice, onLogoClick }: TopicsSidebarProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<ExpandedCourse | null>(null);
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

  const toggleCourse = (course: Course) => {
    if (expandedCourse?.courseId === course.id) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse({
        courseId: course.id,
        courseName: course.name,
        sections: course.sections
      });
      // Clear expanded sections when switching courses
      setExpandedSections(new Set());
    }
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

    // No placeholder courses - only show courses with actual data

    // Sort courses in specific order
    return courses.sort((a, b) => {
      const order = ['Calculus I', 'Calculus II'];
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
    <div className="flex h-full min-h-0">
      {/* Main Sidebar */}
      <div className="flex h-full flex-col min-h-0 flex-shrink-0 w-[240px]">
        {/* Header */}
        <div className="p-4 h-[73px] flex items-center justify-between flex-shrink-0">
          <div 
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
            onClick={onLogoClick}
          >
            <img src="/epigram_logo.svg" alt="Epigram Logo" className="w-8 h-8" />
            <h2 className="font-bold text-xl text-gray-900 dark:text-white">
              Epigram
            </h2>
          </div>
          {onToggleSidebar && !expandedCourse && (
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
            {/* Study by Course Section */}
            <div className="mb-2">
              <Collapsible defaultOpen>
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
                      <Button
                        key={course.id}
                        variant={expandedCourse?.courseId === course.id ? "secondary" : "ghost"}
                        className="w-full justify-start py-2 px-3 font-medium cursor-pointer"
                        onClick={() => toggleCourse(course)}
                      >
                        <span className="flex-1 text-left">{course.name}</span>
                        {expandedCourse?.courseId === course.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Create Practice Section */}
            <div className="mb-4">
              <Button
                variant="ghost"
                className="w-full justify-start py-2 px-3 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
                onClick={onCreatePractice}
              >
                <span className="flex-1 text-left">Create Practice</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Course Panel */}
      {expandedCourse && (
        <div className="flex-1 h-full bg-gray-50 dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800 z-10 relative">
          <div className="h-full flex flex-col">
            {/* Course Header */}
            <div className="p-4 h-[73px] flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-lg">{expandedCourse.courseName}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpandedCourse(null)}
                className="h-8 w-8 cursor-pointer"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Sections and Topics */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
              {expandedCourse.sections.map((section) => (
                <div key={section.id} className="mb-4">
                  <Collapsible
                    open={expandedSections.has(section.id)}
                    onOpenChange={() => toggleSection(section.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start py-2 px-3 font-medium cursor-pointer"
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
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}