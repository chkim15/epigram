"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { TutorSession } from "@/types/database";
import { format, isToday, isYesterday, subDays, isAfter } from "date-fns";
import { Bookmark, ChevronDown, ChevronRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import TopicsSidebar from "@/components/navigation/TopicsSidebar";
import UnifiedHeader from "@/components/layout/UnifiedHeader";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import UserProfileDropdown from "@/components/auth/UserProfileDropdown";

interface GroupedSessions {
  [key: string]: TutorSession[];
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user, activeTab]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tutor_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (activeTab === 'bookmarks') {
        query = query.eq('is_bookmarked', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async (sessionId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('tutor_sessions')
        .update({ is_bookmarked: !currentState })
        .eq('id', sessionId);

      if (error) throw error;

      // Refresh sessions
      fetchSessions();
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const openSession = (sessionId: string) => {
    // Navigate to AI tutor page with session ID
    router.push(`/app?mode=ai-tutor&session=${sessionId}`);
  };

  const groupSessionsByDate = (sessions: TutorSession[]): GroupedSessions => {
    const groups: GroupedSessions = {};

    sessions.forEach(session => {
      const date = new Date(session.created_at);
      let groupKey: string;

      if (isToday(date)) {
        groupKey = 'Today';
      } else if (isYesterday(date)) {
        groupKey = 'Yesterday';
      } else if (isAfter(date, subDays(new Date(), 7))) {
        groupKey = 'This Week';
      } else {
        groupKey = format(date, 'MMM d, yyyy');
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(session);
    });

    return groups;
  };

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const groupedSessions = groupSessionsByDate(sessions);

  // Expand first group by default
  useEffect(() => {
    const firstGroup = Object.keys(groupedSessions)[0];
    if (firstGroup && expandedGroups.size === 0) {
      setExpandedGroups(new Set([firstGroup]));
    }
  }, [sessions]);

  const handleAITutor = () => {
    router.push('/app?mode=ai-tutor');
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Desktop Sidebar */}
      {isSidebarOpen && (
        <div className="hidden lg:flex flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <TopicsSidebar
            selectedTopicId={null}
            onSelectTopic={() => {}}
            onToggleSidebar={() => setIsSidebarOpen(false)}
            onLogoClick={() => router.push('/')}
            onAITutor={handleAITutor}
            mode="tutor"
            activeMenu="history"
          />
        </div>
      )}

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-[240px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <TopicsSidebar
            selectedTopicId={null}
            onSelectTopic={() => {}}
            onLogoClick={() => router.push('/')}
            onAITutor={handleAITutor}
            mode="tutor"
            activeMenu="history"
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <UnifiedHeader
          isAuthenticated={isAuthenticated}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          viewMode="history"
          sidebarMode="tutor"
          setSidebarMode={() => {}}
          hasAITutorMessages={false}
          UserProfile={<UserProfileDropdown />}
        />

        {/* History Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">History</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "pb-3 px-1 text-sm font-medium transition-colors cursor-pointer",
              activeTab === 'all'
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={cn(
              "pb-3 px-1 text-sm font-medium transition-colors cursor-pointer",
              activeTab === 'bookmarks'
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            Bookmarks
          </button>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {activeTab === 'bookmarks'
                ? "No bookmarked sessions yet"
                : "No tutoring sessions yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([groupKey, groupSessions]) => (
              <div key={groupKey}>
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200"
                >
                  {expandedGroups.has(groupKey) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {groupKey} ({groupSessions.length})
                </button>

                {/* Session Items */}
                {expandedGroups.has(groupKey) && (
                  <div className="space-y-3">
                    {groupSessions.map(session => (
                      <div
                        key={session.id}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => openSession(session.id)}
                      >
                        <div className="p-4 flex gap-4">
                          {/* Thumbnail */}
                          <div className="flex-shrink-0">
                            <img
                              src={session.image_url}
                              alt="Session thumbnail"
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {session.title || 'Tutoring session'}
                                </h3>
                                {session.initial_text && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                                    {session.initial_text}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                  {format(new Date(session.created_at), 'h:mm a')}
                                </p>
                              </div>

                              {/* Bookmark Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBookmark(session.id, session.is_bookmarked);
                                }}
                                className="ml-3 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer"
                              >
                                <Bookmark
                                  className={cn(
                                    "h-4 w-4",
                                    session.is_bookmarked
                                      ? "fill-yellow-500 text-yellow-500"
                                      : "text-gray-400"
                                  )}
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}