"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, X, ImagePlus, Lightbulb, Sparkles, Sigma, MessageSquare } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { MathContent } from "@/lib/utils/katex";
import { supabase } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: string;
}

interface PastedImage {
  url: string;
  name: string;
}

interface MathFieldElement extends HTMLElement {
  value?: string;
  getValue?: () => string;
}

export interface AITutorPageRef {
  resetToInitialView: () => void;
  getHasMessages: () => boolean;
  restoreSession: (sessionId: string) => void;
}

interface AITutorPageProps {
  initialSessionId?: string;
}

const AITutorPage = forwardRef<AITutorPageRef, AITutorPageProps>(({ initialSessionId }, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pastedImage, setPastedImage] = useState<PastedImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messageOrder, setMessageOrder] = useState(0);
  // Start with loading state if we have an initial session to restore
  const [isRestoringSession, setIsRestoringSession] = useState(!!initialSessionId);
  const [isEditingMath, setIsEditingMath] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const chatContentEditableRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  // Import MathLive when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('mathlive').then(({ MathfieldElement }) => {
        if (!customElements.get('math-field')) {
          try {
            customElements.define('math-field', MathfieldElement);
          } catch (err) {
            console.warn('MathLive already registered:', err);
          }
        }
      }).catch(err => {
        console.error('Failed to load MathLive:', err);
      });
    }
  }, []);

  const compressImage = (file: File, maxWidth: number = 1200, maxHeight: number = 1200): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
          resolve(compressedBase64);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const processImageFile = async (file: File) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid image file (PNG, JPG, JPEG, WebP, or GIF)');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert('Image size must be less than 10MB');
      return;
    }

    try {
      // Compress image before converting to base64
      const compressedBase64 = await compressImage(file);

      // Check if compressed image is still too large (should be under 900KB for safety)
      if (compressedBase64.length > 900000) {
        // Try with more compression
        const moreCompressed = await compressImage(file, 800, 800);
        setPastedImage({
          url: moreCompressed,
          name: file.name || 'Uploaded Image'
        });
      } else {
        setPastedImage({
          url: compressedBase64,
          name: file.name || 'Uploaded Image'
        });
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try a smaller image.');
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await processImageFile(file);
        }
        return;
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the textarea element itself
    if (e.target === e.currentTarget) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await processImageFile(file);
      }
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processImageFile(files[0]);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setPastedImage(null);
  };

  // Insert math field at cursor position in contentEditable (for chat view)
  const insertMathFieldInChat = () => {
    if (!chatContentEditableRef.current) return;

    // Clean up any empty math fields first
    const existingMathFields = chatContentEditableRef.current.querySelectorAll('math-field');
    existingMathFields.forEach(field => {
      if (!field.getAttribute('value')) {
        field.remove();
      }
    });

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // If no selection, focus the contentEditable and place cursor at end
      chatContentEditableRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(chatContentEditableRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
      return insertMathFieldInChat(); // Retry with the new selection
    }

    const range = selection.getRangeAt(0);

    // Check if the selection is within the contentEditable area
    if (!chatContentEditableRef.current.contains(range.commonAncestorContainer)) {
      // Focus the contentEditable and place cursor at end
      chatContentEditableRef.current.focus();
      const newRange = document.createRange();
      newRange.selectNodeContents(chatContentEditableRef.current);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
      return insertMathFieldInChat(); // Retry with the new selection
    }

    // Create a new math-field element
    const mathField = document.createElement('math-field');
    const uniqueId = Date.now();
    mathField.setAttribute('data-index', uniqueId.toString());
    mathField.style.display = 'inline-block';
    mathField.style.fontSize = 'inherit';
    mathField.setAttribute('value', '');

    // Disable virtual keyboard and menu
    mathField.setAttribute('virtual-keyboard-mode', 'off');
    mathField.setAttribute('menu', 'false');

    // Insert the math field at cursor position
    range.deleteContents();
    range.insertNode(mathField);

    // Add a space after the math field for better cursor placement
    const spaceAfter = document.createTextNode('\u00A0'); // Non-breaking space
    mathField.parentNode?.insertBefore(spaceAfter, mathField.nextSibling);

    // Setup event listener for the math field (same as initial view)
    setupSingleMathField(mathField);

    // Focus the math field for editing
    setTimeout(() => {
      mathField.focus();
      setIsEditingMath(true);
    }, 0);
  };

  // Insert math field at cursor position in contentEditable (for initial view)
  const insertMathField = () => {
    if (!contentEditableRef.current) return;

    // Clean up any empty math fields first
    const existingMathFields = contentEditableRef.current.querySelectorAll('math-field');
    existingMathFields.forEach(field => {
      if (!field.getAttribute('value')) {
        field.remove();
      }
    });

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // If no selection, focus the contentEditable and place cursor at end
      contentEditableRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(contentEditableRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
      return insertMathField(); // Retry with the new selection
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
      return insertMathField(); // Retry with the new selection
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

    // Setup event listener for the math field
    setupSingleMathField(mathField);

    // Focus the math field for editing
    setTimeout(() => {
      mathField.focus();
      setIsEditingMath(true);
    }, 0);
  };

  // Setup event listeners for a single math field
  const setupSingleMathField = (mathField: HTMLElement) => {
    mathField.addEventListener('focusin', () => {
      setIsEditingMath(true);
      mathField.classList.remove('inactive');
    });

    mathField.addEventListener('focusout', (e: FocusEvent) => {
      // Check if focus is moving to a related element (like dropdown menu)
      const relatedTarget = e.relatedTarget as HTMLElement;

      // If the related target is part of the math field or its UI, don't mark as inactive
      if (relatedTarget && (
        mathField.contains(relatedTarget) ||
        relatedTarget.closest('.ML__popover') ||
        relatedTarget.closest('[role="menu"]')
      )) {
        return;
      }

      // Add a delay to allow menu interactions
      setTimeout(() => {
        // Check if the math field or any popover has focus
        const activeElement = document.activeElement;
        const hasMenuOpen = document.querySelector('.ML__popover:not([style*="display: none"])');
        const hasDropdown = document.querySelector('[role="menu"]:not([style*="display: none"])');

        if (!mathField.contains(activeElement as Node) && !hasMenuOpen && !hasDropdown) {
          setIsEditingMath(false);
          mathField.classList.add('inactive');

          // Get the actual value from the math field
          const mathFieldElement = mathField as MathFieldElement;
          const value = mathFieldElement.value || mathFieldElement.getValue?.() || '';

          // Only remove if truly empty
          if (!value || value.trim() === '') {
            mathField.remove();
          }
        }
      }, 150); // Slightly longer delay to ensure menu interactions complete
    });

    // Listen for input changes to update the value attribute
    mathField.addEventListener('input', () => {
      const mathFieldElement = mathField as MathFieldElement;
      const value = mathFieldElement.value || mathFieldElement.getValue?.() || '';
      mathField.setAttribute('value', value);
    });

    // Watch for menu interactions using MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Check if a menu was added to the DOM
          const hasMenu = document.querySelector('.ML__popover') || document.querySelector('[role="menu"]');
          if (hasMenu) {
            // Keep field active while menu is open
            mathField.classList.remove('inactive');
          }
        }
      });
    });

    // Observe changes to the body for menu additions
    observer.observe(document.body, { childList: true, subtree: true });

    // Store observer reference for cleanup
    const mathFieldWithObserver = mathField as HTMLElement & { __observer?: MutationObserver };
    mathFieldWithObserver.__observer = observer;
  };

  // Convert content editable HTML to storage format with LaTeX
  const htmlToStorage = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    let result = '';
    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent || '';
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toLowerCase();

        if (tagName === 'math-field') {
          const mathFieldElement = element as MathFieldElement;
          const latex = mathFieldElement.value || mathFieldElement.getValue?.() || element.getAttribute('value') || element.textContent || '';
          result += `$${latex}$`;
        } else if (tagName === 'br') {
          result += '\n';
        } else if (tagName === 'div' || tagName === 'p') {
          for (const child of Array.from(element.childNodes)) {
            processNode(child);
          }
          result += '\n';
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

  const resetToInitialView = () => {
    setMessages([]);
    setInput('');
    setPastedImage(null);
    setIsLoading(false);
    setIsStreaming(false);
    setSessionId(null);
    setMessageOrder(0);
  };

  // Upload image to Supabase Storage
  const uploadImageToStorage = async (imageDataUrl: string): Promise<string | null> => {
    if (!user) return null;

    try {
      // Convert base64 to blob
      const response = await fetch(imageDataUrl);
      const blob = await response.blob();

      // Generate unique file name
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from('tutor-images')
        .upload(fileName, blob, {
          contentType: 'image/jpeg'
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('tutor-images')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Failed to upload image:', error);
      return null;
    }
  };

  // Create a new tutor session
  const createTutorSession = async (imageUrl: string | null, initialText: string | null): Promise<string | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('tutor_sessions')
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          initial_text: initialText,
          title: initialText || 'New tutoring session'
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Failed to create tutor session:', error);
      return null;
    }
  };

  // Save message to tutor_messages table
  const saveTutorMessage = async (
    role: 'user' | 'assistant',
    content: string,
    sessionId: string
  ) => {
    if (!user) return;

    try {
      await supabase
        .from('tutor_messages')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          role,
          content,
          message_order: messageOrder
        });

      setMessageOrder(prev => prev + 1);
    } catch (error) {
      console.error('Failed to save tutor message:', error);
    }
  };

  const restoreSession = async (sessionIdToRestore: string) => {
    try {
      // Fetch session details
      const { data: session, error: sessionError } = await supabase
        .from('tutor_sessions')
        .select('*')
        .eq('id', sessionIdToRestore)
        .single();

      if (sessionError) throw sessionError;
      if (!session) return;

      // Set session ID
      setSessionId(sessionIdToRestore);

      // Fetch messages for this session
      const { data: tutorMessages, error: messagesError } = await supabase
        .from('tutor_messages')
        .select('*')
        .eq('session_id', sessionIdToRestore)
        .order('message_order', { ascending: true });

      if (messagesError) throw messagesError;

      // Convert to Message format and include the initial image
      const restoredMessages: Message[] = [];

      // Add initial message with image if available
      if (session.image_url) {
        restoredMessages.push({
          id: `initial-${sessionIdToRestore}`,
          role: 'user',
          content: session.initial_text || '',
          timestamp: new Date(session.created_at),
          image: session.image_url
        });
      }

      // Add the rest of the messages
      if (tutorMessages) {
        tutorMessages.forEach(msg => {
          restoredMessages.push({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: new Date(msg.created_at)
          });
        });
      }

      setMessages(restoredMessages);

      // Set the message order to continue from where we left off
      const maxOrder = tutorMessages?.reduce((max, msg) =>
        Math.max(max, msg.message_order || 0), 0) || 0;
      setMessageOrder(maxOrder + 1);
    } catch (error) {
      console.error('Error restoring session:', error);
    }
  };

  useImperativeHandle(ref, () => ({
    resetToInitialView,
    getHasMessages: () => messages.length > 0,
    restoreSession
  }));

  // Restore session if initialSessionId is provided
  useEffect(() => {
    if (initialSessionId) {
      restoreSession(initialSessionId).finally(() => {
        setIsRestoringSession(false);
      });
    }
  }, [initialSessionId]);

  const handleSendMessage = async () => {
    // For initial view: allow text or image, for chat view: only text
    const hasMessages = messages.length > 0;

    // Get content from contentEditable
    let messageContent = '';
    if (!hasMessages && contentEditableRef.current) {
      messageContent = htmlToStorage(contentEditableRef.current.innerHTML);
    } else if (hasMessages && chatContentEditableRef.current) {
      messageContent = htmlToStorage(chatContentEditableRef.current.innerHTML);
    } else {
      messageContent = input.trim();
    }

    if (hasMessages) {
      // Chat view: only allow text
      if (!messageContent || isLoading) return;
    } else {
      // Initial view: allow text or image
      if ((!messageContent && !pastedImage) || isLoading) return;
    }

    let apiMessageContent = messageContent;
    let currentSessionId = sessionId;

    // For API: provide default text when only image is sent (API needs some text content)
    if (pastedImage && !messageContent) {
      apiMessageContent = "If the image shows a math problem, help me solve it. If not, help me understand the content.";
      messageContent = ""; // Keep display content empty
    }

    // If this is the first message, create a session
    if (!currentSessionId) {
      let imageUrl: string | null = null;

      // Upload image if present
      if (pastedImage) {
        imageUrl = await uploadImageToStorage(pastedImage.url);
      }

      // Always create a session (with or without image)
      const newSessionId = await createTutorSession(imageUrl, messageContent || null);
      if (newSessionId) {
        currentSessionId = newSessionId;
        setSessionId(newSessionId);
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
      image: pastedImage?.url,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    // Clear the contentEditable
    if (!hasMessages && contentEditableRef.current) {
      contentEditableRef.current.innerHTML = '';
    } else if (hasMessages && chatContentEditableRef.current) {
      chatContentEditableRef.current.innerHTML = '';
    }
    setPastedImage(null);
    setIsLoading(true);

    // Save user message if we have a session
    if (currentSessionId && messageContent) {
      await saveTutorMessage('user', messageContent, currentSessionId);
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: apiMessageContent,
          model: 'gpt-5', // Using GPT-5 for AI Tutor
          conversationHistory: messages,
          currentProblem: null, // No problem context in AI Tutor
          subproblems: [],
          solutions: [],
          subproblemSolutions: {},
          image: userMessage.image,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/stream-event')) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        setIsStreaming(true);

        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiResponse]);

        let fullContent = '';

        if (reader) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.substring(6));
                    if (data.content) {
                      fullContent += data.content;
                      setMessages(prev =>
                        prev.map((msg, index) =>
                          index === prev.length - 1
                            ? { ...msg, content: msg.content + data.content }
                            : msg
                        )
                      );
                    } else if (data.done) {
                      setIsStreaming(false);
                      break;
                    } else if (data.error) {
                      throw new Error(data.error);
                    }
                  } catch (e) {
                    console.error('Error parsing SSE data:', e);
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
            // Save assistant message if we have a session
            if (currentSessionId && fullContent) {
              await saveTutorMessage('assistant', fullContent, currentSessionId);
            }
          }
        }
      } else {
        const data = await response.json();
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || data.message || 'No response from AI',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiResponse]);

        // Save assistant message if we have a session
        if (currentSessionId && aiResponse.content) {
          await saveTutorMessage('assistant', aiResponse.content, currentSessionId);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // Scroll to bottom only when user sends a message
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Only scroll for user messages to show what they just sent
      if (lastMessage.role === 'user') {
        const scrollContainer = document.querySelector('.chat-messages-area');
        if (scrollContainer) {
          // Scroll to bottom to show the user's message
          requestAnimationFrame(() => {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollHeight,
              behavior: 'smooth'
            });
          });
        }
      }
    }
  }, [messages]);

  // Show loading state while restoring session
  if (isRestoringSession) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: 'var(--foreground)', borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      {messages.length === 0 ? (
        // Initial view with scrollable content
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-7xl flex flex-col items-center px-8 mx-auto pb-8" style={{ paddingTop: '2rem' }}>
            {/* Large Header */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-4">
                <Image
                  src="/epigram_logo.svg"
                  alt="Epigram Logo"
                  width={80}
                  height={80}
                  style={{
                    filter: 'var(--logo-filter, none)'
                  }}
                />
                <h1 className="text-6xl font-bold" style={{ color: 'var(--epigram-text-color)' }}>Epigram</h1>
              </div>
            </div>

            {/* Centered Input Area */}
            <div className="w-full" style={{ maxWidth: '810px', margin: '0 auto' }}>
            <div className="relative">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Input wrapper with constrained height */}
              <div className={cn(
                     "relative rounded-2xl border overflow-hidden",
                     isDragging && "border-blue-500"
                   )} style={{
                     backgroundColor: 'var(--input)',
                     borderColor: isDragging ? 'var(--primary)' : 'var(--border)'
                   }}>

                {/* Drag overlay indicator */}
                {isDragging && (
                  <div className="absolute inset-0 border-2 border-dashed border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 z-10 flex items-center justify-center pointer-events-none rounded-2xl">
                    <p className="text-lg font-medium text-blue-600 dark:text-blue-400">Drop image here</p>
                  </div>
                )}

                {/* ContentEditable area with max height to stop before buttons */}
                <div
                  ref={contentEditableRef}
                  contentEditable
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isEditingMath) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  onPaste={handlePaste}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onInput={() => {
                    if (!isEditingMath) {
                      const content = contentEditableRef.current?.innerHTML || '';
                      setInput(htmlToStorage(content));
                    }
                  }}
                  className={cn(
                    "resize-none w-full pr-24 pl-6 text-xl ai-tutor-input",
                    pastedImage ? "pt-[170px]" : "pt-6"
                  )}
                  style={{
                    backgroundColor: 'var(--input)',
                    color: 'var(--foreground)',
                    outline: 'none',
                    boxShadow: 'none',
                    height: pastedImage ? '240px' : '140px',
                    maxHeight: pastedImage ? '240px' : '140px',
                    width: '100%',
                    display: 'block',
                    overflow: 'auto',
                    fontSize: '20px',
                    paddingBottom: '24px',
                    borderRadius: '1rem'
                  }}
                  data-placeholder="Type text, or add an image by uploading, pasting, or dragging it here"
                />

                {/* Image Preview - Large */}
                {pastedImage && (
                  <div className="absolute top-3 left-3 right-3">
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pastedImage.url}
                        alt="Attached image"
                        className="max-w-[400px] max-h-[150px] rounded-xl object-contain border"
                        style={{ borderColor: 'var(--border)' }}
                      />
                      <button
                        onClick={removeImage}
                        className="absolute -top-1 -right-1 rounded-full p-0.5 transition-colors cursor-pointer shadow-sm"
                        style={{ backgroundColor: 'var(--muted-foreground)', color: 'white' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--foreground)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--muted-foreground)'}
                        aria-label="Remove image"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom button row - no separator, no background */}
                <div className="relative h-14 flex items-center px-4" style={{ backgroundColor: 'var(--input)' }}>
                  {/* Upload button */}
                  <button
                    onClick={triggerFileUpload}
                    className="h-8 w-16 rounded-xl border cursor-pointer flex items-center justify-center group mr-2 relative"
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
                    aria-label="Upload image"
                  >
                    <ImagePlus className="h-5 w-5" strokeWidth={2} style={{ color: 'var(--foreground)' }} />
                    {/* Tooltip */}
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-sm border" style={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)' }}>
                      Image
                    </div>
                  </button>

                  {/* Math input button */}
                  <button
                    onClick={insertMathField}
                    className="h-8 w-16 rounded-xl border cursor-pointer flex items-center justify-center group relative"
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
                    aria-label="Insert math equation"
                  >
                    <Sigma className="h-5 w-5" strokeWidth={2} style={{ color: 'var(--foreground)' }} />
                    {/* Tooltip */}
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-sm border" style={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)' }}>
                      Math Input
                    </div>
                  </button>

                  {/* Send button */}
                  <Button
                    onClick={handleSendMessage}
                    disabled={(!input && !pastedImage) || isLoading}
                    className="ml-auto h-10 w-10 rounded-xl cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
                    style={{
                      backgroundColor: (!input && !pastedImage) || isLoading ? 'var(--muted)' : 'var(--primary)'
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.opacity = '0.9';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.opacity = '1';
                      }
                    }}
                  >
                    <ArrowUp className="!w-[22px] !h-[22px] text-white" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Instructional text */}
            <div className="text-center mt-4 text-sm" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
              Send one question at a time for optimal result<br />
              ⌘ + control + Shift + 4 to take a screenshot<br />
              ⌘ + V to paste image
            </div>

            {/* Usage Tips */}
            <div className="max-w-3xl mt-8 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                <Sparkles className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                Usage Tips
              </h3>

              <div className="space-y-3">
                <div className="rounded-2xl p-4 border" style={{ borderColor: 'var(--border)' }}>
                  <h4 className="font-medium mb-1 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    <Lightbulb className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                    Active Learning Focus
                  </h4>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                    This LLM is designed to support active learning. It won&apos;t immediately give full solutions. Instead, it will guide you with hints and prompting questions so you can work through the steps yourself.
                  </p>
                </div>

                <div className="rounded-2xl p-4 border" style={{ borderColor: 'var(--border)' }}>
                  <h4 className="font-medium mb-1 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                    <MessageSquare className="h-4 w-4" style={{ color: 'var(--primary)' }} />
                    Requesting Full Solutions
                  </h4>
                  <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--foreground)', opacity: 0.7 }}>
                    If you already understand the core idea of a problem and don&apos;t want to go through all the algebra, you can directly ask for the complete solution.
                  </p>
                  <div className="rounded-2xl p-2" style={{ backgroundColor: 'var(--secondary)' }}>
                    <p className="text-xs mb-1" style={{ color: 'var(--foreground)', opacity: 0.6 }}>Example input:</p>
                    <p className="text-sm italic" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                      &quot;I already understand the main idea of this problem. Please provide the complete step-by-step solution.&quot;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      ) : (
        // Chat view
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar chat-messages-area min-h-0" ref={chatContainerRef}>
            <div className="max-w-4xl mx-auto px-4 space-y-4 py-4">
                {messages.map((message) => (
                  message.role === 'user' ? (
                    // User message - keep as bubble on right
                    <div key={message.id} className="flex justify-end">
                      <div className="max-w-fit rounded-xl px-4 py-3" style={{ backgroundColor: 'var(--sidebar-accent)', color: 'var(--sidebar-accent-foreground)' }}>
                        {message.image && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={message.image}
                            alt="Attached"
                            className="h-32 max-w-full rounded-xl mb-2 object-contain border"
                            style={{ borderColor: 'var(--border)' }}
                          />
                        )}
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <MathContent content={message.content} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // AI response - full width with white background
                    <div key={message.id} className="w-full">
                      <div className="w-full rounded-xl p-6" style={{ backgroundColor: 'var(--background)' }}>
                        <div className="prose prose-base dark:prose-invert max-w-none">
                          <MathContent content={message.content} />
                        </div>
                      </div>
                    </div>
                  )
                ))}
                {isLoading && !isStreaming && (
                  <div className="w-full">
                    <div className="w-full rounded-xl p-6" style={{ backgroundColor: 'var(--background)' }}>
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]" style={{ backgroundColor: 'var(--muted-foreground)' }}></div>
                        <div className="h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]" style={{ backgroundColor: 'var(--muted-foreground)' }}></div>
                        <div className="h-2 w-2 animate-bounce rounded-full" style={{ backgroundColor: 'var(--muted-foreground)' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          {/* Fixed Input Area */}
          <div className="flex-shrink-0" style={{ backgroundColor: 'var(--background)' }}>
            <div className="max-w-4xl mx-auto px-4 py-3">
              <div className="flex items-center gap-2 rounded-2xl border px-2" style={{ backgroundColor: 'var(--input)', borderColor: 'var(--border)' }}>
                {/* Math input button */}
                <button
                  onClick={insertMathFieldInChat}
                  className="h-8 w-10 rounded-xl border cursor-pointer flex items-center justify-center group flex-shrink-0 relative"
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
                  aria-label="Insert math equation"
                >
                  <Sigma className="h-5 w-5" strokeWidth={2} style={{ color: 'var(--foreground)' }} />
                  {/* Tooltip */}
                  <div
                    className="absolute bottom-10 left-1/2 transform -translate-x-1/2 px-2 py-1 text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-sm"
                    style={{
                      backgroundColor: 'var(--popover)',
                      borderColor: 'var(--border)',
                      color: 'var(--popover-foreground)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    Math Input
                  </div>
                </button>

                {/* ContentEditable for chat input */}
                <div
                  ref={chatContentEditableRef}
                  contentEditable
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isEditingMath) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  onInput={() => {
                    if (!isEditingMath) {
                      const content = chatContentEditableRef.current?.innerHTML || '';
                      setInput(htmlToStorage(content));
                    }
                  }}
                  className="flex-1 min-h-[50px] max-h-[150px] overflow-y-auto py-3 px-2 outline-none bg-transparent text-lg custom-scrollbar chat-input-editable"
                  style={{
                    outline: 'none',
                    boxShadow: 'none',
                    fontSize: '18px',
                    lineHeight: '1.5'
                  }}
                  data-placeholder="Type your answers or ask follow-up questions"
                />

                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="h-8 w-8 mr-1 rounded-xl cursor-pointer disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: (!input.trim() || isLoading) ? 'var(--muted)' : 'var(--primary)'
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.opacity = '0.9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.opacity = '1';
                    }
                  }}
                >
                <ArrowUp className="h-4 w-4 text-white" />
              </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AITutorPage.displayName = 'AITutorPage';

export default AITutorPage;