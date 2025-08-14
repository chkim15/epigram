"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, Bot, MessageCircle, FileText, BookOpen, FileSearch, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProblemStore } from "@/stores/problemStore";
import { MathContent } from "@/lib/utils/katex";
import PDFViewer from "@/components/pdf/PDFViewer";
import { getSamplePDFUrl } from "@/lib/utils/pdf";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  image?: string; // Base64 image data
}

interface LLMModel {
  id: string;
  name: string;
  isPremium?: boolean;
}

interface ChatSidebarProps {}

export default function ChatSidebar({}: ChatSidebarProps) {
  // Get current problem from store
  const { currentProblem, currentDocument } = useProblemStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'solutions' | 'summary'>('chat');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [isStreaming, setIsStreaming] = useState(false);
  const [pastedImage, setPastedImage] = useState<{ url: string; file: File } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Available LLM models
  const llmModels: LLMModel[] = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gpt-5-nano', name: 'GPT-5 Nano' },
    { id: 'gpt-5-mini', name: 'GPT-5 Mini' },
  ];
  
  // Get the display name for the selected model
  const getModelDisplayName = (modelId: string) => {
    const model = llmModels.find(m => m.id === modelId);
    return model ? model.name : 'Select model';
  };

  // Auto-scroll to bottom only for user messages, not during streaming
  useEffect(() => {
    // Don't auto-scroll if we're currently streaming an AI response
    if (!isStreaming) {
      const scrollContainer = document.querySelector('.chat-messages-area');
      if (scrollContainer && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        // Only scroll for user messages
        if (lastMessage.role === 'user') {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }
  }, [messages, isStreaming]);

  const handleSendMessage = async () => {
    if ((!input.trim() && !pastedImage) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
      model: selectedModel,
      image: pastedImage?.url,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setPastedImage(null);
    setIsLoading(true);

    try {
      // Call the real API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          model: selectedModel,
          conversationHistory: messages,
          currentProblem: currentProblem || null,
          image: userMessage.image,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      // Check if response is streaming (for GPT models) or regular JSON (for Gemini)
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('text/stream-event')) {
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        // Set streaming flag to true
        setIsStreaming(true);
        
        // Create initial AI message with empty content
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          model: selectedModel,
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
                      // Update the last message with new content
                      setMessages(prev => 
                        prev.map((msg, index) => 
                          index === prev.length - 1 
                            ? { ...msg, content: msg.content + data.content }
                            : msg
                        )
                      );
                    } else if (data.done) {
                      // Stream is complete
                      setIsStreaming(false);
                      break;
                    } else if (data.error) {
                      throw new Error(data.error);
                    }
                  } catch (parseError) {
                    console.warn('Failed to parse streaming data:', parseError);
                  }
                }
              }
            }
          } finally {
            reader.releaseLock();
            setIsStreaming(false);
          }
        }
      } else {
        // Handle regular JSON response (Gemini)
        const data = await response.json();
        
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          model: selectedModel,
        };
        
        setMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      
      // Fallback error message
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        model: selectedModel,
      };
      
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
          // Convert to base64 for preview
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            setPastedImage({ url: base64, file });
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  const removeImage = () => {
    setPastedImage(null);
  };

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'solutions', label: 'Solutions', icon: BookOpen },
    { id: 'summary', label: 'Summary', icon: FileSearch }
  ] as const;

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Navigation Tabs */}
      <div className="flex-shrink-0 flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl m-2 p-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            className={cn(
              "flex-1 text-xs h-8 rounded-lg transition-all cursor-pointer",
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
      <div className="flex-1 min-h-0">
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col">
            {/* Messages Area - Scrollable */}
            <div className="flex-1 min-h-0 overflow-auto chat-messages-area">
              {messages.length === 0 && !isLoading ? (
                /* AI Tutor Header - Perfectly centered when no messages */
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Bot className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <h3 className="text-lg font-medium text-gray-400">AI Tutor</h3>
                  </div>
                </div>
              ) : (
                /* Messages when chat has started */
                <div className="p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === 'user' ? (
                        <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100">
                          <p className="leading-relaxed">{message.content}</p>
                        </div>
                      ) : (
                        <div className="max-w-[90%] w-full">
                          <div className="prose prose-sm max-w-none dark:prose-invert text-gray-900 dark:text-gray-100">
                            <MathContent 
                              content={message.content} 
                              documentId={currentDocument?.document_id}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex space-x-1">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                        <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fixed Input Area - Always Visible */}
            <div className="flex-shrink-0 bg-white dark:bg-gray-900 p-4">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="Ask a question about math..."
                  className={cn(
                    "chat-input-textarea resize-none w-full pr-12 pb-8 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 placeholder:text-gray-500 dark:placeholder:text-gray-400",
                    pastedImage ? "min-h-[140px] pt-16" : "min-h-[90px] pt-3"
                  )}
                  style={{
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.outline = 'none';
                    e.target.style.boxShadow = 'none';
                  }}
                  rows={1}
                />
                
                {/* Image Preview Inside Input */}
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
                
                {/* LLM Model Selector - Inside the input box */}
                <div className="absolute bottom-2 left-3">
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger 
                      size="sm"
                      className="!border-none !shadow-none !h-6 px-2 py-0 text-xs text-gray-500 dark:text-gray-400 bg-transparent hover:bg-gray-100/50 dark:hover:bg-gray-700/30 focus:!border-none focus:!outline-none focus:!ring-0 focus:!ring-offset-0 font-normal rounded-full transition-colors cursor-pointer"
                    >
                      <SelectValue placeholder="Select model">
                        {getModelDisplayName(selectedModel)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      {llmModels.map((model) => (
                        <SelectItem 
                          key={model.id} 
                          value={model.id}
                          className="text-xs hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{model.name}</span>
                            {model.isPremium && (
                              <span className="ml-2 text-xs text-green-600 dark:text-green-400">Upgrade</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={(!input.trim() && !pastedImage) || isLoading}
                  size="icon"
                  className="absolute right-2 bottom-2 h-8 w-8 rounded-lg bg-black hover:bg-black/90 disabled:bg-gray-300 dark:disabled:bg-gray-600 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Other tab content placeholders */}
        {activeTab === 'notes' && (
          <div className="flex-1 min-h-0 h-full">
            <PDFViewer 
              pdfUrl={getSamplePDFUrl('sample.pdf')}
              className="h-full"
            />
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