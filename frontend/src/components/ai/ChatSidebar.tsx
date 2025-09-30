"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, FileText, BookOpen, X, SquarePen, MessagesSquare, Sigma } from "lucide-react";
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

interface MathFieldElement extends HTMLElement {
  value?: string;
  getValue?: () => string;
}

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
    // Reset solution selection and sub-tab when problem changes
    setSelectedProblemSolution(0);
    setSelectedSubproblemSolutions({});
    setActiveSubTab('solutions');

    // Scroll to top when problem changes
    const scrollContainer = document.querySelector('.solutions-tab-content');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }

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
        <div className="text-center" style={{ color: 'var(--muted-foreground)' }}>
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
        <div className="text-center" style={{ color: 'var(--muted-foreground)' }}>
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
                    // Scroll to top when switching solutions
                    const scrollContainer = document.querySelector('.solutions-tab-content');
                    if (scrollContainer) {
                      scrollContainer.scrollTop = 0;
                    }
                  }}
                  className="px-3 py-1 text-sm rounded-xl transition-colors cursor-pointer"
                  style={{
                    backgroundColor: activeSubTab === 'solutions' && selectedProblemSolution === index ? 'var(--primary)' : 'var(--secondary)',
                    color: activeSubTab === 'solutions' && selectedProblemSolution === index ? 'var(--primary-foreground)' : 'var(--foreground)'
                  }}
                >
                  Solution {index + 1}
                </button>
              ))}
            </>
          ) : hasSolutions ? (
            <button
              onClick={() => {
                setActiveSubTab('solutions');
                // Scroll to top when switching to solutions tab
                const scrollContainer = document.querySelector('.solutions-tab-content');
                if (scrollContainer) {
                  scrollContainer.scrollTop = 0;
                }
              }}
              className="px-3 py-1 text-sm rounded-xl transition-colors cursor-pointer"
              style={{
                backgroundColor: activeSubTab === 'solutions' ? 'var(--primary)' : 'var(--secondary)',
                color: activeSubTab === 'solutions' ? 'var(--primary-foreground)' : 'var(--foreground)'
              }}
            >
              Solution
            </button>
          ) : null}
          {hasComments && (
            <button
              onClick={() => {
                setActiveSubTab('comments');
                // Scroll to top when switching to comments tab
                const scrollContainer = document.querySelector('.solutions-tab-content');
                if (scrollContainer) {
                  scrollContainer.scrollTop = 0;
                }
              }}
              className="px-3 py-1 text-sm rounded-xl transition-colors cursor-pointer"
              style={{
                backgroundColor: activeSubTab === 'comments' ? 'var(--primary)' : 'var(--secondary)',
                color: activeSubTab === 'comments' ? 'var(--primary-foreground)' : 'var(--foreground)'
              }}
            >
              Comments
            </button>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar solutions-tab-content">
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

                {/* Subproblem Solutions - Only show if current problem has subproblems */}
                {currentSubproblems.length > 0 && Object.entries(subproblemSolutions).map(([key, solutions]) => {
                  if (solutions.length === 0) return null;
                  const selectedIndex = selectedSubproblemSolutions[key] || 0;
                  
                  return (
                    <div key={key}>
                      <div className="text-lg font-medium mb-2" style={{ color: '#a16207' }}>
                        {key}.
                      </div>
                      {solutions.length > 1 && (
                        <div className="flex gap-2 mb-3">
                          {solutions.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setSelectedSubproblemSolutions(prev => ({ ...prev, [key]: index }));
                                // Scroll to top when switching subproblem solutions
                                const scrollContainer = document.querySelector('.solutions-tab-content');
                                if (scrollContainer) {
                                  scrollContainer.scrollTop = 0;
                                }
                              }}
                              className="px-3 py-1 text-sm rounded-xl transition-colors cursor-pointer"
                              style={{
                                backgroundColor: selectedIndex === index ? 'var(--foreground)' : 'var(--secondary)',
                                color: selectedIndex === index ? 'var(--background)' : 'var(--foreground)'
                              }}
                              onMouseEnter={(e) => {
                                if (selectedIndex !== index) {
                                  e.currentTarget.style.backgroundColor = 'var(--muted)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (selectedIndex !== index) {
                                  e.currentTarget.style.backgroundColor = 'var(--secondary)';
                                }
                              }}
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
              <div className="prose max-w-none dark:prose-invert">
                <MathContent content={currentProblem.comment} documentId={currentDocument?.document_id} />
              </div>
            )}
            {currentSubproblems.length > 0 && currentSubproblems.some(sp => sp.comment) && (
              <div className="space-y-4">
                {currentSubproblems.filter(sp => sp.comment).map((subproblem) => (
                  <div key={subproblem.id}>
                    <h3 className="text-lg font-medium mb-2" style={{ color: '#a16207' }}>
                      {subproblem.key}.
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
  currentTopicId?: number | null;  // Add this to track handout topic
}

export default function ChatSidebar({ mode = 'problems', currentTopicId }: ChatSidebarProps) {
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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messageOrder, setMessageOrder] = useState(0);
  const contentEditableRef = useRef<HTMLDivElement>(null);

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
    // Reset chat when problem changes
    setMessages([]);
    setSessionId(null);
    setMessageOrder(0);
    setInput('');
    setPastedImage(null);
    // Clear contenteditable
    if (contentEditableRef.current) {
      contentEditableRef.current.innerHTML = '';
    }

    const fetchSolutions = async () => {
      if (!currentProblem) {
        setProblemSolutions([]);
        setSubproblemSolutions({});
        return;
      }

      // Fetch main problem solutions
      console.log('Fetching solutions for problem:', currentProblem.id, currentProblem.problem_id);
      const { data: mainSolutions, error: mainError } = await supabase
        .from('solutions')
        .select('*')
        .eq('problem_id', currentProblem.id)
        .order('solution_order', { ascending: true });

      console.log('Main solutions fetched:', mainSolutions);

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
      console.log('Fetching subproblem solutions for:', currentSubproblems);
      const subSolutions: { [key: string]: Solution[] } = {};
      for (const subproblem of currentSubproblems) {
        const { data: sols, error: subError } = await supabase
          .from('solutions')
          .select('*')
          .eq('subproblem_id', subproblem.id)
          .order('solution_order', { ascending: true });

        console.log(`Subproblem ${subproblem.key} solutions:`, sols);

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
      console.log('Final subproblem solutions set:', subSolutions);
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

  // Helper function to generate a new session ID
  const generateSessionId = () => {
    return crypto.randomUUID ? crypto.randomUUID() :
           `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Save chat message to database
  const saveChatMessage = async (
    role: 'user' | 'assistant',
    content: string,
    order: number
  ) => {
    if (!user) return;

    // Generate session ID if not exists
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = generateSessionId();
      setSessionId(currentSessionId);
    }

    // Determine context type and IDs
    let contextType: 'problem' | 'handout' | 'general' = 'general';
    let problemId = null;
    let topicId = null;

    if (mode === 'problems' && currentProblem) {
      contextType = 'problem';
      problemId = currentProblem.id;
    } else if (mode === 'handouts' && currentTopicId) {
      contextType = 'handout';
      topicId = currentTopicId;
    }

    try {
      await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          problem_id: problemId,
          topic_id: topicId,
          session_id: currentSessionId,
          role,
          content,
          message_order: order,
          context_type: contextType
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
      image: pastedImage?.url, // Keep base64 for local display
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setPastedImage(null);

    // Clear contenteditable
    if (contentEditableRef.current) {
      contentEditableRef.current.innerHTML = '';
    }
    setIsLoading(true);

    // Save user message to database
    const currentMessageOrder = messageOrder;
    await saveChatMessage('user', userMessage.content, currentMessageOrder);

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
                      // Update the last message with new content
                      fullContent += data.content;
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
            // Save the complete assistant response
            if (fullContent) {
              await saveChatMessage('assistant', fullContent, currentMessageOrder);
              setMessageOrder(prev => prev + 1);
            }
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

        // Save assistant response to database
        await saveChatMessage('assistant', aiResponse.content, currentMessageOrder);
        setMessageOrder(prev => prev + 1);
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

  const insertMathField = () => {
    const contentEditable = contentEditableRef.current;
    if (!contentEditable) return;

    // Clean up any empty math fields first
    const existingMathFields = contentEditable.querySelectorAll('math-field');
    existingMathFields.forEach(field => {
      if (!field.getAttribute('value')) {
        field.remove();
      }
    });

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      // If no selection, focus the contentEditable and place cursor at end
      contentEditable.focus();
      const range = document.createRange();
      range.selectNodeContents(contentEditable);
      range.collapse(false);
      const newSelection = window.getSelection();
      if (newSelection) {
        newSelection.removeAllRanges();
        newSelection.addRange(range);
      }
      return insertMathField(); // Retry with the new selection
    }

    const range = selection.getRangeAt(0);

    // Check if the selection is within our contentEditable
    if (!contentEditable.contains(range.commonAncestorContainer)) {
      contentEditable.focus();
      const newRange = document.createRange();
      newRange.selectNodeContents(contentEditable);
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

    // Disable virtual keyboard and menu
    mathField.setAttribute('virtual-keyboard-mode', 'off');
    mathField.setAttribute('menu', 'false');

    // Insert the math field at cursor position
    range.deleteContents();
    range.insertNode(mathField);

    // Add a space after the math field for better cursor placement
    const spaceAfter = document.createTextNode('\u00A0'); // Non-breaking space
    mathField.parentNode?.insertBefore(spaceAfter, mathField.nextSibling);

    // Move cursor after the space
    range.setStartAfter(spaceAfter);
    range.setEndAfter(spaceAfter);
    selection.removeAllRanges();
    selection.addRange(range);

    // Add event listeners to manage inactive class
    mathField.addEventListener('focus', () => {
      mathField.classList.remove('inactive');
    });

    mathField.addEventListener('blur', () => {
      // Add inactive class when field loses focus to hide the menu
      setTimeout(() => {
        mathField.classList.add('inactive');
      }, 100);
    });

    // Focus the math field
    setTimeout(() => {
      mathField.focus();
    }, 0);

    // Trigger input event to update the value
    handleContentEditableChange(contentEditable);
  };

  const getContentEditableText = (element: HTMLDivElement): string => {
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
          result += `$$${latex}$$`;
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

    for (const child of Array.from(element.childNodes)) {
      processNode(child);
    }

    return result.trim();
  };

  const handleContentEditableChange = (element: HTMLDivElement) => {
    const text = getContentEditableText(element);
    setInput(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleExampleClick = (question: string) => {
    setInput(question);
    // Set contenteditable content
    if (contentEditableRef.current) {
      contentEditableRef.current.innerText = question;
    }
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
    <div className="h-full flex flex-col overflow-hidden" style={{ height: '100%', maxHeight: '100%', backgroundColor: 'var(--background)' }}>
      {/* Navigation Tabs */}
      <div className="flex-shrink-0 flex border rounded-xl m-2 p-1" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            className="flex-1 text-sm h-8 rounded-xl transition-all cursor-pointer"
            style={{
              backgroundColor: activeTab === tab.id ? 'var(--sidebar-accent)' : 'transparent',
              color: activeTab === tab.id ? 'var(--foreground)' : 'var(--muted-foreground)'
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="h-3 w-3 mr-1" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
        {activeTab === 'chat' && (
          <div className="h-full flex flex-col relative overflow-hidden">
            {/* New Chat Icon - Only show when messages exist */}
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 left-2 h-8 w-8 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 z-10 cursor-pointer"
                onClick={() => {
                  setMessages([]);
                  setInput('');
                  setSessionId(null);  // Reset session when starting new chat
                  setMessageOrder(0);
                  // Clear contenteditable
                  if (contentEditableRef.current) {
                    contentEditableRef.current.innerHTML = '';
                  }
                }}
                title="Start new chat"
              >
                <SquarePen className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
              </Button>
            )}
            {/* Messages Area - Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar chat-messages-area" style={{ backgroundColor: 'var(--background)' }}>
              {messages.length === 0 && !isLoading ? (
                /* AI Tutor Header - Different content based on mode */
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-lg px-4">
                    <MessagesSquare className="h-12 w-12 mx-auto mb-2" style={{ color: 'var(--muted-foreground)' }} />
                    <h3 className="text-lg font-medium mb-6" style={{ color: 'var(--muted-foreground)' }}>AI Tutor</h3>
                    {mode === 'handouts' ? (
                      <div className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
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
                            className="block w-full text-left px-3 py-2 text-sm rounded-xl border transition-colors cursor-pointer hover:opacity-80"
                            style={{
                              backgroundColor: 'var(--background)',
                              borderColor: 'var(--border)',
                              color: 'var(--muted-foreground)'
                            }}
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
                        <div className="max-w-[80%] rounded-xl px-3 py-2 text-sm" style={{ backgroundColor: 'var(--muted)', color: 'var(--foreground)' }}>
                          <p className="leading-relaxed">{message.content}</p>
                        </div>
                      ) : (
                        <div className="max-w-[94%] w-full">
                          <div className="prose prose-sm max-w-none dark:prose-invert" style={{ color: 'var(--foreground)' }}>
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
            <div className="flex-shrink-0 px-2 py-2 relative" style={{ backgroundColor: 'var(--background)' }}>
              <div className="relative">
                <div className={cn(
                  "rounded-2xl border",
                  pastedImage ? "min-h-[140px]" : "min-h-[90px]"
                )} style={{ backgroundColor: 'var(--input)', borderColor: 'var(--border)' }}>
                  <div
                    ref={contentEditableRef}
                    contentEditable
                    className={cn(
                      "w-full overflow-y-auto px-3 pb-12 outline-none bg-transparent custom-scrollbar",
                      pastedImage ? "pt-16 min-h-[140px]" : "pt-3 min-h-[90px]"
                    )}
                    style={{
                      color: 'var(--foreground)',
                      maxHeight: '200px',
                      outline: 'none',
                      boxShadow: 'none',
                      fontSize: '16px',
                      lineHeight: '24px',
                      cursor: 'text'
                    }}
                    data-placeholder={mode === 'handouts' ? "Ask questions about this topic" : "Ask questions about this problem"}
                    onInput={(e) => handleContentEditableChange(e.currentTarget)}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    suppressContentEditableWarning={true}
                  />

                  {/* Math Button at Bottom Left */}
                  <button
                    className="absolute left-2 bottom-2 h-8 w-10 rounded-xl border cursor-pointer flex items-center justify-center"
                    aria-label="Insert math equation"
                    onClick={insertMathField}
                    style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
                  >
                    <Sigma className="h-5 w-5" aria-hidden="true" style={{ color: 'var(--foreground)' }} />
                  </button>
                </div>
                
                {/* Image Preview Inside Input */}
                {pastedImage && (
                  <div className="absolute top-3 left-3 right-14">
                    <div className="relative inline-block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={pastedImage.url}
                        alt="Pasted image" 
                        className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 object-cover"
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

                {/* Send Button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={(!input.trim() && !pastedImage) || isLoading}
                  size="icon"
                  className="absolute right-2 bottom-2 h-8 w-8 rounded-xl disabled:bg-gray-300 dark:disabled:bg-gray-600 cursor-pointer disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--primary)'
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