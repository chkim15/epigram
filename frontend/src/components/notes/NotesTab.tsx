'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SquarePen } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase/client';
import { Problem } from '@/types/database';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NotesTabProps {
  currentProblem: Problem | null;
}

export function NotesTab({ currentProblem }: NotesTabProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [noteText, setNoteText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTextRef = useRef<string>('');

  // Fetch existing note when problem changes or user signs in
  useEffect(() => {
    const fetchNote = async () => {
      if (!user || !currentProblem) {
        setNoteText('');
        lastSavedTextRef.current = '';
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_notes')
          .select('note_text')
          .eq('user_id', user.id)
          .eq('problem_id', currentProblem.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error('Error fetching note:', error);
        } else if (data) {
          setNoteText(data.note_text);
          lastSavedTextRef.current = data.note_text;
        } else {
          setNoteText('');
          lastSavedTextRef.current = '';
        }
      } catch (err) {
        console.error('Error fetching note:', err);
        setNoteText('');
        lastSavedTextRef.current = '';
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [user, currentProblem]);

  // Save note with debouncing
  const saveNote = useCallback(async (text: string) => {
    if (!user || !currentProblem) return;
    
    // Don't save if text hasn't changed
    if (text === lastSavedTextRef.current) return;

    setIsSaving(true);
    try {
      // Use upsert to create or update the note
      const { error } = await supabase
        .from('user_notes')
        .upsert({
          user_id: user.id,
          problem_id: currentProblem.id,
          note_text: text,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,problem_id'
        });

      if (error) {
        console.error('Error saving note:', error);
      } else {
        lastSavedTextRef.current = text;
      }
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setIsSaving(false);
    }
  }, [user, currentProblem]);

  // Handle text change with debounced auto-save
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setNoteText(newText);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (1.5 seconds after user stops typing)
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(newText);
    }, 1500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Save immediately on unmount if there's pending text
        if (noteText !== lastSavedTextRef.current && user && currentProblem) {
          saveNote(noteText);
        }
      }
    };
  }, [noteText, saveNote, user, currentProblem]);

  // Show sign-in prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center">
          <SquarePen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Sign in to take notes
          </p>
          <Button
            onClick={() => router.push('/auth/signin')}
            className="cursor-pointer"
            size="sm"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  // Show placeholder if no problem is selected
  if (!currentProblem) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <SquarePen className="h-12 w-12 mx-auto mb-2" />
          <p>Select a problem to take notes</p>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>Loading notes...</p>
        </div>
      </div>
    );
  }

  // Main notes interface
  return (
    <div className="h-full flex flex-col">
      {/* Save indicator */}
      {isSaving && (
        <div className="flex justify-end px-4 pt-4">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Saving...
          </span>
        </div>
      )}

      {/* Notes textarea */}
      <div className="flex-1 px-4 pb-4 pt-4">
        <Textarea
          value={noteText}
          onChange={handleTextChange}
          placeholder="Type your notes here..."
          className={cn(
            "h-full resize-none",
            "!border-0 !border-none",
            "bg-white dark:bg-gray-900",
            "placeholder:text-gray-400 dark:placeholder:text-gray-500",
            "!ring-0 !ring-offset-0",
            "focus:!ring-0 focus:!ring-offset-0 focus:!outline-none focus:!border-0",
            "focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!border-0",
            "!shadow-none",
            "p-0"
          )}
          style={{
            boxShadow: 'none',
            outline: 'none',
            border: 'none'
          }}
        />
      </div>
    </div>
  );
}