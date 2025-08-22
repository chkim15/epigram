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
import { Send, FileText, BookOpen, MessageSquare, X, SquarePen, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProblemStore } from "@/stores/problemStore";
import { MathContent } from "@/lib/utils/katex";
import { supabase } from "@/lib/supabase/client";
import { Subproblem, Solution, Problem, Document } from "@/types/database";
import dynamic from 'next/dynamic';

// Dynamically import PDFViewerSimple to avoid SSR issues
const PDFViewerSimple = dynamic(
  () => import('@/components/pdf/PDFViewerSimple'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">Loading PDF viewer...</p>
        </div>
      </div>
    )
  }
);
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

// Solutions Tab Component
interface SolutionsTabProps {
  currentProblem: Problem | null;
  currentSubproblems: Subproblem[];
  currentDocument: Document | null;
}

function SolutionsTab({ currentProblem, currentSubproblems, currentDocument }: SolutionsTabProps) {
  const [problemSolutions, setProblemSolutions] = useState<Solution[]>([]);
  const [subproblemSolutions, setSubproblemSolutions] = useState<{ [key: string]: Solution[] }>({});
  const [selectedProblemSolution, setSelectedProblemSolution] = useState(0);
  const [selectedSubproblemSolutions, setSelectedSubproblemSolutions] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  // Fetch solutions when problem changes
  useEffect(() => {
    async function fetchSolutions() {
      if (!currentProblem) {
        setProblemSolutions([]);
        setSubproblemSolutions({});
        setLoading(false);
        return;
      }

      setLoading(true);
      
      // Fetch main problem solutions
      console.log('Fetching solutions for problem ID:', currentProblem.id);
      const { data: mainSolutions, error: mainError } = await supabase
        .from('solutions')
        .select('*')
        .eq('problem_id', currentProblem.id)
        .order('solution_order', { ascending: true });

      console.log('Main solutions query result:', { mainSolutions, mainError });
      
      if (!mainError && mainSolutions) {
        // If no solutions in new table, use legacy solution_text
        console.log('Legacy solution_text:', currentProblem.solution_text);
        if (mainSolutions.length === 0 && currentProblem.solution_text) {
          setProblemSolutions([{
            id: 'legacy',
            problem_id: currentProblem.id,
            subproblem_id: null,
            solution_text: currentProblem.solution_text,
            solution_order: 0,
            created_at: currentProblem.created_at,
            updated_at: currentProblem.updated_at
          }]);
        } else {
          setProblemSolutions(mainSolutions);
        }
      }

      // Fetch subproblem solutions
      const subSolutions: { [key: string]: Solution[] } = {};
      for (const subproblem of currentSubproblems) {
        const { data: sols, error: subError } = await supabase
          .from('solutions')
          .select('*')
          .eq('subproblem_id', subproblem.id)
          .order('solution_order', { ascending: true });

        if (!subError && sols) {
          // If no solutions in new table, use legacy solution_text
          if (sols.length === 0 && subproblem.solution_text) {
            subSolutions[subproblem.key] = [{
              id: `legacy-${subproblem.id}`,
              problem_id: null,
              subproblem_id: subproblem.id,
              solution_text: subproblem.solution_text,
              solution_order: 0,
              created_at: subproblem.created_at,
              updated_at: subproblem.created_at
            }];
          } else {
            subSolutions[subproblem.key] = sols;
          }
        }
      }
      setSubproblemSolutions(subSolutions);
      setLoading(false);
    }

    fetchSolutions();
  }, [currentProblem, currentSubproblems]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>Loading solutions...</p>
        </div>
      </div>
    );
  }

  const hasSolutions = problemSolutions.length > 0 || Object.values(subproblemSolutions).some(sols => sols.length > 0);

  if (!hasSolutions) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <BookOpen className="h-12 w-12 mx-auto mb-2" />
          <p>No solution available for this problem</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-4 space-y-6">
        {/* Main Problem Solutions */}
        {problemSolutions.length > 0 && (
          <div>
            {problemSolutions.length > 1 && (
              <div className="flex gap-2 mb-3">
                {problemSolutions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedProblemSolution(index)}
                    className={cn(
                      "px-3 py-1 text-sm rounded-md transition-colors cursor-pointer",
                      selectedProblemSolution === index
                        ? "bg-black text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                    )}
                  >
                    Solution {index + 1}
                  </button>
                ))}
              </div>
            )}
            <div className="prose max-w-none dark:prose-invert">
              <MathContent 
                content={problemSolutions[selectedProblemSolution]?.solution_text || ''} 
                documentId={currentDocument?.document_id} 
              />
            </div>
          </div>
        )}

        {/* Subproblem Solutions */}
        {Object.entries(subproblemSolutions).map(([key, solutions]) => {
          if (solutions.length === 0) return null;
          const selectedIndex = selectedSubproblemSolutions[key] || 0;
          
          return (
            <div key={key}>
              <div className="font-medium text-blue-600 dark:text-blue-400 mb-2">
                Part {key}
              </div>
              {solutions.length > 1 && (
                <div className="flex gap-2 mb-3">
                  {solutions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedSubproblemSolutions(prev => ({ ...prev, [key]: index }))}
                      className={cn(
                        "px-3 py-1 text-sm rounded-md transition-colors cursor-pointer",
                        selectedIndex === index
                          ? "bg-black text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                      )}
                    >
                      Solution {index + 1}
                    </button>
                  ))}
                </div>
              )}
              <div className="prose max-w-none dark:prose-invert">
                <MathContent 
                  content={solutions[selectedIndex]?.solution_text || ''} 
                  documentId={currentDocument?.document_id} 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type ChatSidebarProps = Record<string, never>

export default function ChatSidebar({}: ChatSidebarProps) {
  // Get current problem from store
  const { currentProblem, currentDocument } = useProblemStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'solutions' | 'comments'>('chat');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [isStreaming, setIsStreaming] = useState(false);
  const [pastedImage, setPastedImage] = useState<{ url: string; file: File } | null>(null);
  const [currentSubproblems, setCurrentSubproblems] = useState<Subproblem[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Available LLM models
  const llmModels: LLMModel[] = [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    { id: 'gpt-5-mini', name: 'GPT-5 Mini' },
    { id: 'gpt-5', name: 'GPT-5' },
  ];
  
  // Get the display name for the selected model
  const getModelDisplayName = (modelId: string) => {
    const model = llmModels.find(m => m.id === modelId);
    return model ? model.name : 'Select model';
  };

  // Fetch subproblems when current problem changes
  useEffect(() => {
    const fetchSubproblems = async () => {
      if (currentProblem?.id) {
        try {
          const { data, error } = await supabase
            .from('subproblems')
            .select('*')
            .eq('problem_id', currentProblem.id)
            .order('key');

          if (error) {
            console.error('Error fetching subproblems:', error);
            setCurrentSubproblems([]);
          } else {
            setCurrentSubproblems(data || []);
          }
        } catch (err) {
          console.error('Error fetching subproblems:', err);
          setCurrentSubproblems([]);
        }
      } else {
        setCurrentSubproblems([]);
      }
    };

    fetchSubproblems();
  }, [currentProblem]);

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
          subproblems: currentSubproblems || [],
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

  const handleExampleClick = (question: string) => {
    setInput(question);
    // Trigger send message after setting input
    setTimeout(() => {
      handleSendMessage();
    }, 0);
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

  const exampleQuestions = [
    "Help me solve this problem one step at a time.",
    "What concepts do I need to review for this problem?",
    "Help me understand this problem visually."
  ];

  const tabs = [
    { id: 'chat', label: 'Chat', icon: MessagesSquare },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'solutions', label: 'Solutions', icon: BookOpen },
    { id: 'comments', label: 'Comments', icon: MessageSquare }
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
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col relative">
            {/* New Chat Icon - Only show when messages exist */}
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 left-2 h-8 w-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 z-10 cursor-pointer"
                onClick={() => {
                  setMessages([]);
                  setInput('');
                }}
                title="Start new chat"
              >
                <SquarePen className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </Button>
            )}
            {/* Messages Area - Scrollable */}
            <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
              {messages.length === 0 && !isLoading ? (
                /* AI Tutor Header - Perfectly centered when no messages */
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md px-4">
                    <MessagesSquare className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <h3 className="text-lg font-medium text-gray-300 mb-6">AI Tutor</h3>
                    <div className="space-y-2">
                      {exampleQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleExampleClick(question)}
                          className="block w-full text-left px-3 py-2 text-sm rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
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
                        message.role === 'user' ? "justify-end" : "justify-center"
                      )}
                    >
                      {message.role === 'user' ? (
                        <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100">
                          <p className="leading-relaxed">{message.content}</p>
                        </div>
                      ) : (
                        <div className="max-w-[94%] w-full">
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
                    <div className="flex justify-center">
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
            <div className="flex-shrink-0 bg-white dark:bg-gray-900 px-2 py-2">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="Ask questions about math"
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
                          className="text-xs hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700 cursor-pointer"
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
            <PDFViewerSimple 
              pdfUrl={getSamplePDFUrl('sample.pdf')}
              className="h-full"
            />
          </div>
        )}

        {activeTab === 'solutions' && (
          <SolutionsTab 
            currentProblem={currentProblem}
            currentSubproblems={currentSubproblems}
            currentDocument={currentDocument}
          />
        )}

        {activeTab === 'comments' && (
          <div className="h-full overflow-y-auto custom-scrollbar">
            {(currentProblem?.comment || currentSubproblems.some(sp => sp.comment)) ? (
              <div className="p-4 space-y-6">
                {currentProblem?.comment && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Main Problem</h3>
                    <div className="prose max-w-none dark:prose-invert">
                      <MathContent content={currentProblem.comment} documentId={currentDocument?.document_id} />
                    </div>
                  </div>
                )}
                {currentSubproblems.length > 0 && currentSubproblems.some(sp => sp.comment) && (
                  <div className="space-y-4">
                    {currentSubproblems.filter(sp => sp.comment).map((subproblem) => (
                      <div key={subproblem.id}>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Part {subproblem.key}
                        </h3>
                        <div className="prose max-w-none dark:prose-invert">
                          <MathContent content={subproblem.comment || ''} documentId={currentDocument?.document_id} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-4">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2" />
                  <p>No comments available for this problem</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}