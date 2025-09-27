"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { TutorSession } from "@/types/database";
import { isToday, isYesterday, subDays, isAfter } from "date-fns";
import { Bookmark, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupedSessions {
  [key: string]: TutorSession[];
}

interface HistoryViewProps {
  onOpenSession?: (sessionId: string) => void;
}

export default function HistoryView({ onOpenSession }: HistoryViewProps) {
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'bookmarks'>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const { user } = useAuthStore();

  const fetchSessions = useCallback(async () => {
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
  }, [user?.id, activeTab]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user, activeTab, fetchSessions]);

  // Auto-expand all groups when sessions change
  useEffect(() => {
    const grouped = groupSessionsByDate(sessions);
    const allGroupKeys = Object.keys(grouped);
    setExpandedGroups(new Set(allGroupKeys));
  }, [sessions]);

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

  const deleteSession = async (sessionId: string) => {
    try {
      // Delete associated messages first
      const { error: messagesError } = await supabase
        .from('tutor_messages')
        .delete()
        .eq('session_id', sessionId);

      if (messagesError) throw messagesError;

      // Then delete the session
      const { error: sessionError } = await supabase
        .from('tutor_sessions')
        .delete()
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // Refresh sessions
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const openSession = (sessionId: string) => {
    // Call the callback to open the session in AI tutor mode
    if (onOpenSession) {
      onOpenSession(sessionId);
    }
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
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        groupKey = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
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
    if (firstGroup) {
      setExpandedGroups(prev => {
        if (prev.size === 0) {
          return new Set([firstGroup]);
        }
        return prev;
      });
    }
  }, [sessions, groupedSessions]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-6xl mx-auto px-4 py-4">
        <h1 className="text-3xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>History</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "pb-3 px-1 text-lg font-medium transition-colors cursor-pointer",
              activeTab === 'all'
                ? "border-b-2"
                : ""
            )}
            style={activeTab === 'all' ? { color: 'var(--primary)', borderColor: 'var(--primary)' } : { color: 'var(--muted-foreground)' }}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={cn(
              "pb-3 px-1 text-lg font-medium transition-colors cursor-pointer",
              activeTab === 'bookmarks'
                ? "border-b-2"
                : ""
            )}
            style={activeTab === 'bookmarks' ? { color: 'var(--primary)', borderColor: 'var(--primary)' } : { color: 'var(--muted-foreground)' }}
          >
            Bookmarks
          </button>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="text-center py-12">
            <p style={{ color: 'var(--muted-foreground)' }}>Loading...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: 'var(--muted-foreground)' }}>
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
                  className="flex items-center gap-2 text-sm font-medium mb-3 cursor-pointer"
                  style={{ color: 'var(--muted-foreground)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--foreground)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--muted-foreground)'}
                >
                  {expandedGroups.has(groupKey) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {groupKey} ({groupSessions.length})
                </button>

                {/* Session Items - Grid Layout */}
                {expandedGroups.has(groupKey) && (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {groupSessions.map(session => (
                      <div
                        key={session.id}
                        className="relative group cursor-pointer"
                        onClick={() => openSession(session.id)}
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-[5/3] overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
                          {session.image_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={session.image_url}
                              alt="Session thumbnail"
                              className="w-full h-full object-contain bg-white transition-transform group-hover:scale-105"
                            />
                          ) : (
                            // Text-only session preview
                            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-white transition-transform group-hover:scale-105">
                              {session.initial_text && (
                                <p className="text-xs text-center line-clamp-5 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                                  {session.initial_text}
                                </p>
                              )}
                              {!session.initial_text && (
                                <p className="text-xs text-center italic" style={{ color: 'var(--muted-foreground)' }}>
                                  Text conversation
                                </p>
                              )}
                            </div>
                          )}

                          {/* Bookmark Button Overlay - Shows on hover or when bookmarked */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBookmark(session.id, session.is_bookmarked);
                            }}
                            className={cn(
                              "absolute top-2 right-2 p-1.5 backdrop-blur-sm rounded-xl transition-all cursor-pointer",
                              session.is_bookmarked
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            )}
                            style={{
                              backgroundColor: 'var(--background)',
                              border: '1px solid var(--border)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--secondary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--background)';
                            }}
                          >
                            <Bookmark
                              className="h-4 w-4"
                              style={{
                                color: session.is_bookmarked ? 'var(--primary)' : 'var(--muted-foreground)',
                                fill: session.is_bookmarked ? 'var(--primary)' : 'none'
                              }}
                            />
                          </button>

                          {/* Delete Button - Shows on Hover */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSession(session.id);
                            }}
                            className="absolute bottom-2 right-2 p-1.5 backdrop-blur-sm rounded-xl transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                            style={{
                              backgroundColor: 'var(--background)',
                              border: '1px solid var(--border)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--secondary)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'var(--background)';
                            }}
                          >
                            <Trash2 className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                          </button>
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
  );
}