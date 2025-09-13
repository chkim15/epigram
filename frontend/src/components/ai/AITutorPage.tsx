"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X } from "lucide-react";
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

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pastedImage, setPastedImage] = useState<PastedImage | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      // Reset to min height to get accurate scrollHeight
      textareaRef.current.style.height = '207px';
      // Set to scrollHeight if content needs more space
      const newHeight = Math.max(207, Math.min(textareaRef.current.scrollHeight, 460));
      textareaRef.current.style.height = `${newHeight}px`;
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
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setPastedImage({
              url: base64,
              name: file.name || 'Pasted Image'
            });
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }
  };

  const removeImage = () => {
    setPastedImage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !pastedImage) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
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
          message: userMessage.content,
          model: 'gemini-2.0-flash', // Fixed model
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

  useEffect(() => {
    if (chatContainerRef.current && messages.length > 0) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full items-center justify-center bg-white dark:bg-gray-900">
      {messages.length === 0 ? (
        // Initial view with centered input
        <div className="w-full max-w-7xl flex flex-col items-center justify-center px-8 h-full">
          <div className="w-full flex flex-col items-center" style={{ marginTop: '-200px' }}>
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
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Type text, or add an image by uploading, pasting, or dragging it here"
                className={cn(
                  "resize-none w-full pr-20 pb-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-xl",
                  pastedImage ? "pt-16" : "pt-3"
                )}
                style={{
                  outline: 'none',
                  boxShadow: 'none',
                  minHeight: '207px',
                  maxHeight: '460px',
                  width: '100%',
                  display: 'block',
                  overflow: 'auto',
                  fontSize: '20px'
                }}
                rows={6}
              />
              
              {/* Image Preview */}
              {pastedImage && (
                <div className="absolute top-3 left-3 right-14">
                  <div className="relative inline-block">
                    <img 
                      src={pastedImage.url} 
                      alt="Pasted image" 
                      className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 object-cover"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-1 -right-1 bg-gray-800 dark:bg-gray-700 text-white rounded-full p-0.5 hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                      aria-label="Remove image"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleSendMessage}
                disabled={(!input.trim() && !pastedImage) || isLoading}
                className="absolute right-2 bottom-2 h-8 px-3 rounded-lg bg-black hover:bg-black/90 disabled:bg-gray-300 dark:disabled:bg-gray-600 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 text-white text-sm font-medium"
              >
                <span>SEND</span>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          </div>
        </div>
      ) : (
        // Chat view
        <div className="w-full max-w-4xl flex flex-col h-full px-4">
          {/* Header */}
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <img src="/epigram_logo.svg" alt="Epigram Logo" className="w-10 h-10 dark:invert" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Epigram</h1>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pb-4" ref={chatContainerRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.role === 'user'
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "bg-gray-100 dark:bg-gray-800"
                    )}
                  >
                    {message.image && (
                      <img 
                        src={message.image} 
                        alt="Attached" 
                        className="max-w-full rounded-lg mb-2"
                      />
                    )}
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <MathContent content={message.content} />
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && !isStreaming && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
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

          {/* Input Area */}
          <div className="py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Type text, or add an image by uploading, pasting, or dragging it here"
                className={cn(
                  "resize-none w-full pr-20 pb-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-xl",
                  pastedImage ? "pt-16" : "pt-3"
                )}
                style={{
                  outline: 'none',
                  boxShadow: 'none',
                  minHeight: pastedImage ? '140px' : '60px',
                  maxHeight: '200px',
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
              
              {/* Image Preview */}
              {pastedImage && (
                <div className="absolute top-3 left-3 right-14">
                  <div className="relative inline-block">
                    <img 
                      src={pastedImage.url} 
                      alt="Pasted image" 
                      className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 object-cover"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute -top-1 -right-1 bg-gray-800 dark:bg-gray-700 text-white rounded-full p-0.5 hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                      aria-label="Remove image"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleSendMessage}
                disabled={(!input.trim() && !pastedImage) || isLoading}
                className="absolute right-2 bottom-2 h-8 px-3 rounded-lg bg-black hover:bg-black/90 disabled:bg-gray-300 dark:disabled:bg-gray-600 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 text-white text-sm font-medium"
              >
                <span>SEND</span>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}