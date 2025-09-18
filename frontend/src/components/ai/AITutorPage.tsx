"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X, ImagePlus, Lightbulb, Sparkles } from "lucide-react";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const currentValue = textarea.value;

      // Check if there are actual line breaks in the content
      const lineBreaks = (currentValue.match(/\n/g) || []).length;

      // Determine base height based on current view
      const isInitialView = messages.length === 0;
      const baseHeight = isInitialView ? 90 : 50;

      // Only expand height if there are line breaks
      if (lineBreaks > 0) {
        // Reset to min height to get accurate scrollHeight
        textarea.style.height = `${baseHeight}px`;
        // Expand based on content with line breaks
        const newHeight = Math.max(baseHeight, Math.min(textarea.scrollHeight, 300));
        textarea.style.height = `${newHeight}px`;
      } else {
        // Keep single line at base height - let it scroll horizontally if needed
        textarea.style.height = `${baseHeight}px`;
      }
    }
  };

  const compressImage = (file: File, maxWidth: number = 1200, maxHeight: number = 1200): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    // For initial view: allow text or image, for chat view: only text
    const hasMessages = messages.length > 0;
    if (hasMessages) {
      // Chat view: only allow text
      if (!input.trim() || isLoading) return;
    } else {
      // Initial view: allow text or image
      if ((!input.trim() && !pastedImage) || isLoading) return;
    }

    let messageContent = input.trim();
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
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-h-0 overflow-hidden">
      {messages.length === 0 ? (
        // Initial view with scrollable content
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="w-full max-w-7xl flex flex-col items-center px-8 mx-auto pb-8" style={{ paddingTop: '2rem' }}>
            {/* Large Header */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-4">
                <img src="/epigram_logo.svg" alt="Epigram Logo" className="w-20 h-20 dark:invert" />
                <h1 className="text-6xl font-bold text-gray-900 dark:text-white">Epigram</h1>
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

              {/* Drag overlay indicator */}
              {isDragging && (
                <div className="absolute inset-0 rounded-3xl border-2 border-dashed border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 z-10 flex items-center justify-center pointer-events-none">
                  <p className="text-lg font-medium text-blue-600 dark:text-blue-400">Drop image here</p>
                </div>
              )}

              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                placeholder="Type text, or add an image by uploading, pasting, or dragging it here"
                className={cn(
                  "resize-none w-full pr-24 pb-16 pl-6 rounded-3xl border bg-white dark:bg-gray-800 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-xl",
                  isDragging ? "border-blue-500" : "border-gray-200 dark:border-gray-700",
                  pastedImage ? "pt-[170px]" : "pt-6"
                )}
                style={{
                  outline: 'none',
                  boxShadow: 'none',
                  height: pastedImage ? '300px' : '200px',
                  minHeight: pastedImage ? '300px' : '200px',
                  maxHeight: '600px',
                  width: '100%',
                  display: 'block',
                  overflow: 'auto',
                  fontSize: '20px'
                }}
              />

              {/* Image Preview - Large */}
              {pastedImage && (
                <div className="absolute top-3 left-3 right-3">
                  <div className="relative inline-block">
                    <img
                      src={pastedImage.url}
                      alt="Attached image"
                      className="max-w-[400px] max-h-[150px] rounded-lg object-contain border border-gray-300 dark:border-gray-600"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-1 -right-1 bg-gray-500 hover:bg-gray-600 text-white rounded-full p-0.5 transition-colors cursor-pointer shadow-sm"
                      aria-label="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Upload button */}
              <button
                onClick={triggerFileUpload}
                className="absolute left-4 bottom-4 h-8 w-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer flex items-center justify-center"
                aria-label="Upload image"
              >
                <ImagePlus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>

              <Button
                onClick={handleSendMessage}
                disabled={(!input.trim() && !pastedImage) || isLoading}
                className="absolute right-4 bottom-4 h-8 px-3 rounded-xl bg-black hover:bg-black/90 disabled:bg-gray-300 dark:disabled:bg-gray-600 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 text-white text-sm font-medium"
              >
                <span>SEND</span>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Instructional text */}
            <div className="text-center mt-4 text-gray-500 dark:text-gray-400 text-sm">
              Send one question at a time for optimal result<br />
              ⌘ + control + Shift + 4 to take a screenshot<br />
              ⌘ + V to paste image
            </div>

            {/* Usage Tips */}
            <div className="max-w-3xl mx-auto mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Usage Tips
              </h3>

              <div className="space-y-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-500" />
                    Active Learning Focus
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    This LLM is designed to support active learning. It won&apos;t immediately give full solutions. Instead, it will guide you with hints and prompting questions so you can work through the steps yourself.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                    <Send className="h-4 w-4 text-green-500" />
                    Requesting Full Solutions
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-2">
                    If you already understand the core idea of a problem and don&apos;t want to go through all the algebra, you can directly ask for the complete solution.
                  </p>
                  <div className="bg-white dark:bg-gray-900 rounded-2xl p-2">
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-1">Example input:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 italic">
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
                      <div className="max-w-fit rounded-3xl px-4 py-3 bg-gray-200 text-black dark:bg-gray-700 dark:text-white">
                        {message.image && (
                          <img
                            src={message.image}
                            alt="Attached"
                            className="h-32 max-w-full rounded-lg mb-2 object-contain border border-gray-300 dark:border-gray-600"
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
                      <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-6">
                        <div className="prose prose-base dark:prose-invert max-w-none">
                          <MathContent content={message.content} />
                        </div>
                      </div>
                    </div>
                  )
                ))}
                {isLoading && !isStreaming && (
                  <div className="w-full">
                    <div className="w-full bg-white dark:bg-gray-800 rounded-lg p-6">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          {/* Fixed Input Area */}
          <div className="flex-shrink-0 bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-3">
              <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answers or ask follow-up questions"
                className="resize-none w-full pr-20 pt-3 pb-3 pl-4 rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-lg"
                style={{
                  outline: 'none',
                  boxShadow: 'none',
                  height: '50px',
                  minHeight: '50px',
                  width: '100%',
                  display: 'block',
                  overflow: 'auto'
                }}
                onFocus={(e) => {
                  e.target.style.outline = 'none';
                  e.target.style.boxShadow = 'none';
                }}
                rows={1}
              />

              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 h-8 px-3 rounded-xl bg-black hover:bg-black/90 disabled:bg-gray-300 dark:disabled:bg-gray-600 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 text-white text-sm font-medium"
              >
                <span>SEND</span>
                <Send className="h-3.5 w-3.5" />
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