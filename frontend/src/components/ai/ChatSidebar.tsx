"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, MessageCircle, FileText, BookOpen, FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { Problem } from "@/types/database";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  currentProblem: Problem | null;
}

export default function ChatSidebar({ currentProblem }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'solutions' | 'summary'>('chat');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call later)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getSimulatedResponse(userMessage.content),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000);
  };

  const getSimulatedResponse = (userInput: string): string => {
    const responses = [
      "Great question! Let me break this down step by step for you.",
      "I see what you're working on. Here's how I would approach this problem:",
      "That's a common area where students get stuck. Let me explain the concept:",
      "Good thinking! To solve this, we need to consider a few key principles:",
      "This is an excellent example to practice with. Here's the method:",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'solutions', label: 'Solutions', icon: BookOpen },
    { id: 'summary', label: 'Summary', icon: FileSearch }
  ] as const;

  return (
    <div className="flex h-full flex-col">
      {/* Navigation Tabs */}
      <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl m-2 p-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 text-xs h-8 rounded-lg transition-all",
              activeTab === tab.id 
                ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white" 
                : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="h-3 w-3 mr-1" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col">
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 relative">
              {messages.length === 0 && !isLoading ? (
                /* AI Tutor Header - Perfectly centered when no messages */
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Bot className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <h3 className="text-lg font-medium text-gray-400">AI Tutor</h3>
                  </div>
                </div>
              ) : (
                /* Messages when chat has started */
                <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
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
                            "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                            message.role === 'user'
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                          )}
                        >
                          <div className="flex items-start space-x-2">
                            {message.role === 'assistant' && (
                              <Bot className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
                            )}
                            {message.role === 'user' && (
                              <User className="mt-0.5 h-4 w-4 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="leading-relaxed">{message.content}</p>
                              <p className="mt-1 text-xs opacity-70">
                                {message.timestamp.toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800">
                          <div className="flex items-center space-x-2">
                            <Bot className="h-4 w-4 text-blue-600" />
                            <div className="flex space-x-1">
                              <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                              <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                              <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Input */}
            <div className="p-4">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question about math..."
                  className="min-h-[80px] resize-none w-full pr-12 rounded-2xl border border-gray-200 dark:border-gray-700 focus:border-gray-200 dark:focus:border-gray-700 bg-white dark:bg-gray-800 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-0"
                  rows={1}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Other tab content placeholders */}
        {activeTab === 'notes' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-2" />
              <p>Notes feature coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'solutions' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <BookOpen className="h-12 w-12 mx-auto mb-2" />
              <p>Solutions feature coming soon</p>
            </div>
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <FileSearch className="h-12 w-12 mx-auto mb-2" />
              <p>Summary feature coming soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}