'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { SquarePen, FunctionSquare } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase/client';
import { Problem } from '@/types/database';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NotesWithMathProps {
  currentProblem: Problem | null;
}


export function NotesWithMath({ currentProblem }: NotesWithMathProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [noteContent, setNoteContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingMath, setIsEditingMath] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>('');
  const contentEditableRef = useRef<HTMLDivElement>(null);

  // Import MathLive when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('mathlive').then(({ MathfieldElement }) => {
        if (!customElements.get('math-field')) {
          customElements.define('math-field', MathfieldElement);
        }
      });
    }
  }, []);

  // Convert content editable HTML to storage format
  const htmlToStorage = (html: string): string => {
    // Parse HTML and convert math-field elements to $$...$$ format
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    let result = '';
    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        if (element.tagName.toLowerCase() === 'math-field') {
          const latex = element.getAttribute('value') || element.textContent || '';
          result += `$$${latex}$$`;
        } else if (element.tagName.toLowerCase() === 'br') {
          result += '\n';
        } else if (element.tagName.toLowerCase() === 'div' || element.tagName.toLowerCase() === 'p') {
          for (const child of Array.from(element.childNodes)) {
            processNode(child);
          }
          if (element.nextSibling) result += '\n';
        } else {
          for (const child of Array.from(element.childNodes)) {
            processNode(child);
          }
        }
      }
    };
    
    for (const child of Array.from(tempDiv.childNodes)) {
      processNode(child);
    }
    
    return result.trim();
  };

  // Convert storage format to content editable HTML
  const storageToHtml = (text: string): string => {
    if (!text) return '';
    
    // Split by math blocks and convert to HTML
    const parts = text.split(/(\$\$.*?\$\$)/g);
    let html = '';
    
    parts.forEach((part, index) => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const latex = part.slice(2, -2);
        html += `<math-field data-index="${index}" style="display: inline-block; font-size: inherit;" value="${latex}">${latex}</math-field>`;
      } else {
        // Convert newlines to <br> tags
        const textWithBreaks = part.replace(/\n/g, '<br>');
        html += textWithBreaks;
      }
    });
    
    return html;
  };

  // Fetch existing note when problem changes or user signs in
  useEffect(() => {
    const fetchNote = async () => {
      if (!user || !currentProblem) {
        setNoteContent('');
        lastSavedContentRef.current = '';
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

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching note:', error);
        } else if (data && data.note_text) {
          setNoteContent(data.note_text);
          lastSavedContentRef.current = data.note_text;
          // Update the content editable div after a small delay to ensure it's mounted
          setTimeout(() => {
            if (contentEditableRef.current) {
              contentEditableRef.current.innerHTML = storageToHtml(data.note_text);
            }
          }, 100);
        } else {
          setNoteContent('');
          lastSavedContentRef.current = '';
          if (contentEditableRef.current) {
            contentEditableRef.current.innerHTML = '';
          }
        }
      } catch (err) {
        console.error('Error fetching note:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [user, currentProblem]);

  // Save note with debouncing
  const saveNote = useCallback(async (content: string) => {
    if (!user || !currentProblem) return;
    if (content === lastSavedContentRef.current) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_notes')
        .upsert({
          user_id: user.id,
          problem_id: currentProblem.id,
          note_text: content,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,problem_id'
        });

      if (error) {
        console.error('Error saving note:', error);
      } else {
        lastSavedContentRef.current = content;
      }
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setIsSaving(false);
    }
  }, [user, currentProblem]);

  // Handle content change from contentEditable
  const handleContentChange = useCallback(() => {
    if (!contentEditableRef.current || isEditingMath) return;
    
    const storageFormat = htmlToStorage(contentEditableRef.current.innerHTML);
    setNoteContent(storageFormat);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveNote(storageFormat);
    }, 1500);
  }, [saveNote, isEditingMath]);

  // Setup event listeners for a single math field
  const setupSingleMathField = useCallback((mathField: HTMLElement) => {
    // Check if listeners already attached
    if (mathField.dataset.listenersAttached === 'true') return;
    
    mathField.addEventListener('input', (e: any) => {
      mathField.setAttribute('value', e.target.value);
      // Don't trigger handleContentChange during input to prevent re-rendering
    });
    
    mathField.addEventListener('focus', () => {
      setIsEditingMath(true);
      // Add a class to show it's being edited
      mathField.classList.add('editing');
    });
    
    mathField.addEventListener('blur', () => {
      setIsEditingMath(false);
      // Remove editing class
      mathField.classList.remove('editing');
      if (!mathField.getAttribute('value')) {
        mathField.remove();
      } else {
        // Place cursor after the math field when done editing
        const selection = window.getSelection();
        if (selection && contentEditableRef.current) {
          const range = document.createRange();
          
          // Find the next text node or create one if needed
          let nextNode = mathField.nextSibling;
          if (!nextNode || nextNode.nodeType !== Node.TEXT_NODE) {
            // Create a space after the math field if there isn't one
            const spaceNode = document.createTextNode('\u00A0');
            mathField.parentNode?.insertBefore(spaceNode, mathField.nextSibling);
            nextNode = spaceNode;
          }
          
          // Set cursor position after the math field
          range.setStart(nextNode, 0);
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Focus back on the contentEditable
          contentEditableRef.current.focus();
        }
      }
      // Trigger content change after blur
      setTimeout(() => {
        handleContentChange();
      }, 100);
    });
    
    // Mark as having listeners attached
    mathField.dataset.listenersAttached = 'true';
  }, [handleContentChange]);
  
  // Setup math field event listeners for all fields
  const setupMathFieldListeners = useCallback(() => {
    if (!contentEditableRef.current) return;
    
    const mathFields = contentEditableRef.current.querySelectorAll('math-field');
    mathFields.forEach(field => {
      setupSingleMathField(field as HTMLElement);
    });
  }, [setupSingleMathField]);

  // Insert math at cursor position
  const insertMathAtCursor = () => {
    if (!contentEditableRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // If no selection, focus the contentEditable and place cursor at end
      contentEditableRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(contentEditableRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
      return insertMathAtCursor(); // Retry with the new selection
    }
    
    const range = selection.getRangeAt(0);
    
    // Check if the selection is within the contentEditable area
    if (!contentEditableRef.current.contains(range.commonAncestorContainer)) {
      // Focus the contentEditable and place cursor at end
      contentEditableRef.current.focus();
      const newRange = document.createRange();
      newRange.selectNodeContents(contentEditableRef.current);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
      return insertMathAtCursor(); // Retry with the new selection
    }
    
    // Create a new math-field element
    const mathField = document.createElement('math-field');
    const uniqueId = Date.now();
    mathField.setAttribute('data-index', uniqueId.toString());
    mathField.style.display = 'inline-block';
    mathField.style.fontSize = 'inherit';
    mathField.setAttribute('value', '');
    
    // Insert at cursor position
    range.deleteContents();
    range.insertNode(mathField);
    
    // Add a space after the math field for better cursor placement
    const spaceAfter = document.createTextNode('\u00A0'); // Non-breaking space
    mathField.parentNode?.insertBefore(spaceAfter, mathField.nextSibling);
    
    // Setup event listeners for the new math field
    setupSingleMathField(mathField);
    
    // Focus the math field for editing
    setTimeout(() => {
      mathField.focus();
      setIsEditingMath(true);
    }, 0);
  };

  // Setup listeners when content changes
  useEffect(() => {
    if (contentEditableRef.current && noteContent) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        setupMathFieldListeners();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [noteContent, setupMathFieldListeners]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        if (noteContent !== lastSavedContentRef.current && user && currentProblem) {
          saveNote(noteContent);
        }
      }
    };
  }, [noteContent, saveNote, user, currentProblem]);

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
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <Button
          variant="ghost"
          size="sm"
          onClick={insertMathAtCursor}
          className="h-8 px-2 cursor-pointer"
        >
          <FunctionSquare className="h-4 w-4 mr-1" />
          Insert Math
        </Button>
        
        {isSaving && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Saving...
          </span>
        )}
      </div>

      {/* Notes content editable area */}
      <div className="flex-1 px-4 pb-4 pt-4 overflow-auto">
        <div
          ref={contentEditableRef}
          contentEditable
          onInput={() => {
            if (!isEditingMath) {
              handleContentChange();
            }
          }}
          onClick={(e) => {
            // Ensure cursor is properly placed when clicking in empty areas
            const target = e.target as HTMLElement;
            if (target === contentEditableRef.current && !contentEditableRef.current?.textContent) {
              contentEditableRef.current?.focus();
            }
          }}
          onKeyDown={(e) => {
            // Handle special keys if needed
            if (e.key === 'Enter' && e.shiftKey) {
              e.preventDefault();
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const br = document.createElement('br');
                range.deleteContents();
                range.insertNode(br);
                range.setStartAfter(br);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }
          }}
          className={cn(
            "w-full h-full",
            "!border-0 !border-none",
            "bg-white dark:bg-gray-900",
            "!ring-0 !ring-offset-0",
            "focus:!ring-0 focus:!ring-offset-0 focus:!outline-none focus:!border-0",
            "focus-visible:!ring-0 focus-visible:!ring-offset-0 focus-visible:!border-0",
            "!shadow-none",
            "p-0",
            "font-mono text-sm",
            "cursor-text",
            "[&:empty]:before:content-['Type_your_notes_here..._Click_\'Insert_Math\'_to_add_equations.']",
            "[&:empty]:before:text-gray-400 dark:[&:empty]:before:text-gray-500"
          )}
          style={{
            boxShadow: 'none',
            outline: 'none',
            border: 'none',
            minHeight: '100%',
            cursor: 'text'
          }}
        />
      </div>
    </div>
  );
}