"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Topic } from "@/types/database";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  // Define the course structure
  const getCourseStructure = (): Course[] => {
    return [
      {
        id: 'calc1',
        name: 'Calculus I',
        sections: [
          {
            id: 'limits',
            name: 'Limits and Continuity',
            topics: topics.filter(t => [1, 2, 3, 4, 5, 11].includes(t.id))
          },
          {
            id: 'derivatives',
            name: 'Derivatives',
            topics: topics.filter(t => [6, 7, 8, 9, 10].includes(t.id))
          },
          {
            id: 'derivative-apps',
            name: 'Applications of Derivatives',
            topics: topics.filter(t => [12, 13, 14].includes(t.id))
          },
          {
            id: 'basic-integration',
            name: 'Basic Integration',
            topics: topics.filter(t => [15, 16, 17, 18].includes(t.id))
          },
          {
            id: 'integration-apps-basic',
            name: 'Applications of Integration',
            topics: topics.filter(t => [19, 20, 21].includes(t.id))
          }
        ]
      },
      {
        id: 'calc2',
        name: 'Calculus II',
        sections: [
          {
            id: 'advanced-integration',
            name: 'Advanced Integration',
            topics: topics.filter(t => [22, 23, 24].includes(t.id))
          },
          {
            id: 'integration-apps-advanced',
            name: 'Applications of Integration',
            topics: topics.filter(t => [25, 26].includes(t.id))
          },
          {
            id: 'sequences-series',
            name: 'Sequences and Series',
            topics: topics.filter(t => [27, 28, 29, 30, 31, 32, 33, 34, 35].includes(t.id))
          },
          {
            id: 'differential-equations',
            name: 'Differential Equations',
            topics: topics.filter(t => [36, 37, 38, 39, 40].includes(t.id))
          }
        ]
      }
    ];
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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4 h-[73px] flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          Company Name
        </h2>
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-8 w-8"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hierarchical Topics List */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-2">
          {courses.map((course) => (
            <div key={course.id} className="mb-2">
              <Collapsible 
                open={expandedCourses.has(course.id)} 
                onOpenChange={() => toggleCourse(course.id)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start py-2 px-3 font-medium"
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
                  <div className="ml-4 space-y-1">
                    {course.sections.map((section) => (
                      <div key={section.id}>
                        <Collapsible
                          open={expandedSections.has(section.id)}
                          onOpenChange={() => toggleSection(section.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-start py-1.5 px-3 text-sm"
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
                            <div className="ml-4 space-y-1">
                              {section.topics.map((topic) => (
                                <Button
                                  key={topic.id}
                                  variant={selectedTopicId === topic.id ? "default" : "ghost"}
                                  className={cn(
                                    "w-full justify-start text-left h-auto py-2 px-3 text-xs",
                                    selectedTopicId === topic.id && "bg-blue-600 text-white hover:bg-blue-700"
                                  )}
                                  onClick={() => onSelectTopic(topic.id)}
                                >
                                  <span className="flex-1 leading-relaxed whitespace-normal break-words">
                                    {topic.subtopics || topic.main_topics || `Topic ${topic.id}`}
                                  </span>
                                </Button>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}