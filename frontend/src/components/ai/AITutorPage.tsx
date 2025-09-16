"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MathContent } from "@/lib/utils/katex";

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
}

const AITutorPage = forwardRef<AITutorPageRef>((_, ref) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pastedImage, setPastedImage] = useState<PastedImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const currentValue = textarea.value;

      // Check if there are actual line breaks in the content
      const lineBreaks = (currentValue.match(/\n/g) || []).length;

      // Only expand height if there are line breaks
      if (lineBreaks > 0) {
        // Reset to min height to get accurate scrollHeight
        textarea.style.height = '90px';
        // Expand based on content with line breaks
        const newHeight = Math.max(90, Math.min(textarea.scrollHeight, 300));
        textarea.style.height = `${newHeight}px`;
      } else {
        // Keep single line at base height of 90px - let it scroll horizontally if needed
        textarea.style.height = '90px';
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
  };

  useImperativeHandle(ref, () => ({
    resetToInitialView
  }));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !pastedImage) || isLoading) return;

    let messageContent = input.trim();
    let apiMessageContent = messageContent;

    // For API: provide default text when only image is sent (API needs some text content)
    if (pastedImage && !messageContent) {
      apiMessageContent = "Guide me through understanding this content using active learning principles";
      messageContent = ""; // Keep display content empty
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

  // Smart scroll behavior - only scroll for user messages, not during streaming
  useEffect(() => {
    // Don't auto-scroll if we're currently streaming an AI response
    if (!isStreaming) {
      const scrollContainer = document.querySelector('.chat-messages-area');
      if (scrollContainer && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        // Only scroll for user messages
        if (lastMessage.role === 'user') {
          // Find the last user message element
          const messageElements = scrollContainer.querySelectorAll('.flex.justify-end');
          if (messageElements.length > 0) {
            const lastUserMessageElement = messageElements[messageElements.length - 1] as HTMLElement;
            // Scroll so the user message appears at the top of the viewport
            lastUserMessageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    }
  }, [messages, isStreaming]);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 min-h-0 overflow-hidden">
      {messages.length === 0 ? (
        // Initial view with centered input
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-7xl flex flex-col items-center px-8" style={{ marginTop: '-200px' }}>
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
                  "resize-none w-full pr-20 pb-12 rounded-3xl border bg-white dark:bg-gray-800 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-xl",
                  isDragging ? "border-blue-500" : "border-gray-200 dark:border-gray-700",
                  pastedImage ? "pt-[170px]" : "pt-3"
                )}
                style={{
                  outline: 'none',
                  boxShadow: 'none',
                  minHeight: pastedImage ? '350px' : '207px',
                  maxHeight: '600px',
                  width: '100%',
                  display: 'block',
                  overflow: 'auto',
                  fontSize: '20px'
                }}
                rows={6}
              />

              {/* Image Preview - Large */}
              {pastedImage && (
                <div className="absolute top-3 left-3 right-3">
                  <div className="relative inline-block">
                    <img
                      src={pastedImage.url}
                      alt="Attached image"
                      className="max-w-[400px] max-h-[150px] rounded-lg object-contain"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors cursor-pointer shadow-lg"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Upload button */}
              <button
                onClick={triggerFileUpload}
                className="absolute left-2 bottom-2 h-8 w-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer flex items-center justify-center"
                aria-label="Upload image"
              >
                <ImagePlus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>

              <Button
                onClick={handleSendMessage}
                disabled={(!input.trim() && !pastedImage) || isLoading}
                className="absolute right-2 bottom-2 h-8 px-3 rounded-xl bg-black hover:bg-black/90 disabled:bg-gray-300 dark:disabled:bg-gray-600 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 text-white text-sm font-medium"
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
                            className="max-w-[80%] rounded-lg mb-2"
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
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Drop image here</p>
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
                  "resize-none w-full pr-20 pb-12 rounded-3xl border bg-white dark:bg-gray-800 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-xl",
                  isDragging ? "border-blue-500" : "border-gray-200 dark:border-gray-700",
                  pastedImage ? "pt-20" : "pt-3"
                )}
                style={{
                  outline: 'none',
                  boxShadow: 'none',
                  height: '90px',
                  width: '100%',
                  display: 'block',
                  overflow: 'auto',
                  fontSize: '20px'
                }}
                onFocus={(e) => {
                  e.target.style.outline = 'none';
                  e.target.style.boxShadow = 'none';
                }}
                rows={2}
              />

              {/* Image Preview - Smaller for chat view */}
              {pastedImage && (
                <div className="absolute top-3 left-3 right-14">
                  <div className="relative inline-block">
                    <img
                      src={pastedImage.url}
                      alt="Attached image"
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 transition-colors cursor-pointer shadow-lg"
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
                className="absolute left-2 bottom-2 h-8 w-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer flex items-center justify-center"
                aria-label="Upload image"
              >
                <ImagePlus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>

              <Button
                onClick={handleSendMessage}
                disabled={(!input.trim() && !pastedImage) || isLoading}
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