"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, FileText, BookOpen, X, SquarePen, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProblemStore } from "@/stores/problemStore";
import { MathContent } from "@/lib/utils/katex";
import { supabase } from "@/lib/supabase/client";
import { Subproblem, Solution, Problem, Document } from "@/types/database";
import { useAuthStore } from "@/stores/authStore";
import { TopicHandoutsViewer } from '@/components/handouts/TopicHandoutsViewer';
import { useActiveLearning } from "@/hooks/useActiveLearning";
import ActiveLearningPrompt from "@/components/problems/ActiveLearningPrompt";
import { NotesTab } from '@/components/notes/NotesTab';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  image?: string; // Base64 image data
}


// Solutions Tab Component
interface SolutionsTabProps {
  currentProblem: Problem | null;
  currentSubproblems: Subproblem[];
  currentDocument: Document | null;
  problemSolutions?: Solution[];
  subproblemSolutions?: { [key: string]: Solution[] };
}

function SolutionsTab({ 
  currentProblem, 
  currentSubproblems, 
  currentDocument,
  problemSolutions: parentProblemSolutions,
  subproblemSolutions: parentSubproblemSolutions 
}: SolutionsTabProps) {
  const [problemSolutions, setProblemSolutions] = useState<Solution[]>(parentProblemSolutions || []);
  const [subproblemSolutions, setSubproblemSolutions] = useState<{ [key: string]: Solution[] }>(parentSubproblemSolutions || {});
  const [selectedProblemSolution, setSelectedProblemSolution] = useState(0);
  const [selectedSubproblemSolutions, setSelectedSubproblemSolutions] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'solutions' | 'comments'>('solutions');
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState<{ [key: string]: boolean }>({});
  const { isActiveLearningMode } = useActiveLearning();
  const { user } = useAuthStore();

  // Update solutions when parent provides them
  useEffect(() => {
    if (parentProblemSolutions !== undefined) {
      setProblemSolutions(parentProblemSolutions);
    }
    if (parentSubproblemSolutions !== undefined) {
      setSubproblemSolutions(parentSubproblemSolutions);
    }
  }, [parentProblemSolutions, parentSubproblemSolutions]);

  // Check if user has submitted answers
  useEffect(() => {
    const checkSubmittedAnswers = async () => {
      if (!user || !currentProblem) {
        setHasSubmittedAnswer({});
        return;
      }

      try {
        // Check main problem answer
        const { data: mainAnswer } = await supabase
          .from('user_answers')
          .select('id')
          .eq('user_id', user.id)
          .eq('problem_id', currentProblem.id)
          .is('subproblem_id', null)
          .limit(1);

        const submitted: { [key: string]: boolean } = {
          main: !!(mainAnswer && mainAnswer.length > 0)
        };

        // Check subproblem answers
        for (const subproblem of currentSubproblems) {
          const { data: subAnswer } = await supabase
            .from('user_answers')
            .select('id')
            .eq('user_id', user.id)
            .eq('subproblem_id', subproblem.id)
            .limit(1);

          submitted[`sub_${subproblem.key}`] = !!(subAnswer && subAnswer.length > 0);
        }

        setHasSubmittedAnswer(submitted);
      } catch (err) {
        console.error('Error checking submitted answers:', err);
      }
    };

    checkSubmittedAnswers();
  }, [user, currentProblem, currentSubproblems]);

  // Listen for answer submission events from ProblemViewer
  useEffect(() => {
    const handleAnswerSubmitted = (event: CustomEvent) => {
      if (event.detail.problemId === currentProblem?.id) {
        // Re-check submitted answers when an answer is submitted
        const checkSubmittedAnswers = async () => {
          if (!user || !currentProblem) return;

          try {
            // Check main problem answer
            const { data: mainAnswer } = await supabase
              .from('user_answers')
              .select('id')
              .eq('user_id', user.id)
              .eq('problem_id', currentProblem.id)
              .is('subproblem_id', null)
              .limit(1);

            const submitted: { [key: string]: boolean } = {
              main: !!(mainAnswer && mainAnswer.length > 0)
            };

            // Check subproblem answers
            for (const subproblem of currentSubproblems) {
              const { data: subAnswer } = await supabase
                .from('user_answers')
                .select('id')
                .eq('user_id', user.id)
                .eq('subproblem_id', subproblem.id)
                .limit(1);

              submitted[`sub_${subproblem.key}`] = !!(subAnswer && subAnswer.length > 0);
            }

            setHasSubmittedAnswer(submitted);
          } catch (err) {
            console.error('Error checking submitted answers:', err);
          }
        };

        checkSubmittedAnswers();
      }
    };

    window.addEventListener('answerSubmitted', handleAnswerSubmitted as EventListener);
    return () => {
      window.removeEventListener('answerSubmitted', handleAnswerSubmitted as EventListener);
    };
  }, [user, currentProblem, currentSubproblems]);

  // Fetch solutions when problem changes (only if not provided by parent)
  useEffect(() => {
    async function fetchSolutions() {
      // Skip fetching if parent already provides solutions
      if (parentProblemSolutions !== undefined && parentSubproblemSolutions !== undefined) {
        setLoading(false);
        return;
      }

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
  }, [currentProblem, currentSubproblems, parentProblemSolutions, parentSubproblemSolutions]);

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
  const hasComments = currentProblem?.comment || currentSubproblems.some(sp => sp.comment);
  const hasMultipleSolutions = problemSolutions.length > 1;
  const showTabs = hasMultipleSolutions || (hasSolutions && hasComments);

  if (!hasSolutions && !hasComments) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <BookOpen className="h-12 w-12 mx-auto mb-2" />
          <p>No solution or comments available for this problem</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Sub-tabs for Solutions and Comments */}
      {showTabs && (
        <div className="flex gap-2 px-4 pt-4 pb-2">
          {hasMultipleSolutions ? (
            <>
              {problemSolutions.map((_, index) => (
                <button
                  key={`sol-${index}`}
                  onClick={() => {
                    setActiveSubTab('solutions');
                    setSelectedProblemSolution(index);
                  }}
                  className={cn(
                    "px-3 py-1 text-sm rounded-md transition-colors cursor-pointer",
                    activeSubTab === 'solutions' && selectedProblemSolution === index
                      ? "bg-black text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  )}
                >
                  Solution {index + 1}
                </button>
              ))}
            </>
          ) : hasSolutions ? (
            <button
              onClick={() => setActiveSubTab('solutions')}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors cursor-pointer",
                activeSubTab === 'solutions'
                  ? "bg-black text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              )}
            >
              Solution
            </button>
          ) : null}
          {hasComments && (
            <button
              onClick={() => setActiveSubTab('comments')}
              className={cn(
                "px-3 py-1 text-sm rounded-md transition-colors cursor-pointer",
                activeSubTab === 'comments'
                  ? "bg-black text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              )}
            >
              Comments
            </button>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeSubTab === 'solutions' && hasSolutions ? (
          (() => {
            // Check if any solutions are locked due to active learning mode
            const hasLockedSolutions = isActiveLearningMode && user && (
              (!hasSubmittedAnswer.main && problemSolutions.length > 0) ||
              Object.keys(subproblemSolutions).some(key => !hasSubmittedAnswer[`sub_${key}`])
            );

            // If there are locked solutions, show single prompt
            if (hasLockedSolutions) {
              return <ActiveLearningPrompt problemKey="main" />;
            }

            // Otherwise show normal solutions
            return (
              <div className="p-4 space-y-6">
                {/* Main Problem Solutions */}
                {problemSolutions.length > 0 && (
                  <div>
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
            );
          })()
        ) : activeSubTab === 'comments' && hasComments ? (
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
        ) : null}
      </div>
    </div>
  );
}

interface ChatSidebarProps {
  mode?: 'problems' | 'handouts';
}

export default function ChatSidebar({ mode = 'problems' }: ChatSidebarProps) {
  // Get current problem from store
  const { currentProblem, currentDocument } = useProblemStore();
  const { user } = useAuthStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'handouts' | 'solutions' | 'notes'>('chat');
  const selectedModel = 'gpt-5';
  const [pastedImage, setPastedImage] = useState<{ url: string; file: File } | null>(null);
  const [currentSubproblems, setCurrentSubproblems] = useState<Subproblem[]>([]);
  const [problemSolutions, setProblemSolutions] = useState<Solution[]>([]);
  const [subproblemSolutions, setSubproblemSolutions] = useState<{ [key: string]: Solution[] }>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-activate chat tab when in handouts mode
  useEffect(() => {
    if (mode === 'handouts') {
      setActiveTab('chat');
    }
  }, [mode]);


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

  // Fetch solutions when current problem changes
  useEffect(() => {
    const fetchSolutions = async () => {
      if (!currentProblem) {
        setProblemSolutions([]);
        setSubproblemSolutions({});
        return;
      }

      // Fetch main problem solutions
      const { data: mainSolutions, error: mainError } = await supabase
        .from('solutions')
        .select('*')
        .eq('problem_id', currentProblem.id)
        .order('solution_order', { ascending: true });

      if (!mainError && mainSolutions) {
        // If no solutions in new table, use legacy solution_text
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
      } else {
        setProblemSolutions([]);
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
    };

    fetchSolutions();
  }, [currentProblem, currentSubproblems]);

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

  const saveUserMessageToDatabase = async (message: string, model?: string) => {
    if (!user || !currentProblem) return;

    try {
      await supabase
        .from('user_chat_messages')
        .insert({
          user_id: user.id,
          problem_id: currentProblem.id,
          message: message,
          role: 'user',
          model: model || null
        });
    } catch (error) {
      console.error('Failed to save message to database:', error);
    }
  };

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

    // Save user message to database
    await saveUserMessageToDatabase(userMessage.content, selectedModel);

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
          solutions: problemSolutions || [],
          subproblemSolutions: subproblemSolutions || {},
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
    "Help me with the next step of solving this problem",
    "What concepts do I need to review for this problem?",
    "Create a plot and help me understand this problem visually."
  ];

  const tabs = mode === 'problems' 
    ? [
        { id: 'chat', label: 'AI Tutor', icon: MessagesSquare },
        { id: 'handouts', label: 'Handouts', icon: FileText },
        { id: 'solutions', label: 'Solutions', icon: BookOpen },
        { id: 'notes', label: 'Notes', icon: SquarePen }
      ] as const
    : [
        { id: 'chat', label: 'AI Tutor', icon: MessagesSquare }
      ] as const;

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ height: '100%', maxHeight: '100%' }}>
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
          <div className="h-full flex flex-col relative overflow-hidden">
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
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar chat-messages-area">
              {messages.length === 0 && !isLoading ? (
                /* AI Tutor Header - Different content based on mode */
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-lg px-4">
                    <MessagesSquare className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <h3 className="text-lg font-medium text-gray-300 mb-6">AI Tutor</h3>
                    {mode === 'handouts' ? (
                      <div className="text-sm text-gray-400">
                        <p className="mb-4">
                          Ask questions about the handout content or concepts.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {exampleQuestions.map((question, index) => (
                          <button
                            key={index}
                            onClick={() => handleExampleClick(question)}
                            className="block w-full text-left px-3 py-2 text-sm rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
                          >
                            {question}
                          </button>
                        ))}
                      </div>
                    )}
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
            <div className="flex-shrink-0 bg-white dark:bg-gray-900 px-2 py-2 border-t border-gray-200 dark:border-gray-700 relative">
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

        {/* Other tab content */}
        {activeTab === 'handouts' && (
          <div className="flex-1 min-h-0 h-full">
            <TopicHandoutsViewer 
              problemId={currentProblem?.id || null}
            />
          </div>
        )}

        {activeTab === 'solutions' && (
          <SolutionsTab 
            currentProblem={currentProblem}
            currentSubproblems={currentSubproblems}
            problemSolutions={problemSolutions}
            subproblemSolutions={subproblemSolutions}
            currentDocument={currentDocument}
          />
        )}

        {activeTab === 'notes' && (
          <NotesTab currentProblem={currentProblem} />
        )}
      </div>
    </div>
  );
}